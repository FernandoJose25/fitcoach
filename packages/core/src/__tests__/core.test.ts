import { describe, it, expect } from 'vitest';
import type { Profile } from '../types';
import { computeTargets } from '../nutrition';
import { buildPlan, bannedTags, isBanned } from '../meals';
import { buildSession, buildTimeline, exerciseHistory, programWeek, sessionForDay, setSeconds, timelineSeconds, lastSet, alternativeExercises, nextSession, setScore, TRAIN_DAYS, volumeOf } from '../workouts';
import { matchFood, verdict } from '../scan';
import { foodFromOff, frequentFoodIds, searchFoods } from '../foodlog';
import { FOODS } from '../data/foods';
import { RECIPES } from '../data/recipes';
import { EXERCISES, exerciseImages } from '../data/exercises';
import { learnFoods, macroRows, mealShares, weeksPerKg } from '../learn';
import { achievements, adaptiveAdjust, applyKcalDelta, muscleOf, muscleSets, newRecords, personalRecords, suggestNext, weightTrend } from '../progress';

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
    plan.forEach((m) => m.items.forEach((i) => expect(isBanned(FOODS[i.foodId], banned)).toBe(false)));
  });
  it('vegano no contiene animales, lácteos ni huevo', () => {
    const p = { ...base, avoid: ['Vegano'] };
    const plan = buildPlan(computeTargets(p), p, FOODS, RECIPES);
    const banned = bannedTags(p);
    plan.forEach((m) => m.items.forEach((i) => expect(isBanned(FOODS[i.foodId], banned)).toBe(false)));
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
  it('cubre ±12 % de la proteína del día y no usa el respaldo con el catálogo completo', () => {
    const t = computeTargets(base);
    const plan = buildPlan(t, base, FOODS, RECIPES);
    const p = plan.flatMap((m) => m.items).reduce((s, i) => s + (FOODS[i.foodId].p * i.grams) / 100, 0);
    expect(Math.abs(p - t.protein) / t.protein).toBeLessThan(0.12);
    expect(plan.every((m) => m.recipeId)).toBe(true);
  });
  it('vegano y sin gluten siguen con recetas en todas las comidas', () => {
    for (const extra of [{ avoid: ['Vegano'] }, { allergies: ['Gluten', 'Lácteos'] }]) {
      const p = { ...base, mealsPerDay: 5 as const, ...extra };
      const plan = buildPlan(computeTargets(p), p, FOODS, RECIPES);
      expect(plan.every((m) => m.recipeId)).toBe(true);
      expect(new Set(plan.map((m) => m.recipeId)).size).toBe(plan.length);
    }
  });
});

describe('contenido', () => {
  it('300+ alimentos con kcal coherentes con los macros (salvo bebidas alcohólicas)', () => {
    const all = Object.values(FOODS);
    expect(all.length).toBeGreaterThanOrEqual(300);
    all
      .filter((f) => !['cerveza', 'vino'].includes(f.id))
      .forEach((f) => expect(Math.abs(4 * f.p + 4 * f.c + 9 * f.f - f.kcal), f.id).toBeLessThanOrEqual(Math.max(15, f.kcal * 0.2)));
  });
  it('120+ recetas, 25+ por tipo de comida, ids únicos e ingredientes existentes que no son platos preparados', () => {
    expect(RECIPES.length).toBeGreaterThanOrEqual(120);
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(RECIPES.length);
    for (const s of 'DSAC') expect(RECIPES.filter((r) => r.slots.includes(s)).length, s).toBeGreaterThanOrEqual(25);
    RECIPES.forEach((r) =>
      r.items.forEach((i) => {
        expect(FOODS[i.foodId], `${r.id}: ${i.foodId}`).toBeDefined();
        if (!['sillao', 'miel'].includes(i.foodId)) expect(FOODS[i.foodId].role, `${r.id}: ${i.foodId}`).not.toBe('M');
      }),
    );
  });
  it('un plato con varias etiquetas se veta por cualquiera de ellas', () => {
    expect(isBanned(FOODS.lomo_saltado, bannedTags({ allergies: [], avoid: ['Cebolla'] }))).toBe(true);
    expect(isBanned(FOODS.lomo_saltado, bannedTags({ allergies: ['Mariscos'], avoid: [] }))).toBe(false);
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
  it('cambiar ejercicio: mismo músculo y lugar, sin repetir los de la sesión', () => {
    const alts = alternativeExercises('pecho', 'gym', ['Press banca', 'Press inclinado con mancuernas']);
    expect(alts[0]).toBe('Aperturas en polea');
    expect(alts).not.toContain('Press banca');
    expect(alts.every((n) => EXERCISES.pecho.gym.includes(n))).toBe(true);
    expect(alternativeExercises('pecho', 'home', ['Flexiones'])[0]).toBe('Flexiones con pies elevados');
    expect(alternativeExercises('core', 'gym', EXERCISES.core.gym)).toEqual([]);
  });
  it('catálogo: al menos 6 ejercicios por músculo y lugar, todos con imagen', () => {
    for (const m of Object.values(EXERCISES))
      for (const list of [m.gym, m.home]) {
        expect(list.length).toBeGreaterThanOrEqual(6);
        expect(new Set(list).size).toBe(list.length);
        list.forEach((n) => expect(exerciseImages(n)).toHaveLength(2));
      }
  });
  it('en día de descanso propone la siguiente sesión del split', () => {
    expect(nextSession(2, base)).toEqual({ kind: 'upper', occurrence: 1 }); // miércoles con 4 días → jueves
    expect(nextSession(6, base)).toEqual({ kind: 'upper', occurrence: 0 }); // domingo → lunes
  });
});

describe('entreno guiado', () => {
  it('los días del programa siguen el split sin depender del día de la semana', () => {
    expect([0, 1, 2, 3, 4].map((d) => sessionForDay(d, { ...base, daysPerWeek: 5 }).kind)).toEqual(['push', 'pull', 'legs', 'upper', 'lower']);
    expect(sessionForDay(2, base)).toEqual({ kind: 'upper', occurrence: 1 });
  });
  it('semana del programa desde el lunes de inicio', () => {
    expect(programWeek('2026-11-16', '2026-11-16')).toBe(1);
    expect(programWeek('2026-11-16', '2026-11-22')).toBe(1);
    expect(programWeek('2026-11-16', '2026-11-23')).toBe(2);
    expect(programWeek('2026-11-16', '2026-12-31')).toBe(7);
  });
  it('duración de serie según repeticiones; plancha por tiempo', () => {
    expect(setSeconds({ name: 'Press banca', reps: '6–8' })).toBe(30);
    expect(setSeconds({ name: 'Curl', reps: '12–15' })).toBe(50);
    expect(setSeconds({ name: 'Plancha', reps: '10–12' })).toBe(40);
  });
  it('línea de tiempo: preparación, series y descansos, sin descanso al final', () => {
    const exs = buildSession('push', 0, base);
    const t = buildTimeline(exs);
    const sets = exs.reduce((n, e) => n + e.sets, 0);
    expect(t[0].kind).toBe('prep');
    expect(t.filter((s) => s.kind === 'work')).toHaveLength(sets);
    expect(t.filter((s) => s.kind === 'rest')).toHaveLength(sets - 1);
    expect(t[t.length - 1].kind).toBe('work');
    // El descanso tras la última serie de un ejercicio anuncia el siguiente ejercicio.
    const firstSets = exs[0].sets;
    expect(t[firstSets * 2]).toMatchObject({ kind: 'rest', ex: 1, set: 1 });
    expect(timelineSeconds(t) / 60).toBeGreaterThan(20);
  });
});

describe('historial de fuerza', () => {
  const sets = {
    '2026-11-10': [
      { exercise: 'Press banca', setNo: 1, reps: 8, weightKg: 50 },
      { exercise: 'Press banca', setNo: 2, reps: 8, weightKg: 50 },
      { exercise: 'Plancha', setNo: 1, reps: 45, weightKg: 0 },
    ],
    '2026-11-12': [
      { exercise: 'Press banca', setNo: 1, reps: 8, weightKg: 55 },
      { exercise: 'Press banca', setNo: 2, reps: 6, weightKg: 60 },
    ],
  };
  it('mejor serie por día y volumen, en orden cronológico', () => {
    const h = exerciseHistory(sets, 'Press banca');
    expect(h.map((x) => x.day)).toEqual(['2026-11-10', '2026-11-12']);
    expect(h[1].best).toMatchObject({ weightKg: 60, reps: 6 });
    expect(h[1].volume).toBe(55 * 8 + 60 * 6);
    expect(exerciseHistory(sets, 'Sentadilla')).toEqual([]);
  });
  it('precarga la misma serie del último día; si no existe, la última de ese día', () => {
    expect(lastSet(sets, 'Press banca', 2, '2026-11-17')).toMatchObject({ weightKg: 60, reps: 6 });
    expect(lastSet(sets, 'Press banca', 3, '2026-11-17')).toMatchObject({ weightKg: 60, reps: 6 });
    expect(lastSet(sets, 'Press banca', 1, '2026-11-11')).toMatchObject({ weightKg: 50 });
    expect(lastSet(sets, 'Sentadilla', 1, '2026-11-17')).toBeNull();
  });
  it('sin peso puntúa por repeticiones; el volumen semanal suma kg × reps', () => {
    expect(setScore({ reps: 45, weightKg: 0 })).toBe(45);
    expect(setScore({ reps: 10, weightKg: 60 })).toBe(80);
    expect(volumeOf(sets, ['2026-11-10', '2026-11-12'])).toBe(800 + 440 + 360);
    expect(volumeOf(sets, ['2026-11-12'], 'Press banca')).toBe(800);
  });
});

describe('escáner: emparejar nombres de la IA con la base', () => {
  const m = (n: string) => matchFood(FOODS, n)?.id ?? null;
  it('quita preposiciones, cocción y plurales', () => {
    expect(m('pechuga de pollo a la plancha')).toBe('pollo');
    expect(m('arroz blanco cocido')).toBe('arroz');
    expect(m('papas fritas')).toBe('papas_fritas');
    expect(m('huevo frito')).toBe('huevo_frito');
    expect(m('ensalada mixta')).toBe('ensal');
    expect(m('frijoles negros')).toBe('frijol_negro');
    expect(m('tomates')).toBe('tomate');
    expect(m('Lomo saltado')).toBe('lomo_saltado');
  });
  it('no confunde papa con papaya y devuelve null si nada se parece', () => {
    expect(m('papaya picada')).toBe('papaya');
    expect(m('papa sancochada')).toBe('papa');
    expect(m('dragón de komodo')).toBeNull();
    expect(m('de la')).toBeNull();
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

describe('registro', () => {
  it('busca sin tildes y prioriza el prefijo', () => {
    const atun = searchFoods(FOODS, 'atun');
    expect(atun.map((f) => f.id)).toContain('atun');
    expect(atun.every((f) => f.name.startsWith('Atún'))).toBe(true);
    expect(searchFoods(FOODS, 'mani').map((f) => f.id)).toEqual(['mani', 'pbut']);
    expect(searchFoods(FOODS, 'zzz')).toEqual([]);
  });
  it('frecuentes: distintos, del más reciente al más antiguo', () => {
    const logs = { '2026-11-16': [{ foodId: 'arroz' }, { foodId: 'pollo' }], '2026-11-17': [{ foodId: 'huevo' }, { foodId: 'pollo' }] };
    expect(frequentFoodIds(logs)).toEqual(['pollo', 'huevo', 'arroz']);
    expect(frequentFoodIds(logs, 1)).toEqual(['pollo']);
  });
  it('mapea un producto de Open Food Facts', () => {
    const f = foodFromOff('775', { product_name: 'Avena', brands: 'Quaker, Pepsico', nutriments: { 'energy-kcal_100g': 375, proteins_100g: 13.5, carbohydrates_100g: 60, fat_100g: 7 } });
    expect(f).toMatchObject({ id: 'off_775', name: 'Avena (Quaker)', kcal: 375, p: 13.5, role: 'C' });
    expect(foodFromOff('1', { product_name: 'Sin datos', nutriments: {} })).toBeNull();
    expect(foodFromOff('1', undefined)).toBeNull();
  });
});

describe('progreso', () => {
  const set = (exercise: string, reps: number, weightKg = 0, setNo = 1) => ({ exercise, setNo, reps, weightKg });
  it('progresión doble: tope del rango sube peso; si no, +1 rep; sin peso, +1 rep', () => {
    expect(suggestNext(set('Press banca', 8, 40), '6–8', false)).toMatchObject({ weightKg: 42.5, reps: 6 });
    expect(suggestNext(set('Press banca', 7, 40), '6–8', false)).toMatchObject({ weightKg: 40, reps: 8 });
    expect(suggestNext(set('Flexiones', 12), '10–12', false)).toMatchObject({ weightKg: 0, reps: 13 });
    expect(suggestNext(set('Plancha', 40), '40 s', true)).toMatchObject({ reps: 45 });
    expect(suggestNext(null, '6–8', false)).toBeNull();
  });
  it('músculos: series por grupo según el catálogo', () => {
    expect(muscleOf('Flexiones')).toBe('pecho');
    expect(muscleSets({ d: [set('Flexiones', 10), set('Flexiones', 10, 0, 2), set('Zancadas', 10)] }, ['d'])).toEqual({ pecho: 2, pierna: 1 });
  });
  it('récords: mejor serie histórica y récord nuevo solo si supera una marca previa', () => {
    const sets = { '2026-11-01': [set('Press banca', 8, 40)], '2026-11-08': [set('Press banca', 6, 45)], '2026-11-09': [set('Zancadas', 10)] };
    expect(personalRecords(sets).find((r) => r.exercise === 'Press banca')?.best.weightKg).toBe(45);
    expect(newRecords(sets, '2026-11-08').map((r) => r.exercise)).toEqual(['Press banca']);
    expect(newRecords(sets, '2026-11-09')).toEqual([]);
  });
  it('tendencia y ajuste: perder más lento de lo planeado baja calorías', () => {
    const w = { '2026-10-20': 80, '2026-10-27': 80, '2026-11-03': 79.9, '2026-11-10': 79.9 };
    expect(weightTrend(w, '2026-11-10')?.kgPerWeek).toBeCloseTo(-0.04, 1);
    const t = { kcal: 2200, protein: 170, carbs: 220, fat: 70, tdee: 2700, weeklyKg: -0.45 };
    expect(adaptiveAdjust(w, t, 'lose', '2026-11-10')?.delta).toBe(-150);
    expect(adaptiveAdjust({ '2026-11-09': 80, '2026-11-10': 80 }, t, 'lose', '2026-11-10')).toBeNull();
    const t2 = applyKcalDelta(t, -150);
    expect(t2.kcal).toBe(2050);
    expect(t2.protein).toBe(170);
  });
  it('logros: progreso de 0 a 1', () => {
    const a = achievements({ workoutDays: ['2026-11-01'], sessionsDone: [{ week: 1, day: 0 }], daysPerWeek: 3, streak: 1, sets: {}, mealDays: 0, water: {}, weights: {} });
    expect(a.find((x) => x.id === 'primer-entreno')?.progress).toBe(1);
    expect(a.find((x) => x.id === 'entrenos-10')?.progress).toBeCloseTo(0.1);
    expect(a.every((x) => x.progress >= 0 && x.progress <= 1)).toBe(true);
  });
});

describe('aprende', () => {
  const t = computeTargets(base);
  it('listas sin alimentos vetados y proteína ordenada por g/kcal', () => {
    const vegan = learnFoods({ allergies: ['Maní'], avoid: ['Vegano'] }, FOODS);
    const all = [...vegan.protein, ...vegan.carbs, ...vegan.fats];
    const banned = bannedTags({ allergies: ['Maní'], avoid: ['Vegano'] });
    expect(all.length).toBeGreaterThan(10);
    expect(all.some((f) => isBanned(f, banned))).toBe(false);
    const ratio = vegan.protein.map((f) => f.p / f.kcal);
    expect(ratio).toEqual([...ratio].sort((a, b) => b - a));
    expect(learnFoods(base, FOODS).fats.map((f) => f.id)).toContain('mani');
  });
  it('reparto por comida suma la meta y macros cuadran con 4/4/9', () => {
    const shares = mealShares(t, base.mealsPerDay);
    expect(shares).toHaveLength(4);
    expect(Math.abs(shares.reduce((a, s) => a + s.kcal, 0) - t.kcal)).toBeLessThanOrEqual(20);
    expect(Math.abs(shares.reduce((a, s) => a + s.protein, 0) - t.protein)).toBeLessThanOrEqual(2);
    const rows = macroRows(t);
    expect(rows.reduce((a, r) => a + r.pct, 0)).toBeGreaterThanOrEqual(99);
    expect(rows.find((r) => r.key === 'f')?.kcal).toBe(t.fat * 9);
  });
  it('semanas por kg: null al mantener', () => {
    expect(weeksPerKg(t)).toBeGreaterThan(0);
    expect(weeksPerKg(computeTargets({ ...base, goal: 'maintain' }))).toBeNull();
  });
});
