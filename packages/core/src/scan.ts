import type { Food, Goal, Targets } from './types';
import { normalize } from './foodlog';

/** Lo que devuelve la Edge Function `scan-food` por cada alimento detectado. */
export type ScanItem = { name: string; grams: number; confidence: number; per100?: { kcal: number; p: number; c: number; f: number } | null };

// Palabras que no distinguen un alimento: artículos, preposiciones y formas de cocción.
const STOP = new Set(
  'de del la el los las con en a al y o un una sin para por su tipo estilo cocido cocida cocidos cocidas sancochado sancochada hervido hervida plancha horno vapor crudo cruda natural casero casera'.split(' '),
);

/** Raíz simple en español: quita el plural y la vocal final ("papas" → "pap", "fritas"/"frito" → "frit"). */
const stem = (w: string) => {
  if (w.length > 5 && w.endsWith('es')) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith('s')) w = w.slice(0, -1);
  return w.length > 3 ? w.replace(/[aeiou]$/, '') : w;
};

const tokens = (s: string) =>
  normalize(s)
    .replace(/[^a-z0-9ñ ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w))
    .map(stem);

/**
 * Alimento de la base que mejor corresponde a un nombre dado por la IA ("pechuga de pollo a la plancha"
 * → Pechuga de pollo), o `null` si ninguno se parece lo suficiente.
 * Puntaje: fracción de palabras de la consulta encontradas + la mitad de la fracción de palabras del alimento cubiertas.
 */
export function matchFood(foods: Record<string, Food>, name: string): Food | null {
  const q = tokens(name);
  if (!q.length) return null;
  let best: Food | null = null;
  let bestScore = 0;
  for (const f of Object.values(foods)) {
    const ft = tokens(f.name);
    if (!ft.length) continue;
    const hitQ = q.filter((w) => ft.includes(w)).length;
    if (!hitQ) continue;
    const score = hitQ / q.length + (0.5 * ft.filter((w) => q.includes(w)).length) / ft.length;
    if (score > bestScore) {
      best = f;
      bestScore = score;
    }
  }
  return bestScore >= 0.75 ? best : null;
}

/**
 * Alimento para un componente detectado en una foto. Si el nombre coincide del todo con uno de la base, se
 * usa ese. Si coincide solo en parte ("arroz frito" → Arroz) y la IA estimó valores, la base solo vale cuando
 * sus kcal se parecen (±30 %): si no, `null` y se registra la estimación de la IA (el frito lleva aceite).
 */
export function scanFood(foods: Record<string, Food>, item: Pick<ScanItem, 'name' | 'per100'>): Food | null {
  const m = matchFood(foods, item.name);
  if (!m) return null;
  const ai = item.per100?.kcal;
  if (!ai || !m.kcal) return m;
  const ft = tokens(m.name);
  if (tokens(item.name).every((w) => ft.includes(w))) return m;
  const ratio = ai / m.kcal;
  return ratio > 1.3 || ratio < 0.7 ? null : m;
}

export type Verdict ={ level: 'ok' | 'protein' | 'tight' | 'over'; text: string };

export function verdict(item: { kcal: number; p: number }, eaten: { kcal: number }, t: Targets, goal: Goal): Verdict {
  const after = eaten.kcal + item.kcal;
  const left = t.kcal - eaten.kcal;
  const pd = item.kcal > 0 ? (item.p * 4) / item.kcal : 0;
  if (after > t.kcal * 1.05) {
    return { level: 'over', text: `Te pasarías ${Math.round(after - t.kcal)} kcal de tu meta de hoy.` };
  }
  if (goal === 'gain' && pd >= 0.25) {
    return {
      level: 'protein',
      text: `Muy bueno para ganar masa: ${Math.round(pd * 100)}% de sus calorías son proteína.`,
    };
  }
  if (goal === 'lose' && pd >= 0.3) {
    return { level: 'protein', text: 'Saciante y alto en proteína, ideal para perder grasa.' };
  }
  if (item.kcal > left * 0.8) {
    return { level: 'tight', text: 'Ocupa casi todas las calorías que te quedan hoy.' };
  }
  return { level: 'ok', text: 'Encaja bien con tu día.' };
}

export type CoachTip = {
  emoji: string;
  text: string;
  /** Acción directa: registrar estos gramos de este alimento (solo cuando falta proteína). */
  action?: { foodId: string; grams: number };
};

/** Sección 9.7: sugerencia del coach por reglas, sin IA y sin culpa. */
export function coachMessage(
  eaten: { kcal: number; p: number; logs: number },
  t: Targets,
  best?: { id?: string; name: string; pPer100: number } | null,
): CoachTip {
  if (eaten.logs === 0) return { emoji: '👋', text: 'Empieza registrando tu primera comida. Toca ＋ o usa la cámara.' };
  if (eaten.kcal > t.kcal + 100) {
    return { emoji: '🥗', text: 'En tu siguiente comida prioriza proteína y verduras. Mañana sigues con tu plan.' };
  }
  const missingP = t.protein - eaten.p;
  if (missingP > 25 && best && best.pPer100 > 0) {
    const grams = Math.min(300, Math.ceil(missingP / (best.pPer100 / 100) / 10) * 10);
    return {
      emoji: '🎯',
      text: `Te faltan ${Math.round(missingP)} g de proteína. ${grams} g de ${best.name.toLowerCase()} los cubren.`,
      ...(best.id ? { action: { foodId: best.id, grams } } : {}),
    };
  }
  const left = t.kcal - eaten.kcal;
  if (left < 150) return { emoji: '✅', text: 'Día casi completo. Toma agua y descansa bien.' };
  return { emoji: '💧', text: `Vas bien. Te quedan ${Math.round(left)} kcal para hoy.` };
}
