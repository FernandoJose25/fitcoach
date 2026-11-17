# FitCoach

App móvil gratuita de nutrición + entrenamiento. Especificación completa en [docs/SPEC.md](docs/SPEC.md).

```
packages/core   lógica pura (calorías, plan de comidas, rutinas, veredicto) — 100 % testeable
apps/mobile     Expo + Expo Router + TypeScript
supabase        migraciones, Edge Function scan-food, semillas
```

## Comandos

```bash
pnpm install
pnpm -w test                   # tests del core (Vitest)
pnpm -w typecheck              # tsc en todos los paquetes
pnpm --filter mobile start     # Metro / Expo Go
```

## Estado por fases (sección 15 del SPEC)

- [x] F0 Setup
- [x] F1 Core + datos semilla + tests
- [ ] F2 Onboarding + Hoy + Plan
- [ ] F3 Registro
- [ ] F4 Escáner IA
- [ ] F5 Entreno
- [ ] F6 Aprende + Perfil + Lista de compras
- [ ] F7 Pulido
- [ ] F8 Beta
