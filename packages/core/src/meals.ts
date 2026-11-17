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

export function buildPlan(
  t: Targets,
  p: Profile,
  foods: Record<string, Food>,
  recipes: Recipe[],
  variants: number[] = [],
): Meal[] {
  const banned = bannedTags(p);
  const ok = (id: string) => !!foods[id] && !isBanned(foods[id], banned);
  const plan: Meal[] = [];
  SPLITS[p.mealsPerDay].forEach(([label, slot, share], i) => {
    const tk = t.kcal * share;
    const tp = t.protein * share;
    const base = (r: Recipe) => totals(r.items, foods);
    // Distancia tras escalar la receta: error relativo de kcal + error relativo de proteína absoluta.
    const score = (r: Recipe) => {
      const b = base(r);
      const f = clamp(tk / b.kcal, 0.55, 1.9);
      return Math.abs(b.kcal * f - tk) / tk + Math.abs(b.p * f - tp) / tp;
    };
    const cands = recipes
      .filter((r) => r.slots.includes(slot) && r.items.every((x) => ok(x.foodId)))
      .map((r) => ({ r, s: score(r) }))
      .sort((a, b) => a.s - b.s)
      .map(({ r }) => r);
    const used = plan.map((m) => m.recipeId);
    const pool = cands.filter((r) => !used.includes(r.id));
    const list = pool.length ? pool : cands;
    if (!list.length) {
      plan.push(fallbackMeal(label, slot, share, t, foods, ok, variants[i] ?? 0));
      return;
    }
    const r = list[(variants[i] ?? 0) % list.length];
    const f = clamp(tk / base(r).kcal, 0.55, 1.9);
    plan.push({
      slot,
      label,
      share,
      recipeId: r.id,
      recipeName: r.name,
      how: r.how,
      items: r.items.map((x) => ({ foodId: x.foodId, grams: Math.max(5, Math.round((x.grams * f) / 5) * 5) })),
    });
  });
  return plan;
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

/** Lista de compras de 7 días: suma de gramos de todo el plan × 7. */
export function shoppingList(plan: Meal[]) {
  const m: Record<string, number> = {};
  plan.forEach((x) => x.items.forEach((i) => (m[i.foodId] = (m[i.foodId] ?? 0) + i.grams * 7)));
  return m;
}
