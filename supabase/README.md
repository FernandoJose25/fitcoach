# Supabase (proyecto en la nube, sin Docker)

1. Crea un proyecto en https://supabase.com/dashboard y copia la URL y la anon key a `apps/mobile/.env`.
2. Aplica el esquema: pega en orden los archivos de `migrations/` en el SQL Editor, o con la CLI:

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push
```

3. Carga la semilla de alimentos: en Table Editor, tabla `foods` → Import data from CSV → `seed/foods_pe.csv`. El CSV se genera desde `packages/core` con `node supabase/seed/gen-foods-csv.mjs`; vuelve a correrlo si cambias los alimentos.
4. Activa Auth anónima: Authentication → Providers → Anonymous sign-ins.
5. Despliega la Edge Function y sus secrets:

```bash
npx supabase secrets set VISION_API_KEY=<clave de Groq>
npx supabase functions deploy scan-food
```

El proveedor es Groq (gratis, crea la clave en https://console.groq.com/keys). Por defecto usa `https://api.groq.com/openai/v1` y el modelo `qwen/qwen3.8-27b`, que Groq marca como preview: si lo retiran, define `VISION_MODEL` con el modelo con visión vigente (https://console.groq.com/docs/vision) sin redesplegar.
