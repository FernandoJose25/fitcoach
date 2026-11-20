import type { Food, Item, Meal, Profile, Recipe, SlotType, Targets } from './types';
import { totals } from './nutrition';
import { SPLITS } from './splits';

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export const TAGS: Record<string, string[]> = {
  Maní: ['mani'],
  Mariscos: ['mariscos'],
  Lácteos: ['lacteos'],
  Gluten: ['gluten'],
  Huevo: ['huevo'],
  Soya: ['soya'],
  'Frutos secos': ['frutos'],
  Pescado: ['pescado'],
  Cerdo: ['cerdo'],
  Res: ['res'],
  Pollo: ['pollo'],
  Vegetariano: ['pollo', 'res', 'cerdo', 'pescado', 'mariscos', 'pavo'],
  Vegano: ['pollo', 'res', 'cerdo', 'pescado', 'mariscos', 'pavo', 'lacteos', 'huevo'],
  Hongos: ['hongos'],
  Brócoli: ['brocoli'],
  Cebolla: ['cebolla'],
};

export const bannedTags = (p: Pick<Profile, 'allergies' | 'avoid'>) =>
  new Set([...p.allergies, ...p.avoid].flatMap((l) => TAGS[l] ?? []));

/** ¿Lleva el alimento alguna etiqueta vetada? */
export const isBanned = (f: Pick<Food, 'tag'>, banned: Set<string>) => !!f.tag && f.tag.split(',').some((t) => banned.has(t));

/** Recetas mejor ajustadas entre las que rota cada comida a lo largo de la semana. */
const POOL = 20;
/** Desvío máximo del día completo que acepta la rotación al elegir cada receta: proteína ±8 %, kcal −5 %. */
const DAY_TOL = 0.08;
const KCAL_UNDER = 0.05;
/** kcal que el menú puede pasar la meta: menos que el margen de `compensate`, o un día sin registros ya pediría compensar. */
const KCAL_OVER = 40;

/** Día local como número (días desde 1970-01-01) a partir de una fecha 'YYYY-MM-DD'. */
export const dayNumber = (key: string) =>
  Date.UTC(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8, 10)) / 86_400_000;

/** Receta candidata para una comida, ya escalada a su parte de las kcal (gramos redondeados), con su desvío en kcal y proteína. */
interface Cand {
  r: Recipe;
  items: Item[];
  dk: number;
  dp: number;
}

/** Barajado determinista (mulberry32): el mismo orden en cualquier teléfono para la misma semana y comida. */
function shuffle<T>(a: T[], seed: number): T[] {
  const out = [...a];
  let s = seed >>> 0;
  const rnd = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = Math.imul(s ^ (s >>> 15), s | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Recetas de una semana (lunes a domingo): cada comida recorre sus `POOL` mejores recetas en un orden
 * propio de esa semana, sin repetir receta en la semana mientras haya opciones, y solo acepta la que
 * deja el día dentro de los márgenes de kcal y proteína (si ninguna lo logra, la que más se acerca).
 */
function weekPicks(ranked: Cand[][], t: Targets, week: number): (Cand | null)[][] {
  const used = new Set<string>();
  return Array.from({ length: 7 }, () => {
    const today = new Set<string>();
    let dk = 0;
    let dp = 0;
    return ranked.map((cands, i) => {
      if (!cands.length) return null;
      const fits = (c: Cand) =>
        dk + c.dk <= KCAL_OVER && dk + c.dk >= -KCAL_UNDER * t.kcal && Math.abs(dp + c.dp) <= DAY_TOL * t.protein;
      const miss = (c: Cand) =>
        Math.max(0, dk + c.dk - KCAL_OVER) / 10 + Math.abs(dk + c.dk) / t.kcal + Math.abs(dp + c.dp) / t.protein;
      const order = shuffle(cands.slice(0, POOL), week * 7919 + i * 104729 + 1);
      const free = cands.filter((c) => !today.has(c.r.id));
      const pick =
        order.find((c) => !used.has(c.r.id) && !today.has(c.r.id) && fits(c)) ??
        order.find((c) => !today.has(c.r.id) && fits(c)) ??
        (free.length ? free.reduce((a, b) => (miss(b) < miss(a) ? b : a)) : cands[0]);
      used.add(pick.r.id);
      today.add(pick.r.id);
      dk += pick.dk;
      dp += pick.dp;
      return pick;
    });
  });
}

/**
 * Menús de `count` días seguidos desde `day` (ver `dayNumber`): cambian cada día y no repiten receta en
 * la semana mientras haya opciones (ver `weekPicks`). `variants` (botón ↻) solo se aplica al primer día:
 * avanza esa comida a la siguiente receta mejor ajustada sin tocar las demás.
 */
export function buildDays(
  t: Targets,
  p: Profile,
  foods: Record<string, Food>,
  recipes: Recipe[],
  day: number,
  count: number,
  variants: number[] = [],
): Meal[][] {
  const banned = bannedTags(p);
  const ok = (id: string) => !!foods[id] && !isBanned(foods[id], banned);
  const split = SPLITS[p.mealsPerDay];
  const ranked = split.map(([, slot, share]) => {
    const tk = t.kcal * share;
    const tp = t.protein * share;
    return (
      recipes
        .filter((r) => r.slots.includes(slot) && r.items.every((x) => ok(x.foodId)))
        .map((r): Cand => {
          const f = clamp(tk / totals(r.items, foods).kcal, 0.55, 1.9);
          const items = r.items.map((x) => ({
            foodId: x.foodId,
            grams: Math.max(5, Math.round((x.grams * f) / 5) * 5),
          }));
          const b = totals(items, foods);
          return { r, items, dk: b.kcal - tk, dp: b.p - tp };
        })
        // Distancia tras escalar la receta: error relativo de kcal + error relativo de proteína.
        .sort((a, b) => Math.abs(a.dk) / tk + Math.abs(a.dp) / tp - (Math.abs(b.dk) / tk + Math.abs(b.dp) / tp))
    );
  });
  const weeks = new Map<number, (Cand | null)[][]>();
  return Array.from({ length: count }, (_, n) => {
    const d = day + n;
    // Semanas de lunes a domingo: el 1970-01-01 (día 0) fue jueves.
    const week = Math.floor((d + 3) / 7);
    if (!weeks.has(week)) weeks.set(week, weekPicks(ranked, t, week));
    const picks = [...weeks.get(week)![d + 3 - week * 7]];
    if (n === 0)
      variants.forEach((v, i) => {
        const base = picks[i];
        if (!v || !base) return;
        const others = new Set(picks.filter((_, j) => j !== i).map((x) => x?.r.id));
        const list = ranked[i].filter((c) => !others.has(c.r.id));
        if (list.length) picks[i] = list[(Math.max(0, list.indexOf(base)) + v) % list.length];
      });
    return split.map(([label, slot, share], i): Meal => {
      const c = picks[i];
      if (!c) return fallbackMeal(label, slot, share, t, foods, ok, d + (n === 0 ? (variants[i] ?? 0) : 0));
      return {
        slot,
        label,
        share,
        recipeId: c.r.id,
        recipeName: c.r.name,
        how: c.r.how,
        items: c.items,
      };
    });
  });
}

/** Menú de un día (ver `buildDays`). */
export function buildPlan(
  t: Targets,
  p: Profile,
  foods: Record<string, Food>,
  recipes: Recipe[],
  variants: number[] = [],
  day = 0,
): Meal[] {
  return buildDays(t, p, foods, recipes, day, 1, variants)[0];
}

/** Respaldo: proteína + verdura + carbohidrato + grasa permitidos, con gramos calculados. */
function fallbackMeal(
  label: string,
  slot: SlotType,
  share: number,
  t: Targets,
  foods: Record<string, Food>,
  ok: (id: string) => boolean,
  v: number,
): Meal {
  const pick = (role: Food['role']) => {
    const a = Object.values(foods).filter((f) => f.role === role && ok(f.id));
    return a.length ? a[v % a.length] : null;
  };
  const r = { k: t.kcal * share, p: t.protein * share, c: t.carbs * share, f: t.fat * share };
  const items: Item[] = [];
  const add = (f: Food | null, g: number) => {
    if (!f) return;
    g = Math.round(g / 5) * 5;
    if (g < 5) return;
    items.push({ foodId: f.id, grams: g });
    const k = g / 100;
    r.k -= f.kcal * k;
    r.p -= f.p * k;
    r.c -= f.c * k;
    r.f -= f.f * k;
  };
  const P = pick('P');
  const C = pick('C');
  const V = pick('V');
  const F = pick('F');
  if (P) add(P, clamp((t.protein * share * 0.7) / (P.p / 100), 60, 320));
  if (V) add(V, 100);
  if (C) add(C, clamp(r.c / (C.c / 100), 40, 400));
  if (F && r.f > 3) add(F, clamp(r.f / (F.f / 100), 5, 60));
  return {
    slot,
    label,
    share,
    recipeId: null,
    recipeName: 'Comida personalizada',
    how: 'Cocina cada ingrediente a tu gusto.',
    items,
  };
}
