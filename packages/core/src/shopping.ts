import type { Food, Meal } from './types';
import { AISLE_OF, AISLES, BUY_NAME, DRY, FRUITS, LIQUIDS, PIECES, SAME_AS, type Aisle } from './data/market';

export type { Aisle };

export interface ShopItem {
  /** Lo que se compra (las variantes de un mismo ingrediente se suman, p. ej. huevo sancochado → huevo). */
  id: string;
  name: string;
  emoji: string;
  /** Cantidad a comprar, redondeada hacia arriba: "12 unidades", "450 g", "1.5 L". */
  qty: string;
  /** Aclaración de la cantidad (granos y menestras van en peso seco). */
  note?: string;
  aisle: Aisle;
}

export function aisleOf(f: Food): Aisle {
  if (AISLE_OF[f.id]) return AISLE_OF[f.id];
  if (FRUITS.has(f.id)) return 'frutas';
  if (f.role === 'V') return 'verduras';
  if (f.role === 'C') return 'granos';
  if (f.role === 'F' || f.role === 'M') return 'despensa';
  const tags = f.tag?.split(',') ?? [];
  if (tags.includes('lacteos') || tags.includes('huevo')) return 'lacteos';
  if (tags.includes('soya')) return 'menestras';
  return 'carnes';
}

// Redondeo hacia arriba sin que el error de coma flotante sume una unidad (7.0000001 → 7).
const up = (v: number, step: number) => Math.ceil(v / step - 1e-6) * step;

function amount(v: number, unit: 'g' | 'ml') {
  if (v < 1000) return `${up(v, 50)} ${unit}`;
  return `${(up(v, 100) / 1000).toFixed(1)} ${unit === 'g' ? 'kg' : 'L'}`;
}

/**
 * Lista de compras de los menús dados (normalmente los próximos 7 días): agrupada por sección del mercado,
 * con unidades para lo que se compra por pieza, ml para líquidos y peso seco para granos y menestras.
 */
export function shoppingList(
  days: Meal[][],
  foods: Record<string, Food>,
): { aisle: Aisle; label: string; items: ShopItem[] }[] {
  const grams: Record<string, number> = {};
  const units: Record<string, number> = {};
  days.forEach((plan) =>
    plan.forEach((m) =>
      m.items.forEach(({ foodId, grams: g }) => {
        const same = SAME_AS[foodId];
        if (same) units[same[0]] = (units[same[0]] ?? 0) + g / same[1];
        else if (PIECES[foodId]) units[foodId] = (units[foodId] ?? 0) + g / PIECES[foodId][0];
        else grams[foodId] = (grams[foodId] ?? 0) + g * (DRY[foodId] ?? 1);
      }),
    ),
  );
  const items: ShopItem[] = [];
  const add = (id: string, qty: string, note?: string) => {
    const f = foods[id];
    if (f) items.push({ id, name: BUY_NAME[id] ?? f.name, emoji: f.emoji, qty, note, aisle: aisleOf(f) });
  };
  Object.entries(units).forEach(([id, u]) => {
    const n = Math.max(1, up(u, 1));
    add(id, `${n} ${PIECES[id][n === 1 ? 1 : 2]}`);
  });
  Object.entries(grams).forEach(([id, g]) =>
    add(id, amount(g, LIQUIDS.has(id) ? 'ml' : 'g'), DRY[id] ? 'peso en seco' : undefined),
  );
  return AISLES.map(([aisle, label]) => ({
    aisle,
    label,
    items: items.filter((x) => x.aisle === aisle).sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((s) => s.items.length > 0);
}
