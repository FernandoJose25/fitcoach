import type { Food, Profile, Targets } from './types';
import { bannedTags, isBanned } from './meals';
import { SPLITS } from './splits';

/** Carbohidratos y grasas de base (comida real, no harinas ni aceites como "mejor opción"), en orden de preferencia. */
const STAPLE_CARBS = ['arroz', 'papa', 'camote', 'quinua', 'avena', 'platano', 'yuca', 'pan', 'fideo', 'choclo', 'arroz_integral', 'kiwicha'];
const STAPLE_FATS = ['palta', 'mani', 'aceite', 'almendra', 'nuez', 'sacha_inchi', 'chia', 'linaza', 'pbut', 'aceituna'];

export interface LearnLists {
  protein: Food[]; // más proteína por kcal
  carbs: Food[];
  fats: Food[];
}

/** Listas de "Qué comer" (SPEC §5.7) sin los alimentos vetados por alergias o preferencias. */
export function learnFoods(p: Pick<Profile, 'allergies' | 'avoid'>, foods: Record<string, Food>, n = 6): LearnLists {
  const banned = bannedTags(p);
  const ok = (f: Food | undefined): f is Food => !!f && !isBanned(f, banned);
  const pick = (ids: string[]) => ids.map((id) => foods[id]).filter(ok).slice(0, n);
  const protein = Object.values(foods)
    .filter((f) => f.role === 'P' && ok(f))
    .sort((a, b) => b.p / b.kcal - a.p / a.kcal)
    .slice(0, n);
  return { protein, carbs: pick(STAPLE_CARBS), fats: pick(STAPLE_FATS) };
}

export interface MealShare {
  label: string;
  kcal: number;
  protein: number;
}

/** Reparto de la meta por comida (mismas proporciones que el plan). */
export const mealShares = (t: Targets, mealsPerDay: Profile['mealsPerDay']): MealShare[] =>
  SPLITS[mealsPerDay].map(([label, , share]) => ({ label, kcal: Math.round((t.kcal * share) / 10) * 10, protein: Math.round(t.protein * share) }));

export interface MacroRow {
  key: 'p' | 'c' | 'f';
  grams: number;
  kcalPerGram: number;
  kcal: number;
  pct: number; // % de las kcal de la meta
}

/** Gramos → kcal (4/4/9) y su peso en la meta diaria. */
export function macroRows(t: Targets): MacroRow[] {
  const rows = [
    { key: 'p' as const, grams: t.protein, kcalPerGram: 4 },
    { key: 'c' as const, grams: t.carbs, kcalPerGram: 4 },
    { key: 'f' as const, grams: t.fat, kcalPerGram: 9 },
  ];
  const total = rows.reduce((a, r) => a + r.grams * r.kcalPerGram, 0) || 1;
  return rows.map((r) => ({ ...r, kcal: r.grams * r.kcalPerGram, pct: Math.round((r.grams * r.kcalPerGram * 100) / total) }));
}

/** Semanas para cambiar 1 kg al ritmo estimado; `null` si el objetivo es mantener. */
export const weeksPerKg = (t: Targets) => (Math.abs(t.weeklyKg) < 0.05 ? null : Math.round(1 / Math.abs(t.weeklyKg)));
