/**
 * Producto por código de barras en los catálogos públicos de supermercados peruanos (Plaza Vea, Wong, Metro).
 * Solo se consulta el código que el usuario acaba de escanear. Plaza Vea publica además la tabla nutricional
 * de la etiqueta; Wong y Metro, solo el nombre. No son APIs oficiales: si dejan de responder, se devuelve null.
 */
type Vtex = { productName?: string; brand?: string; categories?: string[]; [spec: string]: unknown };
export type Per100 = { kcal: number; p: number; c: number; f: number };
export type StoreProduct = { name: string; category: string; per100: Per100 | null; serving: { g: number; label: string } | null };

const PLAZA = 'www.plazavea.com.pe';
const STORES = [PLAZA, 'www.wong.pe', 'www.metro.pe'];

async function query(store: string, path: string): Promise<Vtex[]> {
  try {
    const res = await fetch(`https://${store}/api/catalog_system/pub/products/search${path}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(6000) });
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}

const spec = (p: Vtex, key: string) => {
  const v = p[key];
  return Array.isArray(v) && typeof v[0] === 'string' ? v[0] : '';
};
/** "12,5 g." → 12.5; texto sin número → null. */
const numOf = (s: string) => {
  const m = s.replace(',', '.').match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};
/** Cantidad con unidad ("30 g", "1 taza (200 ml)", "1.5 L") en gramos o mililitros. */
export function amount(s: string): { n: number; unit: 'g' | 'ml' } | null {
  const m = s.replace(/,/g, '.').match(/(\d+(?:\.\d+)?)\s*(kg|gr|g|ml|lt|l)(?![a-z])/i);
  if (!m) return null;
  const u = m[2].toLowerCase();
  const n = Number(m[1]) * (u === 'kg' || u === 'l' || u === 'lt' ? 1000 : 1);
  return n > 0 ? { n, unit: u === 'kg' || u === 'g' || u === 'gr' ? 'g' : 'ml' } : null;
}

const KCAL = [4, 4, 9]; // por gramo de proteína, carbohidrato y grasa
const r1 = (v: number) => Math.round(v * 10) / 10;

/** Valores por 100 desde la tabla por porción de Plaza Vea; null si falta algo o no cuadra (kcal ≈ 4P + 4C + 9G). */
export function tableOf(p: Vtex): Per100 | null {
  const portion = amount(spec(p, 'Porción Sugerida'));
  const kcal = numOf(spec(p, 'Calorías Por Porción'));
  const macros = ['Proteínas', 'Carbohidratos', 'Grasas'].map((k) => numOf(spec(p, `${k} Por Porción`)));
  if (!portion || kcal === null || macros.filter((m) => m === null).length > 1) return null;
  // La tienda a veces omite un macro (casi siempre la grasa): sale de la energía que no explican los otros dos.
  const rest = kcal - macros.reduce<number>((t, m, i) => t + (m ?? 0) * KCAL[i], 0);
  const [pr, c, f] = macros.map((m, i) => m ?? Math.max(0, rest / KCAL[i]));
  const k = 100 / portion.n;
  const calc = pr * 4 + c * 4 + f * 9;
  if (kcal * k > 950 || (pr + c + f) * k > 100.5 || Math.abs(calc - kcal) > Math.max(12, kcal * 0.25)) return null;
  return { kcal: r1(kcal * k), p: r1(pr * k), c: r1(c * k), f: r1(f * k) };
}

const PACK = new Set('bolsa botella caja paquete pack lata sabor con contenido frasco doypack unid sachet vaso pote'.split(' '));
const words = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !/^\d/.test(w) && !PACK.has(w));

/** El mismo producto en otro tamaño o presentación: misma marca y casi todas las palabras del nombre. */
function sameProduct(a: Vtex, b: Vtex) {
  if (words(a.brand ?? '').join() !== words(b.brand ?? '').join()) return false;
  const x = words(a.productName ?? '');
  const y = words(b.productName ?? '');
  const hit = x.filter((w) => y.includes(w)).length;
  return hit / Math.max(1, x.length) >= 0.7 && hit / Math.max(1, y.length) >= 0.6;
}

/** "Gaseosa INCA KOLA Sabor Original Botella 600ml" → "Gaseosa Inca Kola Sabor Original" (sin envase ni tamaño). */
function cleanName(p: Vtex) {
  const brand = (p.brand ?? '').trim();
  let n = (p.productName ?? '').replace(/\s+/g, ' ').trim();
  const at = brand && brand === brand.toUpperCase() ? n.indexOf(brand) : -1;
  if (at >= 0) {
    const nice = brand.toLowerCase().replace(/(^|[\s'-])\p{L}/gu, (m) => m.toUpperCase());
    n = n.slice(0, at) + nice + n.slice(at + brand.length);
  }
  return n
    .replace(/\s+(Botella|Bolsa|Caja|Paquete|Lata|Frasco|Doypack|Contenido|Sachet|Vaso|Pote)(?=\s|$)/gi, '')
    .replace(/\s+\d+([.,]\d+)?\s*(kg|gr|g|ml|lt|l|litros?|un|unid)\.?$/i, '')
    .slice(0, 60)
    .trim();
}

export async function storeLookup(ean: string): Promise<StoreProduct | null> {
  const found = await Promise.all(STORES.map((s) => query(s, `?fq=alternateIds_Ean:${ean}`)));
  const main = found.map((l) => l[0]).find((p) => p?.productName);
  if (!main) return null;
  let source: Vtex | undefined = found[0][0];
  let table = source ? tableOf(source) : null;
  if (!table) {
    // El código está en otra tienda (o sin tabla): se busca el mismo producto en Plaza Vea, que sí publica la etiqueta.
    const q = words(main.productName ?? '').slice(0, 5).join(' ');
    source = q ? (await query(PLAZA, `/${encodeURIComponent(q)}?_from=0&_to=14`)).find((p) => sameProduct(main, p) && tableOf(p)) : undefined;
    table = source ? tableOf(source) : null;
  }
  // Envase personal (botella de 500 ml, bolsita de 42 g) → la porción es todo el envase; si no, la de la etiqueta.
  const size = amount(main.productName ?? '');
  const single = size && size.n <= (size.unit === 'ml' ? 700 : 120) ? size : null;
  const s = single ?? (source ? amount(spec(source, 'Porción Sugerida')) : null);
  return {
    name: cleanName(main),
    category: main.categories?.[0] ?? '',
    per100: table,
    serving: s ? { g: Math.round(s.n), label: `1 ${single ? 'envase' : 'porción'} (${Math.round(s.n)} ${s.unit})` } : null,
  };
}

const EMOJI: [RegExp, string][] = [
  [/energiz/, '⚡'],
  [/agua /, '💧'],
  [/n[eé]ctar|jugo|frugos/, '🧃'],
  [/rehidratante|gaseosa|bebida/, '🥤'],
  [/cereal|avena|granola/, '🥣'],
  [/galleta/, '🍪'],
  [/gomita|caramelo|golosina|chicle|marshm/, '🍬'],
  [/chocolate|bomb[oó]n/, '🍫'],
  [/yogur|leche/, '🥛'],
  [/queso/, '🧀'],
  [/papas|snack|piqueo/, '🥔'],
  [/pan |panet[oó]n/, '🍞'],
  [/conserva|at[uú]n/, '🥫'],
  [/helado/, '🍨'],
];
/** Emoji por el nombre (manda) o la categoría de la tienda. */
export const emojiFor = (p: StoreProduct) => [p.name, p.category].map((s) => EMOJI.find(([re]) => re.test(s.toLowerCase()))?.[1]).find(Boolean) ?? '🏷️';
