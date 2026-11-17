# Supabase (proyecto en la nube, sin Docker)

1. Crea un proyecto en https://supabase.com/dashboard y copia la URL y la anon key a `apps/mobile/.env`.
2. Aplica el esquema: pega `migrations/0001_init.sql` en el SQL Editor, o con la CLI:

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push
```

3. Carga la semilla de alimentos: en Table Editor, tabla `foods` → Import data from CSV → `seed/foods_pe.csv`.
4. Activa Auth anónima: Authentication → Providers → Anonymous sign-ins.
5. Despliega la Edge Function y sus secrets:

```bash
npx supabase secrets set VISION_BASE_URL=... VISION_MODEL=... VISION_API_KEY=...
npx supabase functions deploy scan-food
```

`VISION_MODEL` debe ser un modelo con visión vigente del proveedor elegido (Groq o Gemini); verifícalo en su documentación.
