import { createClient } from 'npm:@supabase/supabase-js@2';

const DAILY_LIMIT = 30;
// Groq por defecto (API compatible con OpenAI). El modelo con visión de Groq está en preview:
// si lo retiran, cambia VISION_MODEL sin redesplegar (`supabase secrets set VISION_MODEL=...`).
const BASE_URL = Deno.env.get('VISION_BASE_URL') ?? 'https://api.groq.com/openai/v1';
const MODEL = Deno.env.get('VISION_MODEL') ?? 'qwen/qwen3.8-27b';
const KEY = Deno.env.get('VISION_API_KEY');

const PER100 = '"kcal":<kcal por 100 g>,"p":<proteína g por 100 g>,"c":<carbohidratos g por 100 g>,"f":<grasa g por 100 g>';
// Un plato mezclado (chaufa, saltado…) se pide desglosado: si no, el modelo lo devuelve como un solo item.
const PHOTO = `Eres un asistente de nutrición. Analiza la foto de una comida y responde SOLO con JSON válido:
{"items":[{"name":"nombre del alimento en español, genérico y simple","grams":<número>,"confidence":<0 a 1>,${PER100}}]}
Reglas:
- Desglosa el plato: un item por cada ingrediente o componente que se vea, aunque vengan mezclados. Nunca
  devuelvas un plato preparado como un solo item. Ejemplos: arroz chaufa → "arroz frito", "pollo", "huevo
  revuelto", "cebolla china"; tallarín saltado → "fideos cocidos", "carne de res salteada", "cebolla", "tomate";
  lomo saltado → "carne de res salteada", "papas fritas", "arroz blanco cocido", "cebolla", "tomate";
  aeropuerto → "arroz frito", "fideos salteados", "pollo", "brotes de soya", "cebolla china".
- Mira bien las mezclas: si entre el arroz hay fideos, huevo o carne, cada uno va como item aparte.
- Incluye lo que aporte calorías aunque sea poco (salsas, aceite, queso, palta). Omite adornos sin calorías.
- Estima los gramos de cada componente según la porción visible; la suma debe ser el peso total del plato.
- Nombres genéricos y simples, como "arroz blanco cocido", "pechuga de pollo a la plancha", "huevo frito".
Los valores nutricionales son por 100 g del componente tal como se ve (cocido, frito...), según tablas de
referencia (USDA, CENAN). Sin explicaciones. Si no hay comida en la imagen responde {"items":[]}`;
const NAME = `Eres un asistente de nutrición. Te doy el nombre de una comida, bebida o producto (puede ser un plato
peruano o latinoamericano). Responde SOLO con JSON válido:
{"name":"nombre corregido en español","emoji":"un emoji de comida","serving_g":<gramos de una porción típica>,"serving":"descripción corta de la porción (p. ej. 1 plato, 1 vaso, 1 unidad)",${PER100}}
Valores por 100 g según tablas de referencia (USDA, CENAN) o la receta típica. Si no es algo comestible
responde {"name":""}`;

const num = (v: unknown, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.min(max, Math.round(n * 10) / 10) : null;
};
/** Valores por 100 g coherentes (kcal ≈ 4P + 4C + 9G, ±35 %); si no, null. */
function per100(x: Record<string, unknown>) {
  const kcal = num(x.kcal, 950);
  const p = num(x.p, 100);
  const c = num(x.c, 100);
  const f = num(x.f, 100);
  if (kcal === null || p === null || c === null || f === null || p + c + f > 100.5) return null;
  const calc = p * 4 + c * 4 + f * 9;
  if (kcal > 0 && Math.abs(calc - kcal) > Math.max(25, kcal * 0.35)) return null;
  return { kcal: kcal || Math.round(calc), p, c, f };
}

async function ask(content: unknown, system: string) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      // El plan gratis de Groq rechaza (429) pedidos que podrían pasar de 1000 tokens de salida por minuto;
      // un desglose usa ~150-300.
      max_tokens: 700,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content },
      ],
    }),
  });
  if (!res.ok) {
    console.error('provider', res.status, await res.text());
    return null;
  }
  const json = await res.json();
  const text: string = json.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}') as Record<string, unknown>;
}

Deno.serve(async (req) => {
  try {
    // Sin clave del proveedor el servicio no está configurado: la app lo muestra como "no disponible".
    if (!KEY) return Response.json({ error: 'unavailable' }, { status: 503 });
    const auth = req.headers.get('Authorization') ?? '';
    const supa = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const {
      data: { user },
    } = await supa.auth.getUser(auth.replace('Bearer ', ''));
    if (!user) return new Response('unauthorized', { status: 401 });

    const body = await req.json();

    // Modo nombre: estimación de un alimento que no está en la base (texto, barato; no cuenta en el límite de fotos).
    if (typeof body.name === 'string') {
      const name = body.name.trim().slice(0, 80);
      if (name.length < 2) return Response.json({ error: 'name' }, { status: 400 });
      const out = await ask(name, NAME);
      if (!out) return Response.json({ error: 'provider' }, { status: 502 });
      const v = per100(out);
      if (!v || typeof out.name !== 'string' || !out.name.trim()) return Response.json({ food: null });
      const g = num(out.serving_g, 1500);
      return Response.json({
        food: {
          name: out.name.trim().slice(0, 60),
          emoji: typeof out.emoji === 'string' && out.emoji.length <= 8 ? out.emoji : '🍽️',
          ...v,
          ...(g ? { serving: { g: Math.round(g), label: typeof out.serving === 'string' ? out.serving.slice(0, 40) : `${Math.round(g)} g` } } : {}),
        },
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: u } = await supa.from('scan_usage').select('n').eq('user_id', user.id).eq('day', today).maybeSingle();
    if ((u?.n ?? 0) >= DAILY_LIMIT) return Response.json({ error: 'limit' }, { status: 429 });

    const { imageBase64, mime = 'image/jpeg' } = body;
    if (typeof imageBase64 !== 'string' || !imageBase64) return Response.json({ error: 'image' }, { status: 400 });
    const parsed = await ask([{ type: 'image_url', image_url: { url: `data:${mime};base64,${imageBase64}` } }], PHOTO);
    if (!parsed) return Response.json({ error: 'provider' }, { status: 502 });
    // Solo cuenta el escaneo si el proveedor respondió.
    await supa.from('scan_usage').upsert({ user_id: user.id, day: today, n: (u?.n ?? 0) + 1 });
    const items = ((parsed.items as Record<string, unknown>[]) ?? [])
      .filter((i) => typeof i.name === 'string' && Number(i.grams) > 0)
      .map((i) => ({
        name: i.name as string,
        grams: Math.min(800, Math.round(Number(i.grams))),
        confidence: Number(i.confidence) || 0.5,
        per100: per100(i),
      }));
    return Response.json({ items });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
