import { createClient } from 'npm:@supabase/supabase-js@2';
import { LABEL, NAME, PHOTO } from './prompts.ts';
import { emojiFor, storeLookup, type Per100 } from './store.ts';

const DAILY_LIMIT = 30;
// Groq por defecto (API compatible con OpenAI). El modelo con visión de Groq está en preview:
// si lo retiran, cambia VISION_MODEL sin redesplegar (`supabase secrets set VISION_MODEL=...`).
const BASE_URL = Deno.env.get('VISION_BASE_URL') ?? 'https://api.groq.com/openai/v1';
const MODEL = Deno.env.get('VISION_MODEL') ?? 'qwen/qwen3.8-27b';
const KEY = Deno.env.get('VISION_API_KEY');
/** Lo máximo que se espera por un cupo del proveedor (429) antes de devolver `busy`. */
const MAX_WAIT_S = 15;

const num = (v: unknown, max: number) => {
  const n = Number(v);
  return v !== null && v !== '' && Number.isFinite(n) && n >= 0 ? Math.min(max, Math.round(n * 10) / 10) : null;
};
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
/**
 * Valores por 100 g de la IA; null si faltan o no caben en 100 g. Si la energía no cuadra con los macros (±35 %) manda
 * la mayor: o la IA se equivocó en las kcal, o son de alcohol (cerveza, pisco), que no está en los macros.
 */
function per100(x: Record<string, unknown>): Per100 | null {
  const kcal = num(x.kcal ?? x.k, 950);
  const p = num(x.p, 100);
  const c = num(x.c, 100);
  const f = num(x.f, 100);
  if (kcal === null || p === null || c === null || f === null || p + c + f > 100.5) return null;
  const calc = p * 4 + c * 4 + f * 9;
  const off = kcal === 0 || Math.abs(calc - kcal) > Math.max(25, kcal * 0.35);
  return { kcal: off ? Math.min(900, Math.round(Math.max(kcal, calc))) : kcal, p, c, f };
}

type Failure = { error: 'busy' | 'provider' };
const fail = ({ error }: Failure) => Response.json({ error }, { status: error === 'busy' ? 429 : 502 });

/**
 * Pide al modelo y devuelve el JSON. Un error 5xx o un JSON roto se reintenta una vez; un 429 (cupo por minuto
 * del plan gratis) espera lo que pide el proveedor, si es poco.
 */
async function ask(content: unknown, system: string, maxTokens: number): Promise<{ out: Record<string, unknown> } | Failure> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.1,
        // El plan gratis de Groq rechaza (429) pedidos que podrían pasar de 1000 tokens de salida por minuto.
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content },
        ],
      }),
    });
    if (!res.ok) {
      console.error('provider', res.status, await res.text());
      if (res.status === 429) {
        const wait = Number(res.headers.get('retry-after')) || 10;
        if (attempt > 0 || wait > MAX_WAIT_S) return { error: 'busy' };
        await new Promise((r) => setTimeout(r, wait * 1000));
        continue;
      }
      if (res.status >= 500 && attempt === 0) continue;
      return { error: 'provider' };
    }
    const json = await res.json();
    const raw: string = json.choices?.[0]?.message?.content ?? '{}';
    try {
      return { out: JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}') };
    } catch {
      console.error('json', raw.slice(0, 300));
    }
  }
  return { error: 'provider' };
}

/** Estimación por nombre (plato o producto). `food: null` si no es comestible. */
async function estimate(name: string) {
  const r = await ask(name, NAME, 300);
  if ('error' in r) return r;
  const v = per100(r.out);
  const label = text(r.out.name, 60);
  if (!v || !label) return { food: null };
  const g = num(r.out.serving_g, 1500);
  const emoji = text(r.out.emoji, 20);
  return { food: { name: label, emoji: emoji && emoji.length <= 8 ? emoji : '🍽️', ...v, ...(g ? { serving: { g: Math.round(g), label: text(r.out.serving, 40) || `${Math.round(g)} g` } } : {}) } };
}

Deno.serve(async (req) => {
  try {
    const auth = req.headers.get('Authorization') ?? '';
    const supa = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const {
      data: { user },
    } = await supa.auth.getUser(auth.replace('Bearer ', ''));
    if (!user) return new Response('unauthorized', { status: 401 });

    const body = await req.json();

    // Código de barras que no está en la app, ni en la base compartida, ni en Open Food Facts. La tabla del
    // supermercado es la de la etiqueta; si no hay, la IA estima por el nombre (`hint`: el de Open Food Facts sin valores).
    if (typeof body.barcode === 'string') {
      if (!/^\d{8,14}$/.test(body.barcode)) return Response.json({ error: 'barcode' }, { status: 400 });
      const p = await storeLookup(body.barcode);
      if (p?.per100) return Response.json({ source: 'label', food: { name: p.name, emoji: emojiFor(p), ...p.per100, ...(p.serving ? { serving: p.serving } : {}) } });
      const name = p?.name || text(body.hint, 80);
      if (!name || !KEY) return Response.json({ food: null, name });
      const r = await estimate(name);
      if ('error' in r || !r.food) return Response.json({ food: null, name });
      return Response.json({ source: 'ai', food: { ...r.food, name, ...(p ? { emoji: emojiFor(p) } : {}), ...(p?.serving ? { serving: p.serving } : {}) } });
    }

    // Sin clave del proveedor el servicio no está configurado: la app lo muestra como "no disponible".
    if (!KEY) return Response.json({ error: 'unavailable' }, { status: 503 });

    // Modo nombre: estimación de un alimento que no está en la base (texto, barato; no cuenta en el límite de fotos).
    if (typeof body.name === 'string') {
      const name = text(body.name, 80);
      if (name.length < 2) return Response.json({ error: 'name' }, { status: 400 });
      const r = await estimate(name);
      return 'error' in r ? fail(r) : Response.json(r);
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: u } = await supa.from('scan_usage').select('n').eq('user_id', user.id).eq('day', today).maybeSingle();
    if ((u?.n ?? 0) >= DAILY_LIMIT) return Response.json({ error: 'limit' }, { status: 429 });
    // Solo cuenta la foto si el proveedor respondió.
    const count = async () => {
      const { error } = await supa.from('scan_usage').upsert({ user_id: user.id, day: today, n: (u?.n ?? 0) + 1 });
      if (error) console.error('scan_usage', error.message);
    };

    const { imageBase64, mime = 'image/jpeg' } = body;
    if (typeof imageBase64 !== 'string' || !imageBase64) return Response.json({ error: 'image' }, { status: 400 });
    const image = { type: 'image_url', image_url: { url: `data:${mime};base64,${imageBase64}` } };

    // Modo etiqueta: lee la tabla nutricional del empaque para no copiarla a mano.
    if (body.label === true) {
      const r = await ask([image], LABEL, 250);
      if ('error' in r) return fail(r);
      await count();
      const { out } = r;
      const per = String(out.per) === '100' ? '100' : out.per === 'portion' ? 'portion' : null;
      if (!per) return Response.json({ label: null });
      return Response.json({ label: { name: text(out.name, 60), per, portion: num(out.portion, 1500), kcal: num(out.kcal, 2000), p: num(out.p, 500), c: num(out.c, 500), f: num(out.f, 500) } });
    }

    // Pista del usuario al corregir ("es un ají de gallina"): ayuda a reconocer el plato, se desglosa igual.
    const hint = text(body.hint, 120);
    const content = hint ? [{ type: 'text', text: `El usuario dice que la foto es: "${hint}". Úsalo para reconocer el plato y desglósalo igual.` }, image] : [image];
    const r = await ask(content, PHOTO, 700);
    if ('error' in r) return fail(r);
    await count();
    const items = (Array.isArray(r.out.items) ? (r.out.items as Record<string, unknown>[]) : [])
      .filter((i) => text(i.n, 60) && Number(i.g) > 0)
      .map((i) => ({
        name: text(i.n, 60),
        grams: Math.min(800, Math.round(Number(i.g))),
        confidence: Number(i.s) || 0.5,
        per100: per100(i),
        alts: (Array.isArray(i.a) ? i.a : []).map((x) => text(x, 40)).filter(Boolean).slice(0, 2),
      }));
    return Response.json({ dish: text(r.out.dish, 60), items });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
