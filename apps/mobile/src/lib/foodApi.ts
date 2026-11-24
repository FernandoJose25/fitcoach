import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js';
import { FOODS, PRODUCT_BY_BARCODE, barcodeId, customFood, foodFromOff, foodsFromOffSearch, normalize, offId, type Food } from '@fitcoach/core';
import { supabase } from './supabase';
import { userId } from './sync';
import { useApp } from '@/store/useApp';

/** Open Food Facts puede tardar; sin respuesta en 12 s se corta en vez de dejar un spinner infinito. */
const OFF_TIMEOUT = 12_000;
const UA = { 'User-Agent': 'FitCoach/0.9 (Android)' };
const OFF_FIELDS = 'code,product_name,product_name_es,generic_name,generic_name_es,abbreviated_product_name,brands,nutriments,serving_quantity,serving_size';

async function getJson(url: string, ms = OFF_TIMEOUT): Promise<{ status: number; json: unknown }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { headers: UA, signal: ctrl.signal });
    return { status: res.status, json: res.ok ? await res.json() : null };
  } finally {
    clearTimeout(timer);
  }
}

export type BarcodeResult = { food: Food } | { missing: true } | { error: 'offline' | 'slow' | 'service' };

/**
 * Producto por código de barras, de lo más cercano a lo más lejano:
 * 1. ya guardado en el teléfono; 2. base compartida de FitCoach (productos que otro usuario creó o ya leyó);
 * 3. Open Food Facts. Si nadie lo tiene → `missing` (la app ofrece crearlo).
 */
export async function lookupBarcode(code: string): Promise<BarcodeResult> {
  // 0. Catálogo de productos peruanos que viene con la app (gaseosas, galletas, golosinas, snacks): sin internet.
  const product = PRODUCT_BY_BARCODE[code];
  if (product && FOODS[product]) return { food: FOODS[product] };
  const local = useApp.getState().customFoods;
  const cached = local[offId(code)] ?? local[barcodeId(code)];
  if (cached) return { food: cached };

  if (supabase) {
    try {
      const { data } = await supabase.from('foods').select('id, name_es, emoji, kcal, p, c, f, role, source').in('id', [offId(code), barcodeId(code)]).limit(1);
      const f = data?.[0];
      if (f) {
        const food: Food = { id: f.id, name: f.name_es, emoji: f.emoji ?? '🏷️', kcal: Number(f.kcal), p: Number(f.p), c: Number(f.c), f: Number(f.f), role: f.role, src: f.source === 'off' ? 'off' : 'user' };
        useApp.getState().addFood(food);
        return { food };
      }
    } catch {
      // Sin la base compartida se sigue con Open Food Facts.
    }
  }

  try {
    const { status, json } = await getJson(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${OFF_FIELDS}`);
    // 404 = el producto no existe en Open Food Facts; otro error = el servicio falló.
    if (status !== 200 && status !== 404) return { error: 'service' };
    const food = status === 200 ? foodFromOff(code, (json as { product?: unknown })?.product) : null;
    if (!food) return { missing: true };
    useApp.getState().addFood(food);
    return { food };
  } catch (e) {
    return { error: (e as Error)?.name === 'AbortError' ? 'slow' : 'offline' };
  }
}

/** Productos de marca en Open Food Facts (búsqueda por texto). Vacío si falla: es un extra, no bloquea. */
export async function searchProducts(query: string): Promise<Food[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  try {
    const { json } = await getJson(`https://search.openfoodfacts.org/search?q=${encodeURIComponent(q)}&langs=es&page_size=60&fields=${OFF_FIELDS}`, 8000);
    // El buscador devuelve cualquier producto con alguna palabra ("criollo" → café El Criollo): se exige
    // que el nombre tenga todas las palabras de la consulta (sin el plural final).
    const words = normalize(q)
      .split(/\s+/)
      .filter((w) => w.length >= 3)
      .map((w) => w.replace(/(es|s)$/, ''));
    return foodsFromOffSearch((json as { hits?: unknown })?.hits, 60)
      .filter((f) => {
        const n = normalize(f.name);
        return words.every((w) => n.includes(w));
      })
      .slice(0, 12);
  } catch {
    return [];
  }
}

/** Mensajes de la Edge Function `scan-food` (foto y estimación por nombre). */
export const AI_ERRORS: Record<string, string> = {
  limit: 'Llegaste al límite de 30 fotos de hoy. Mañana se renueva; mientras tanto, búscalo por nombre.',
  provider: 'El servicio de IA no respondió. Inténtalo de nuevo en un momento.',
  unauthorized: 'No pudimos iniciar tu sesión. Revisa tu internet e inténtalo de nuevo.',
  offline: 'Sin conexión. La IA necesita internet; mientras tanto, búscalo por nombre.',
  slow: 'La IA tardó demasiado. Revisa tu conexión e inténtalo de nuevo.',
  unavailable: 'La IA de FitCoach aún no está activada en el servidor. Busca el alimento o créalo con sus valores.',
};

const SESSION_TIMEOUT = 10_000;
const withTimeout = <T>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

/** Llama a `scan-food` con la sesión asegurada; devuelve los datos o la clave de `AI_ERRORS`. */
export async function callAi<T>(body: Record<string, unknown>, timeout: number): Promise<{ data: T } | { error: string }> {
  if (!supabase) return { error: 'unavailable' };
  try {
    await withTimeout(userId(), SESSION_TIMEOUT);
  } catch {
    return { error: 'offline' };
  }
  const { data, error } = await supabase.functions.invoke<T>('scan-food', { body, timeout });
  if (!error) return { data: data as T };
  const code = error instanceof FunctionsHttpError ? ((await error.context.json().catch(() => ({}))) as { error?: string }).error : undefined;
  const status = error instanceof FunctionsHttpError ? (error.context as Response).status : 0;
  if (code && AI_ERRORS[code]) return { error: code };
  if (status === 401) return { error: 'unauthorized' };
  if (status === 404 || status >= 500 || error instanceof FunctionsRelayError) return { error: 'unavailable' };
  if (error instanceof FunctionsFetchError) return { error: /abort|timeout/i.test((error.context as { name?: string } | undefined)?.name ?? '') ? 'slow' : 'offline' };
  return { error: 'provider' };
}

const rand = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const newUserFoodId = () => `usr_${rand()}`;

/** Estimación de un alimento por nombre ("salchipapa", "jugo de papaya") con la IA del servidor. */
export async function estimateByName(name: string): Promise<{ food: Food | null } | { error: string }> {
  type Out = { food: { name: string; emoji: string; kcal: number; p: number; c: number; f: number; serving?: Food['serving'] } | null };
  const r = await callAi<Out>({ name }, 20_000);
  if ('error' in r) return r;
  const x = r.data?.food;
  if (!x) return { food: null };
  const food = customFood(`ai_${rand()}`, x.name, x, { emoji: x.emoji, serving: x.serving, src: 'ai' });
  if (food) useApp.getState().addFood(food);
  return { food };
}

/** Alimento detectado en una foto que no está en la base: se registra con la estimación de la IA. */
export function aiFood(name: string, per100: { kcal: number; p: number; c: number; f: number }): Food | null {
  return customFood(`ai_${rand()}`, name.charAt(0).toUpperCase() + name.slice(1), per100, { src: 'ai' });
}
