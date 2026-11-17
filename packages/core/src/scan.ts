import type { Goal, Targets } from './types';

export type Verdict = { level: 'ok' | 'protein' | 'tight' | 'over'; text: string };

export function verdict(item: { kcal: number; p: number }, eaten: { kcal: number }, t: Targets, goal: Goal): Verdict {
  const after = eaten.kcal + item.kcal;
  const left = t.kcal - eaten.kcal;
  const pd = item.kcal > 0 ? (item.p * 4) / item.kcal : 0;
  if (after > t.kcal * 1.05) {
    return { level: 'over', text: `⚠️ Te pasarías ${Math.round(after - t.kcal)} kcal de tu meta de hoy.` };
  }
  if (goal === 'gain' && pd >= 0.25) {
    return {
      level: 'protein',
      text: `🎯 Muy bueno para ganar masa: ${Math.round(pd * 100)}% de sus calorías son proteína.`,
    };
  }
  if (goal === 'lose' && pd >= 0.3) {
    return { level: 'protein', text: '🎯 Saciante y alto en proteína, ideal para perder grasa.' };
  }
  if (item.kcal > left * 0.8) {
    return { level: 'tight', text: '🟠 Ocupa casi todas las calorías que te quedan hoy.' };
  }
  return { level: 'ok', text: '✅ Encaja bien con tu día.' };
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
