import { describe, it, expect } from 'vitest';
import type { Profile } from '../types';
import { computeTargets } from '../nutrition';
import { buildPlan, bannedTags } from '../meals';
import { buildSession, TRAIN_DAYS } from '../workouts';
import { verdict } from '../scan';
import { FOODS } from '../data/foods';
import { RECIPES } from '../data/recipes';

const base = {
  name: 'Test',
  sex: 'male',
  age: 25,
  weightKg: 70,
  heightCm: 175,
  goal: 'gain',
  pace: 'moderate',
  activity: 'active',
  level: 'intermediate',
  where: 'gym',
  daysPerWeek: 4,
  mealsPerDay: 4,
  allergies: [],
  avoid: [],
} satisfies Profile;

describe('nutrición', () => {
  it('hombre 25a 70kg 175cm activo, ganar moderado = 2 990 kcal (mantenimiento 2 594)', () => {
    const t = computeTargets({ ...base });
    expect(t.tdee).toBe(2594);
    expect(t.kcal).toBe(2990);
    expect(t.protein).toBe(140);
  });
  it('respeta el piso de calorías al perder grasa', () => {
    const t = computeTargets({
      ...base,
      sex: 'female',
      weightKg: 45,
      heightCm: 150,
      age: 30,
      goal: 'lose',
      pace: 'fast',
      activity: 'low',
    });
    expect(t.kcal).toBeGreaterThanOrEqual(1200);
  });
  it('macros suman ≈ calorías', () => {
    const t = computeTargets({ ...base });
    expect(Math.abs(t.protein * 4 + t.carbs * 4 + t.fat * 9 - t.kcal)).toBeLessThan(15);
  });
});

describe('plan de comidas', () => {
  it('nunca incluye alimentos vetados (maní, lácteos, gluten)', () => {
    const p = { ...base, allergies: ['Maní', 'Lácteos', 'Gluten'] };
    const plan = buildPlan(computeTargets(p), p, FOODS, RECIPES);
    const banned = bannedTags(p);
    plan.forEach((m) => m.items.forEach((i) => expect(banned.has(FOODS[i.foodId].tag ?? '')).toBe(false)));
  });
  it('vegano no contiene animales, lácteos ni huevo', () => {
    const p = { ...base, avoid: ['Vegano'] };
    const plan = buildPlan(computeTargets(p), p, FOODS, RECIPES);
    const banned = bannedTags(p);
    plan.forEach((m) => m.items.forEach((i) => expect(banned.has(FOODS[i.foodId].tag ?? '')).toBe(false)));
  });
  it('cubre ±12 % de las calorías del día', () => {
    const t = computeTargets(base);
    const plan = buildPlan(t, base, FOODS, RECIPES);
    const kcal = plan.flatMap((m) => m.items).reduce((s, i) => s + (FOODS[i.foodId].kcal * i.grams) / 100, 0);
    expect(Math.abs(kcal - t.kcal) / t.kcal).toBeLessThan(0.12);
  });
  it('cambiar la variante cambia la receta', () => {
    const t = computeTargets(base);
    const a = buildPlan(t, base, FOODS, RECIPES, [0, 0, 0, 0]);
    const b = buildPlan(t, base, FOODS, RECIPES, [1, 0, 0, 0]);
    expect(a[0].recipeId).not.toBe(b[0].recipeId);
  });
});

describe('rutinas', () => {
  it('casa y gimnasio usan ejercicios distintos', () => {
    const g = buildSession('push', 0, { ...base, where: 'gym' }).map((e) => e.name);
    const h = buildSession('push', 0, { ...base, where: 'home' }).map((e) => e.name);
    expect(g.some((n) => h.includes(n))).toBe(false);
  });
  it('6 ejercicios sin repetir', () => {
    const s = buildSession('full', 0, base).map((e) => e.name);
    expect(new Set(s).size).toBe(s.length);
  });
  it('5 días de entreno distintos', () => {
    expect(new Set(TRAIN_DAYS[5]).size).toBe(5);
  });
});

describe('veredicto', () => {
  const t = computeTargets(base);
  it('avisa si te pasas', () => {
    expect(verdict({ kcal: 900, p: 20 }, { kcal: t.kcal - 100 }, t, 'gain').level).toBe('over');
  });
  it('destaca alta proteína al ganar masa', () => {
    expect(verdict({ kcal: 300, p: 40 }, { kcal: 0 }, t, 'gain').level).toBe('protein');
  });
});
