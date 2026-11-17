import type { Profile, Targets, Item, Food } from './types';

const ACTIVITY = { low: 1.4, active: 1.55, very_active: 1.7 } as const;
const PACE = { slow: 1, moderate: 1.6, fast: 2.2 } as const;

/** Mifflin-St Jeor × actividad, ajustado por objetivo y ritmo, con piso de seguridad. */
export function computeTargets(p: Profile): Targets {
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161);
  const tdee = bmr * ACTIVITY[p.activity];
  const delta = p.goal === 'gain' ? 250 * PACE[p.pace] : p.goal === 'lose' ? -300 * PACE[p.pace] : 0;
  const floor = p.sex === 'male' ? 1500 : 1200;
  const kcal = Math.round(Math.max(tdee + delta, floor) / 10) * 10;
  const protein = Math.round(p.weightKg * (p.goal === 'lose' ? 2.2 : p.goal === 'gain' ? 2 : 1.8));
  const fat = Math.round(Math.max(p.weightKg * 0.9, (kcal * 0.2) / 9));
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, carbs, fat, tdee: Math.round(tdee), weeklyKg: +(((kcal - tdee) * 7) / 7700).toFixed(2) };
}

export const totals = (items: Item[], foods: Record<string, Food>) =>
  items.reduce(
    (s, { foodId, grams }) => {
      const x = foods[foodId];
      const k = grams / 100;
      return { kcal: s.kcal + x.kcal * k, p: s.p + x.p * k, c: s.c + x.c * k, f: s.f + x.f * k };
    },
    { kcal: 0, p: 0, c: 0, f: 0 },
  );
