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

/** Sección 9.7: sugerencia del coach por reglas, sin IA y sin culpa. */
export function coachMessage(
  eaten: { kcal: number; p: number; logs: number },
  t: Targets,
  best?: { name: string; pPer100: number } | null,
): string {
  if (eaten.logs === 0) return 'Empieza registrando tu primera comida.';
  if (eaten.kcal > t.kcal + 100) {
    return 'En tu siguiente comida prioriza proteína y verduras. Mañana sigues con tu plan.';
  }
  const missingP = t.protein - eaten.p;
  if (missingP > 25 && best && best.pPer100 > 0) {
    const grams = Math.round((missingP / best.pPer100) * 100 / 5) * 5;
    return `Te faltan ${Math.round(missingP)} g de proteína: ${grams} g de ${best.name.toLowerCase()} los cubren.`;
  }
  const left = t.kcal - eaten.kcal;
  if (left < 150) return 'Día casi completo. ¡Buen trabajo!';
  return `Te quedan ${Math.round(left)} kcal para hoy.`;
}
