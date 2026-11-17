# FitCoach — Plan para llegar a Fitia + Simetri

Objetivo: una sola app gratuita con la lógica de **Fitia** (nutrición) y **Simetri** (gym). La especificación técnica completa está en [SPEC.md](SPEC.md); este documento ordena el trabajo y mide la brecha.

Última actualización: 2026-11-17.

---

## 1. Estado actual

| Área | Estado | Dónde |
|---|---|---|
| Monorepo, CI, Supabase (esquema + Edge Function) | ✅ | F0 |
| Motor de calorías/macros, plan con recetas, rutinas, veredicto, coach | ✅ 12 tests | `packages/core` |
| Welcome, onboarding (10 pantallas, auto-avance), Hoy, Plan, Perfil básico | ✅ probado en emulador | F2 |
| Registro manual, búsqueda, frecuentes, código de barras | ✅ búsqueda probada en emulador; falta escanear un código real en un teléfono | F3 |
| Sincronización con Supabase (auth anónima, perfil, registros, agua) | 🟡 escrita, sin probar: falta el proyecto Supabase (§7) y aplicar `0002_off_foods.sql` | F3 |
| Recuperar datos al reinstalar | ⬜ la sesión anónima se pierde al desinstalar; requiere vincular email | F3 |
| Entreno (series, peso, descanso, historial) | ⬜ | F5 |
| Escáner de plato con IA | ⬜ | F4 |
| Aprende, perfil con gráfico de peso | ⬜ | F6 |
| Contenido: 31 alimentos, 23 recetas, 42 ejercicios sin imagen | ⬜ brecha principal | — |

---

## 2. Brecha frente a Fitia

| Función de Fitia | FitCoach | Fase |
|---|---|---|
| Metas y macros calculados desde el onboarding | ✅ misma fórmula | — |
| Plan diario con recetas intercambiables y porciones escaladas | ✅ con 23 recetas | Contenido |
| Base grande de alimentos peruanos | ⬜ 31 alimentos | Contenido |
| Búsqueda rápida y alimentos frecuentes | ✅ | — |
| Código de barras (Open Food Facts) | ✅ falta prueba en teléfono | — |
| Foto del plato con IA | ⬜ | F4 |
| Agua y lista de compras | ✅ | — |
| Peso semanal con gráfico | ⬜ | F6 |
| Ajuste automático de calorías según progreso | ⬜ | v1.1 |
| Recetas con pasos y foto propia | ⬜ texto en una línea | v1.x (producción de contenido) |
| Recordatorios (comer, agua, pesarte) | ⬜ | v1.1 |

## 3. Brecha frente a Simetri

| Función de Simetri | FitCoach | Fase |
|---|---|---|
| Rutina por objetivo, nivel, lugar y días | ✅ en el core, sin pantalla | F5 |
| Split semanal con calendario | ✅ en el core | F5 |
| Registrar peso × repeticiones por serie | ⬜ | F5 |
| Historial y progresión de fuerza por ejercicio | ⬜ no está en el SPEC, se añade | F5 |
| Temporizador de descanso en segundo plano | ⬜ | F5 |
| Cambiar un ejercicio por otro equivalente | ⬜ | F5 |
| Demostración visual del ejercicio (imagen) | ⬜ | Contenido (`free-exercise-db`) |
| Video o modelo 3D del ejercicio | ⬜ | v1.x |
| Medidas corporales y fotos de progreso | ⬜ | v1.1 |
| Racha y logros | ⬜ racha parcial | F5 / v1.1 |

---

## 4. Orden de ejecución (ajustado)

El SPEC propone F3 → F4 → F5 → F6. Se cambia a **F3 → F5 → Contenido → F4 → F6** porque:
- Entreno es lo que convierte la app en "Fitia + Simetri"; sin él solo compite con Fitia.
- El escáner con IA necesita una base de alimentos grande para que lo detectado se encuentre en la tabla `foods`.

### F3 · Registro (3–4 días)
- Modal del botón ＋: pestañas **Buscar** · **Código de barras** · **Plato** (placeholder hasta F4).
- Búsqueda local sobre `FOODS` con gramos ajustables y "frecuentes" (los últimos 10 registrados).
- Código de barras con `expo-camera` → Open Food Facts → guardar en `foods` con `source='off'`.
- Supabase: auth anónima, subir perfil, `meal_logs`, `water_logs`; bajar al reinstalar. Offline primero: la cola local se sincroniza cuando hay red.
- **Aceptación:** registrar un alimento buscado y uno por código; el anillo y las barras cambian; reinstalar la app y recuperar el día.

### F5 · Entreno (4–5 días)
- Pantalla Entreno: tira semanal con sesión del día, tarjeta de sesión, lista de ejercicios con series.
- Por serie: peso (kg) y repeticiones, con el último valor registrado precargado.
- Temporizador de descanso flotante (+15 s, saltar) que sigue en segundo plano con notificación local.
- Historial por ejercicio: mejor serie, volumen semanal, gráfico simple de progresión.
- Cambiar ejercicio por otro del mismo músculo y lugar.
- Terminar entreno suma racha. Tabla `workout_sets` en Supabase.
- **Aceptación:** completar una sesión de gimnasio y una de casa; el descanso suena con la app en segundo plano; el historial muestra la progresión.

### Contenido (en paralelo, 3–4 días)
- **Alimentos:** 300+ desde CENAN (Tablas Peruanas) y USDA, con `source` y `tag` de alérgeno. Incluir platos peruanos comunes (lomo saltado, arroz con pollo, ceviche, causa, ají de gallina).
- **Recetas:** 120+ (≥ 25 por tipo de comida), generadas una vez con IA, validadas por script: cada `foodId` existe, macros recalculados desde la base, alérgenos derivados. Revisión manual antes de publicar.
- **Ejercicios:** catálogo `free-exercise-db` (800+, con imágenes) filtrado por `equipment`; mapear a los músculos del motor. Mantener el catálogo corto como respaldo.
- Mejorar el orden del generador de plan: cercanía a la proteína absoluta de la comida, no solo a la proporción (ver SPEC §7).

### F4 · Escáner IA (1 semana)
- Cámara → foto comprimida → Edge Function `scan-food` → alimentos con gramos editables → macros desde `foods` → veredicto → "Solo consultar" o "Registrar".
- Proveedor y modelo por variables de entorno; verificar el modelo con visión vigente antes de fijarlo.
- **Aceptación:** foto de un plato → al menos 2 alimentos detectados y encontrados en la base; límite de 30/día funciona.

### F6 · Aprende + Perfil (3 días)
- Acordeones con los números del usuario (contenido del SPEC §5.7).
- Perfil: gráfico de calorías de 7 días, gráfico de peso, registrar peso, editar datos, tema, borrar cuenta, atribuciones (Open Food Facts, CENAN, free-exercise-db).

### F7 · Pulido y F8 · Beta (2 semanas)
- Estados vacíos y de error, accesibilidad, offline completo, hápticos finos.
- Build firmado con EAS (ver reglas de cuentas Expo en la memoria del proyecto), política de privacidad, prueba con 10 personas, ficha de Play.

---

## 5. Después del MVP (v1.1+)

En este orden, cada uno vale por sí solo:
1. Ajuste adaptativo semanal de calorías (compara peso real vs esperado, ±100–150 kcal, explica el porqué).
2. Recordatorios: comidas, agua, entreno, pesaje.
3. Medidas corporales y fotos de progreso con comparador.
4. Sustitución inteligente: "no tengo pollo" → alternativas con macros equivalentes.
5. Health Connect: pasos y peso automáticos.
6. Videos o modelos 3D de ejercicios (solo con todo lo anterior hecho; ver criterio en el SPEC §16).
7. Anuncio de apertura con AdMob.

---

## 6. Lo que no se va a igualar en v1.0

- Volumen de recetas con foto propia de Fitia: es producción de contenido, no código.
- Videos 3D de Simetri: se cubre con imágenes de `free-exercise-db` y se evalúa 3D en v1.x.
- Comunidad, retos y chat con IA: fuera de alcance por decisión del SPEC.

---

## 7. Dependencias del usuario

- Crear el proyecto Supabase en la nube y pasar `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` (ver `supabase/README.md`). Necesario para la sincronización de F3.
- Clave del proveedor de visión (Groq o Gemini) para F4.
- Cuenta Expo para builds EAS en F8.
