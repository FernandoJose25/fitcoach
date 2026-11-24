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
    .map((f) => ({ f, n: normalize(f.name), k: f.kw || f.aka ? normalize(`${f.name} ${f.kw ?? ''} ${f.aka ?? ''}`) : null }))
    .filter(({ n, k }) => words.every((w) => (k ?? n).includes(w)))
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
/** Producto cuyos valores estimó la IA por el nombre (sin tabla nutricional): se reemplaza al leer la etiqueta. */
export const estimateId = (barcode: string) => `est_${barcode}`;
/** Código de barras de un alimento propio, si lo tiene. */
export const barcodeOf = (id: string) => id.match(/^(?:off|bc|est)_(\d+)$/)?.[1] ?? null;

const validEan = (code: string) => {
  const sum = [...code.slice(0, -1)].reverse().reduce((t, d, i) => t + Number(d) * (i % 2 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10 === Number(code.at(-1));
};
/** UPC-E (8 dígitos, golosinas importadas) al UPC-A que representa. */
const expandUpcE = (c: string) => {
  const [n, a, b, d, e, f, g, check] = c;
  const body = g <= '2' ? `${a}${b}${g}0000${d}${e}${f}` : g === '3' ? `${a}${b}${d}00000${e}${f}` : g === '4' ? `${a}${b}${d}${e}00000${f}` : `${a}${b}${d}${e}${f}0000${g}`;
  return `${n}${body}${check}`;
};

/**
 * Código de producto leído por la cámara (EAN-13, EAN-8, UPC-A o UPC-E) en su forma EAN, o `null` si no lo es:
 * los empaques traen otros códigos (lote, fecha) y una lectura a medias no pasa el dígito de control.
 * A los UPC-A (12 dígitos) se les antepone el 0.
 */
export function parseBarcode(raw: string): string | null {
  const code = raw.trim();
  if (!/^(\d{8}|\d{12,13})$/.test(code)) return null;
  if (validEan(code)) return code.length === 12 ? `0${code}` : code;
  const upc = code.length === 8 ? expandUpcE(code) : null;
  return upc && validEan(upc) ? `0${upc}` : null;
}

/** Rol de un alimento por el macro que más calorías aporta. */
export const roleOf = (p: number, c: number, f: number): Food['role'] => (p * 4 >= c * 4 && p * 4 >= f * 9 ? 'P' : f * 9 > c * 4 ? 'F' : 'C');

const r1 = (v: number) => Math.round(v * 10) / 10;

/** Nombre de un producto de Open Food Facts con su marca, o `null`. Muchos tienen nombre pero no valores. */
export function offName(product: unknown): string | null {
  const pr = (product ?? {}) as Record<string, unknown>;
  const brands = Array.isArray(pr.brands) ? (pr.brands as unknown[]).join(',') : pr.brands;
  const brand = typeof brands === 'string' ? brands.split(',')[0].trim() : '';
  const raw = [pr.product_name_es, pr.product_name, pr.generic_name_es, pr.generic_name, pr.abbreviated_product_name, pr.product_name_en].find(
    (x) => typeof x === 'string' && x.trim(),
  ) as string | undefined;
  const base = raw?.trim().replace(/\s+/g, ' ');
  if (!base) return brand || null;
  return brand && !normalize(base).includes(normalize(brand)) ? `${base} (${brand})` : base;
}

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

  const name = offName(pr);
  if (!name) return null;
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
  const zero = v.kcal === 0 && kcal < 5; // agua, gaseosa sin azúcar: 0 kcal en la etiqueta
  if (!name.trim() || (kcal <= 0 && !zero) || kcal > 950 || p + c + f > 100.5) return null;
  return { id, name: name.trim(), emoji: opts.emoji ?? '🍽️', kcal: r1(kcal), p: r1(p), c: r1(c), f: r1(f), role: roleOf(p, c, f), src: opts.src ?? 'user', ...(opts.serving ? { serving: opts.serving } : {}) };
}
