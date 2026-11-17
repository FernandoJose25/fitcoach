import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { bannedTags, buildPlan, FOODS, RECIPES, totals, type Item } from '@fitcoach/core';
import { useApp, todayKey, type LogItem } from '@/store/useApp';

/** Plan del día recalculado desde el core cuando cambian perfil, metas o variantes. */
export function usePlan() {
  const { profile, targets, variants } = useApp(useShallow((s) => ({ profile: s.profile, targets: s.targets, variants: s.variants })));
  return useMemo(() => (profile && targets ? buildPlan(targets, profile, FOODS, RECIPES, variants) : []), [profile, targets, variants]);
}

export function useTodayLogs(): LogItem[] {
  return useApp((s) => s.logs[todayKey()] ?? []);
}

export const sum = (items: Item[]) => totals(items, FOODS);

/** Alimento proteico permitido con mejor proteína por kcal (para el coach). */
export function bestProtein(p: { allergies: string[]; avoid: string[] }) {
  const banned = bannedTags(p);
  const list = Object.values(FOODS)
    .filter((f) => f.role === 'P' && (!f.tag || !banned.has(f.tag)))
    .sort((a, b) => b.p / b.kcal - a.p / a.kcal);
  return list[0] ? { name: list[0].name, pPer100: list[0].p } : null;
}
