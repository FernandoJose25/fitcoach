import type { Food, Goal, Item, Meal, Targets } from './types';
import { totals } from './nutrition';

/** Margen antes de hablar de exceso: comer 50 kcal de más no cambia nada. */
const MARGIN = 50;
/** Las comidas pendientes no bajan de este porcentaje de lo planeado: compensar no es pasar hambre. */
const MIN_SHARE = 0.6;
/** kcal por gramo de grasa corporal (7 700 kcal/kg). */
const KCAL_PER_G_FAT = 7.7;

type Macros = { kcal: number; p: number; c: number; f: number };

/**
 * Compensa un exceso del día recortando las comidas que aún no se registran. El exceso es lo que ya
 * comiste más lo que falta del plan menos la meta; cada comida pendiente se escala por igual, sin bajar
 * del 60 % de lo planeado. Comer de menos no agranda las comidas que faltan.
 */
export function compensate(plan: Meal[], eatenKcal: number, done: Set<number>, foods: Record<string, Food>, t: Targets): { plan: Meal[]; cut: number } {
  const pendingKcal = plan.reduce((s, m, i) => (done.has(i) ? s : s + totals(m.items, foods).kcal), 0);
  const excess = eatenKcal + pendingKcal - t.kcal;
  if (excess <= MARGIN || pendingKcal <= 0) return { plan, cut: 0 };
  const factor = Math.max(MIN_SHARE, (pendingKcal - excess) / pendingKcal);
  let cut = 0;
  const out = plan.map((m, i) => {
    if (done.has(i)) return m;
    const before = totals(m.items, foods).kcal;
    const items: Item[] = m.items.map((x) => ({ foodId: x.foodId, grams: Math.max(5, Math.round((x.grams * factor) / 5) * 5) }));
    const c = Math.round(before - totals(items, foods).kcal);
    cut += c;
    return c > 0 ? { ...m, items, cut: c } : m;
  });
  return { plan: out, cut };
}

export interface Consequence {
  /** kcal por encima de la meta si comes esto y sigues el plan en lo que falta del día. */
  excess: number;
  /** Parte del exceso que se compensa recortando las comidas pendientes. */
  cut: number;
  /** Lo que no se puede compensar hoy. */
  rest: number;
  /** Perder grasa: días que se retrasa la meta por `rest`. */
  delayDays: number | null;
  /** Ganar o mantener: gramos de grasa que suma `rest`. */
  fatG: number;
  /** Minutos de caminata rápida que queman `rest`. */
  walkMin: number;
  /** Macros que quedan claramente por encima de su meta. */
  over: { macro: 'Carbos' | 'Grasas'; g: number }[];
}

/**
 * Qué pasa si comes esto: cuánto te pasas de la meta del día contando lo que falta del plan, cuánto se
 * compensa en las comidas pendientes y qué efecto tiene lo demás (retraso de la meta o grasa extra, y su
 * equivalente en caminata). `after` = lo comido + lo que vas a registrar; `pendingKcal` = lo planeado
 * en las comidas que aún no registras. `null` si no hay exceso.
 */
export function consequence(after: Macros, pendingKcal: number, t: Targets, goal: Goal, weightKg: number): Consequence | null {
  const excess = Math.round(after.kcal + pendingKcal - t.kcal);
  const over: Consequence['over'] = [];
  if (after.c - t.carbs > 30) over.push({ macro: 'Carbos', g: Math.round(after.c - t.carbs) });
  if (after.f - t.fat > 10) over.push({ macro: 'Grasas', g: Math.round(after.f - t.fat) });
  if (excess <= MARGIN && !over.length) return null;
  const cut = excess > MARGIN ? Math.round(Math.min(excess, pendingKcal * (1 - MIN_SHARE))) : 0;
  const rest = Math.max(0, excess - cut);
  const deficit = t.tdee - t.kcal;
  // Caminata rápida ≈ 4,3 MET: kcal/min = MET × 3,5 × kg / 200.
  const perMin = (4.3 * 3.5 * weightKg) / 200;
  return {
    excess: Math.max(0, excess),
    cut,
    rest,
    delayDays: goal === 'lose' && deficit > 0 ? Math.round((rest / deficit) * 10) / 10 : null,
    fatG: Math.round(rest / KCAL_PER_G_FAT),
    walkMin: Math.round(rest / perMin / 5) * 5,
    over,
  };
}

/** Texto de la consecuencia, en frases cortas y sin culpa. */
export function consequenceLines(x: Consequence, goal: Goal): string[] {
  const lines: string[] = [];
  if (x.cut > 0) lines.push(`Tus comidas pendientes bajan ${x.cut} kcal para compensar.`);
  if (x.rest > 0) {
    if (goal === 'lose' && x.delayDays !== null) {
      const d = x.delayDays < 1 ? 'menos de un día' : `${String(x.delayDays).replace('.', ',')} día${x.delayDays === 1 ? '' : 's'}`;
      lines.push(`Lo que no se compensa (${x.rest} kcal) retrasa tu meta ${d}.`);
    } else {
      lines.push(`Lo que no se compensa (${x.rest} kcal) suma ≈ ${x.fatG} g de grasa${goal === 'gain' ? ', no músculo' : ''}.`);
    }
    if (x.walkMin >= 5) lines.push(`Equivale a ${x.walkMin} min de caminata rápida.`);
  }
  for (const o of x.over) lines.push(`${o.macro}: ${o.g} g por encima de tu meta del día.`);
  return lines;
}
