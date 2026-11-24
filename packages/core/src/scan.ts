import type { Food, Goal, Targets } from './types';
import { normalize } from './foodlog';

/** Lo que devuelve la Edge Function `scan-food` por cada alimento detectado. `alts`: con qué se confunde a la vista. */
export type ScanItem = { name: string; grams: number; confidence: number; per100?: { kcal: number; p: number; c: number; f: number } | null; alts?: string[] };

// Palabras que no distinguen un alimento: artículos, preposiciones, formas de cocción y de corte.
const STOP = new Set(
  (
    'de del la el los las con en a al y o un una sin para por su tipo estilo cocido cocida cocidos cocidas sancochado sancochada hervido hervida plancha horno vapor crudo cruda natural casero casera ' +
    'rodaja rodajas trozo trozos tajada tajadas pedazo pedazos hoja hojas vaso taza botella lata porcion'
  ).split(' '),
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

const NAMES = new WeakMap<Food, string[][]>();
/** Nombre y otros nombres (`aka`) del alimento, ya en raíces. */
const namesOf = (f: Food) => {
  let n = NAMES.get(f);
  if (!n) NAMES.set(f, (n = [f.name, ...(f.aka?.split('|') ?? [])].map(tokens).filter((t) => t.length)));
  return n;
};

/**
 * Alimento que mejor corresponde a un nombre y si coincide del todo (todas las palabras de la consulta están en él).
 * La primera palabra manda: "puré de papa amarilla" es un puré, no una papa, y "jugo de piña" no es piña. La
 * excepción son las marcas ("gaseosa Inca Kola"), que valen si aparecen completas.
 */
function bestMatch(foods: Record<string, Food>, name: string): { food: Food; full: boolean } | null {
  const q = tokens(name);
  if (!q.length) return null;
  let best: { food: Food; full: boolean } | null = null;
  let bestScore = 0;
  for (const food of Object.values(foods)) {
    for (const ft of namesOf(food)) {
      const hitQ = q.filter((w) => ft.includes(w)).length;
      const hitF = ft.filter((w) => q.includes(w)).length;
      const brand = !!food.kw && hitF === ft.length;
      if (!ft.includes(q[0]) && !brand) continue;
      // Fracción de la consulta encontrada + la mitad de lo cubierto del alimento; a igualdad, el que empieza igual.
      const score = hitQ / q.length + (0.5 * hitF) / ft.length + (ft[0] === q[0] ? 0.01 : 0);
      if (score > bestScore) {
        best = { food, full: hitQ === q.length };
        bestScore = score;
      }
    }
  }
  return bestScore >= 0.8 ? best : null;
}

/** Alimento de la base que mejor corresponde a un nombre dado por la IA, o `null` si ninguno se parece lo suficiente. */
export const matchFood = (foods: Record<string, Food>, name: string): Food | null => bestMatch(foods, name)?.food ?? null;

/**
 * Alimento para un componente detectado en una foto. Si el nombre coincide del todo con uno de la base, se
 * usa ese. Si coincide solo en parte ("arroz frito" → Arroz) y la IA estimó valores, la base solo vale cuando
 * sus kcal se parecen (±30 %): si no, `null` y se registra la estimación de la IA (el frito lleva aceite).
 */
export function scanFood(foods: Record<string, Food>, item: Pick<ScanItem, 'name' | 'per100'>): Food | null {
  const m = bestMatch(foods, item.name);
  if (!m) return null;
  const ai = item.per100?.kcal;
  if (!ai || !m.food.kcal || m.full) return m.food;
  const ratio = ai / m.food.kcal;
  return ratio > 1.3 || ratio < 0.7 ? null : m.food;
}

/** Alimentos que se ven casi igual en una foto: se ofrecen para cambiarlos de un toque. */
const LOOKALIKES = [
  ['pepino', 'pepinillo', 'zapallito', 'papa'],
  ['pure', 'papa_amarilla', 'pure_camote', 'pure_zapallo', 'aji_gallina', 'huancaina', 'crema_aji'],
  ['maracuya_ref', 'pina_agua', 'manzana_agua', 'agua_cebada', 'limonada', 'emoliente', 'agua_hierbas', 'jugo_naranja', 'te_helado', 'pe_inca_kola'],
  ['chicha', 'gaseosa', 'agua_cebada', 'jugo_uva', 'cafe', 'cerveza', 'vino'],
];
const DRINK = /^(agua|bebida|refresco|jugo|te|infusion|cerveza|gaseosa|limonada|emoliente)\b/;

/** Otras opciones para lo que detectó la IA: primero las que ella misma sugiere, luego las que se ven parecidas. */
export function alternatives(foods: Record<string, Food>, item: Pick<ScanItem, 'name' | 'alts'>, current: Food | null, limit = 4): Food[] {
  const out: Food[] = [];
  const add = (f: Food | null | undefined) => {
    if (f && f.id !== current?.id && out.length < limit && !out.some((x) => x.id === f.id)) out.push(f);
  };
  item.alts?.forEach((n) => {
    const m = bestMatch(foods, n);
    if (m?.full) add(m.food);
  });
  const group = LOOKALIKES.find((g) => current && g.includes(current.id)) ?? (DRINK.test(normalize(item.name)) ? LOOKALIKES[2] : []);
  group.forEach((id) => add(foods[id]));
  return out;
}

export type Verdict = { level: 'ok' | 'protein' | 'tight' | 'over'; text: string };

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
