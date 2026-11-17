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

/** Producto de Open Food Facts (`/api/v2/product/{codigo}.json` → `product`) a `Food`. `null` si no trae calorías por 100 g. */
export function foodFromOff(barcode: string, product: unknown): Food | null {
  const pr = (product ?? {}) as Record<string, unknown>;
  const n = (pr.nutriments ?? {}) as Record<string, unknown>;
  const num = (k: string) => {
    const v = Number(n[k]);
    return Number.isFinite(v) && v >= 0 ? Math.round(v * 10) / 10 : null;
  };
  const kcal = num('energy-kcal_100g');
  const name = [pr.product_name_es, pr.product_name, pr.generic_name].find((x) => typeof x === 'string' && x.trim()) as string | undefined;
  if (kcal === null || !name) return null;
  const p = num('proteins_100g') ?? 0;
  const c = num('carbohydrates_100g') ?? 0;
  const f = num('fat_100g') ?? 0;
  const role: Food['role'] = p * 4 >= c * 4 && p * 4 >= f * 9 ? 'P' : f * 9 > c * 4 ? 'F' : 'C';
  const brand = typeof pr.brands === 'string' ? pr.brands.split(',')[0].trim() : '';
  return { id: offId(barcode), name: brand ? `${name.trim()} (${brand})` : name.trim(), emoji: '🏷️', kcal, p, c, f, role };
}
