import { createClient } from 'npm:@supabase/supabase-js@2';

const DAILY_LIMIT = 30;
// Groq por defecto (API compatible con OpenAI). El modelo con visión de Groq está en preview:
// si lo retiran, cambia VISION_MODEL sin redesplegar (`supabase secrets set VISION_MODEL=...`).
const BASE_URL = Deno.env.get('VISION_BASE_URL') ?? 'https://api.groq.com/openai/v1';
const MODEL = Deno.env.get('VISION_MODEL') ?? 'qwen/qwen3.8-27b';
const SYSTEM = `Eres un asistente de nutrición. Analiza la foto de una comida y responde SOLO con JSON válido:
{"items":[{"name":"nombre del alimento en español, genérico y simple","grams":<número>,"confidence":<0 a 1>}]}
Reglas: separa cada alimento del plato; estima el peso en gramos de la porción visible; usa nombres como
"arroz blanco cocido", "pechuga de pollo a la plancha", "ensalada mixta", "huevo frito". No incluyas calorías
ni explicaciones. Si no hay comida en la imagen responde {"items":[]}`;

Deno.serve(async (req) => {
  try {
    const auth = req.headers.get('Authorization') ?? '';
    const supa = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const {
      data: { user },
    } = await supa.auth.getUser(auth.replace('Bearer ', ''));
    if (!user) return new Response('unauthorized', { status: 401 });

    const today = new Date().toISOString().slice(0, 10);
    const { data: u } = await supa.from('scan_usage').select('n').eq('user_id', user.id).eq('day', today).maybeSingle();
    if ((u?.n ?? 0) >= DAILY_LIMIT) return Response.json({ error: 'limit' }, { status: 429 });

    const { imageBase64, mime = 'image/jpeg' } = await req.json();
    if (typeof imageBase64 !== 'string' || !imageBase64) return Response.json({ error: 'image' }, { status: 400 });
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('VISION_API_KEY')}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: [{ type: 'image_url', image_url: { url: `data:${mime};base64,${imageBase64}` } }] },
        ],
      }),
    });
    if (!res.ok) {
      console.error('vision', res.status, await res.text());
      return Response.json({ error: 'provider' }, { status: 502 });
    }
    // Solo cuenta el escaneo si el proveedor respondió.
    await supa.from('scan_usage').upsert({ user_id: user.id, day: today, n: (u?.n ?? 0) + 1 });
    const json = await res.json();
    const text: string = json.choices?.[0]?.message?.content ?? '{"items":[]}';
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{"items":[]}');
    const items = (parsed.items ?? [])
      .filter((i: any) => typeof i.name === 'string' && Number(i.grams) > 0)
      .map((i: any) => ({
        name: i.name,
        grams: Math.min(800, Math.round(Number(i.grams))),
        confidence: Number(i.confidence) || 0.5,
      }));
    return Response.json({ items });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
