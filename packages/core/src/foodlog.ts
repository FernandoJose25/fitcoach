import type { Food } from './types';

/** Minúsculas y sin tildes, para comparar nombres. */
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

/** Búsqueda local: todas las palabras de la consulta deben aparecer; primero los que empiezan por ella. */
export function searchFoods(foods: Record<string, Food>, query: string): Food[] {
  const q = normalize(query);
  const all = Object.values(foods);
  if (!q) return all;
  const words = q.split(/\s+/);
  return all
    .map((f) => ({ f, n: normalize(f.name) }))
    .filter(({ n }) => words.every((w) => n.includes(w)))
    .sort((a, b) => Number(b.n.startsWith(q)) - Number(a.n.startsWith(q)) || a.n.localeCompare(b.n))
    .map(({ f }) => f);
}

/** Últimos alimentos distintos registrados, del más reciente al más antiguo. */
export function frequentFoodIds(logs: Record<string, { foodId: string }[]>, limit = 10): string[] {
  const out: string[] = [];
  for (const day of Object.keys(logs).sort().reverse()) {
    for (const l of [...logs[day]].reverse()) {
      if (!out.includes(l.foodId)) out.push(l.foodId);
      if (out.length === limit) return out;
    }
  }
  return out;
}

export const offId = (barcode: string) => `off_${barcode}`;
/** Producto creado por el usuario para un código que no está en Open Food Facts (se comparte con los demás). */
export const barcodeId = (barcode: string) => `bc_${barcode}`;
/** Código de barras de un alimento propio, si lo tiene. */
export const barcodeOf = (id: string) => (id.startsWith('off_') ? id.slice(4) : id.startsWith('bc_') ? id.slice(3) : null);

/** Rol de un alimento por el macro que más calorías aporta. */
export const roleOf = (p: number, c: number, f: number): Food['role'] => (p * 4 >= c * 4 && p * 4 >= f * 9 ? 'P' : f * 9 > c * 4 ? 'F' : 'C');

const r1 = (v: number) => Math.round(v * 10) / 10;

/**
 * Producto de Open Food Facts (`/api/v2/product/{codigo}.json` → `product`, o un resultado de búsqueda) a `Food`.
 * Muchos productos no traen `energy-kcal_100g`: se calcula desde los kJ, desde los macros, o desde los valores
 * por porción con el peso de la porción. `null` si no hay nombre ni marca, o si no hay ningún dato de energía.
 */
export function foodFromOff(barcode: string, product: unknown): Food | null {
  const pr = (product ?? {}) as Record<string, unknown>;
  const n = (pr.nutriments ?? {}) as Record<string, unknown>;
  const num = (k: string) => {
    const v = Number(n[k]);
    return n[k] !== undefined && n[k] !== '' && Number.isFinite(v) && v >= 0 ? v : null;
  };
  const serving = Number(pr.serving_quantity);
  const per100 = (key: string) => {
    const v = num(`${key}_100g`);
    if (v !== null) return v;
    const s = num(`${key}_serving`);
    return s !== null && serving > 0 ? (s * 100) / serving : null;
  };
  const p = per100('proteins');
  const c = per100('carbohydrates');
  const f = per100('fat');
  const kj = per100('energy-kj') ?? per100('energy'); // en Open Food Facts, `energy` va en kJ
  let kcal = per100('energy-kcal') ?? (kj !== null ? kj / 4.184 : null);
  if (kcal === null && (p !== null || c !== null || f !== null)) kcal = (p ?? 0) * 4 + (c ?? 0) * 4 + (f ?? 0) * 9;
  if (kcal === null || kcal > 950) return null;

  const brands = Array.isArray(pr.brands) ? (pr.brands as unknown[]).join(',') : pr.brands;
  const brand = typeof brands === 'string' ? brands.split(',')[0].trim() : '';
  const raw = [pr.product_name_es, pr.product_name, pr.generic_name_es, pr.generic_name, pr.abbreviated_product_name, pr.product_name_en].find(
    (x) => typeof x === 'string' && x.trim(),
  ) as string | undefined;
  const base = raw?.trim().replace(/\s+/g, ' ');
  if (!base && !brand) return null;
  const name = !base ? brand : brand && !normalize(base).includes(normalize(brand)) ? `${base} (${brand})` : base;
  const food: Food = { id: offId(barcode), name, emoji: '🏷️', kcal: r1(kcal), p: r1(p ?? 0), c: r1(c ?? 0), f: r1(f ?? 0), role: roleOf(p ?? 0, c ?? 0, f ?? 0), src: 'off' };
  if (serving > 0 && serving <= 1000) {
    const g = Math.round(serving);
    food.serving = { g, label: typeof pr.serving_size === 'string' && pr.serving_size.trim() ? pr.serving_size.trim() : `${g} g` };
  }
  return food;
}

/** Resultados de la búsqueda de Open Food Facts (`search.openfoodfacts.org/search` → `hits`) con datos útiles. */
export function foodsFromOffSearch(hits: unknown, limit = 15): Food[] {
  if (!Array.isArray(hits)) return [];
  const out: Food[] = [];
  for (const h of hits as Record<string, unknown>[]) {
    const code = typeof h?.code === 'string' ? h.code : '';
    const f = code ? foodFromOff(code, h) : null;
    if (f && !out.some((x) => x.id === f.id)) out.push(f);
    if (out.length === limit) break;
  }
  return out;
}

/** Alimento escrito por el usuario (valores por 100 g). `null` si los datos no tienen sentido. */
export function customFood(
  id: string,
  name: string,
  v: { kcal?: number | null; p: number; c: number; f: number },
  opts: { emoji?: string; serving?: Food['serving']; src?: Food['src'] } = {},
): Food | null {
  const p = Math.max(0, v.p || 0);
  const c = Math.max(0, v.c || 0);
  const f = Math.max(0, v.f || 0);
  const kcal = v.kcal && v.kcal > 0 ? v.kcal : p * 4 + c * 4 + f * 9;
  if (!name.trim() || kcal <= 0 || kcal > 950 || p + c + f > 100.5) return null;
  return { id, name: name.trim(), emoji: opts.emoji ?? '🍽️', kcal: r1(kcal), p: r1(p), c: r1(c), f: r1(f), role: roleOf(p, c, f), src: opts.src ?? 'user', ...(opts.serving ? { serving: opts.serving } : {}) };
}
