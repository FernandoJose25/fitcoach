import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { bannedTags, buildDays, compensate, consequence, dayNumber, isBanned, FOODS, RECIPES, totals, type Food, type Item, type Meal } from '@fitcoach/core';
import { useApp, todayKey, type LogItem } from '@/store/useApp';
import { useUi } from '@/store/useUi';

/** Menús de `count` días desde hoy: rotan cada día; los cambios ↻ solo valen el día en que se hicieron. */
function useDays(count: number): Meal[][] {
  const { profile, targets, variants, variantsDay } = useApp(useShallow((s) => ({ profile: s.profile, targets: s.targets, variants: s.variants, variantsDay: s.variantsDay })));
  const today = todayKey();
  return useMemo(
    () => (profile && targets ? buildDays(targets, profile, FOODS, RECIPES, dayNumber(today), count, variantsDay === today ? variants : []) : []),
    [profile, targets, variants, variantsDay, today, count],
  );
}

const NO_MEALS: Meal[] = [];

/** Menú de hoy recalculado desde el core cuando cambian perfil, metas, variantes o el día. */
export function usePlan(): Meal[] {
  return useDays(1)[0] ?? NO_MEALS;
}

/** Menús de los próximos 7 días (desde hoy): base de la lista de compras. */
export const useWeekPlans = () => useDays(7);

// Referencia estable: devolver `[]` nuevo en cada lectura hace que Zustand re-renderice sin fin.
const EMPTY: LogItem[] = [];

export function useTodayLogs(): LogItem[] {
  return useApp((s) => s.logs[todayKey()] ?? EMPTY);
}

/** Catálogo + productos escaneados por código de barras. */
export const allFoods = (): Record<string, Food> => ({ ...FOODS, ...useApp.getState().customFoods });
export const foodOf = (id: string): Food => FOODS[id] ?? useApp.getState().customFoods[id];

export function useFoods() {
  const custom = useApp((s) => s.customFoods);
  return useMemo(() => ({ ...FOODS, ...custom }), [custom]);
}

export const sum = (items: Item[]) => totals(items, allFoods());

/** Registra la comida `slot` tal como la propone el plan, con confeti y aviso. */
export function registerPlanned(meal: Meal, slot: number) {
  useApp.getState().addLogs(meal.items.map((x) => ({ ...x, slot, via: 'plan' })));
  useUi.getState().confetti();
  useUi.getState().showToast(`${meal.label} registrado ✓`);
}

/** Alimento proteico permitido con mejor proteína por kcal (para el coach). */
export function bestProtein(p: { allergies: string[]; avoid: string[] }) {
  const banned = bannedTags(p);
  const list = Object.values(FOODS)
    .filter((f) => f.role === 'P' && !isBanned(f, banned))
    .sort((a, b) => b.p / b.kcal - a.p / a.kcal);
  return list[0] ? { id: list[0].id, name: list[0].name, pPer100: list[0].p } : null;
}

/** kcal planeadas en las comidas que aún no se registran (sin contar `except`, la comida que se está registrando). */
export function pendingKcal(plan: Meal[], logs: { slot: number }[], except?: number) {
  const done = new Set(logs.map((l) => l.slot));
  return plan.reduce((s, m, i) => (done.has(i) || i === except ? s : s + sum(m.items).kcal), 0);
}

/**
 * Plan de hoy con la consecuencia de lo registrado: si te pasas, las comidas pendientes se recortan
 * para compensar (`compensate`). La lista de compras usa `useWeekPlans` (sin recortes).
 */
export function useDayPlan() {
  const plan = usePlan();
  const logs = useTodayLogs();
  const t = useApp((s) => s.targets);
  const custom = useApp((s) => s.customFoods);
  return useMemo(() => {
    if (!t) return { plan, cut: 0 };
    return compensate(plan, sum(logs).kcal, new Set(logs.map((l) => l.slot)), { ...FOODS, ...custom }, t);
  }, [plan, logs, t, custom]);
}

/**
 * Consecuencia de registrar `add` en la comida `slot` (o de lo ya registrado hoy si `add` está vacío).
 * `extra`: totales de alimentos que aún no están guardados (p. ej. estimados por IA en una foto).
 */
export function useConsequence(add: Item[], slot?: number, extra?: { kcal: number; p: number; c: number; f: number }) {
  const plan = usePlan();
  const logs = useTodayLogs();
  const profile = useApp((s) => s.profile);
  const t = useApp((s) => s.targets);
  const custom = useApp((s) => s.customFoods);
  return useMemo(() => {
    if (!profile || !t) return null;
    const a = sum([...logs, ...add]);
    const after = extra ? { kcal: a.kcal + extra.kcal, p: a.p + extra.p, c: a.c + extra.c, f: a.f + extra.f } : a;
    return consequence(after, pendingKcal(plan, logs, slot), t, profile.goal, profile.weightKg);
    // custom: los alimentos nuevos (IA, creados) cambian `sum`.
  }, [add, slot, plan, logs, profile, t, custom, extra?.kcal, extra?.p, extra?.c, extra?.f]);
}
