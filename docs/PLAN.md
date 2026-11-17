# FitCoach — Plan para llegar a Fitia + Simetri

Objetivo: una sola app gratuita con la lógica de **Fitia** (nutrición) y **Simetri** (gym). La especificación técnica completa está en [SPEC.md](SPEC.md); este documento ordena el trabajo y mide la brecha.

Última actualización: 2026-11-17 (funciones de progreso, recordatorios y animaciones 3D de casa).

---

## 1. Estado actual

| Área | Estado | Dónde |
|---|---|---|
| Monorepo, CI, Supabase (esquema + Edge Function) | ✅ | F0 |
| Motor de calorías/macros, plan con recetas, rutinas, historial de fuerza, veredicto, coach | ✅ 30 tests | `packages/core` |
| Welcome, onboarding (10 pantallas, auto-avance), Hoy, Plan, Perfil básico | ✅ probado en emulador | F2 |
| Registro manual, búsqueda, frecuentes, código de barras | ✅ búsqueda probada en emulador; falta escanear un código real en un teléfono | F3 |
| Sincronización con Supabase (auth anónima, perfil, registros, agua) | 🟡 escrita, sin probar: falta el proyecto Supabase (§7) y aplicar `0002_off_foods.sql` | F3 |
| Recuperar datos al reinstalar | ⬜ la sesión anónima se pierde al desinstalar; requiere vincular email | F3 |
| Entreno: programa por semanas (Semana 01, Día 1…N) y entreno guiado automático (preparación → serie → descanso) con voz, vibración, pantalla encendida y avisos en segundo plano; historial, cambio de ejercicio, racha | ✅ probado en emulador; `workout_sets` se sincroniza (sin probar, igual que F3) | F5 |
| Escáner de plato con IA (Groq) | 🟡 código listo y con tests; falta desplegar `scan-food`, la clave de Groq y probar con una foto real | F4 |
| Aprende, perfil con gráfico de peso | ⬜ | F6 |
| Contenido: 303 alimentos (99 platos y productos peruanos), 133 recetas, 109 ejercicios con imagen | ✅ valores por revisar contra CENAN antes de publicar; imágenes sin probar en emulador | Contenido |

---

## 2. Brecha frente a Fitia

| Función de Fitia | FitCoach | Fase |
|---|---|---|
| Metas y macros calculados desde el onboarding | ✅ misma fórmula | — |
| Plan diario con recetas intercambiables y porciones escaladas | ✅ 133 recetas, 25+ por comida, opciones veganas y sin gluten en todas | — |
| Base grande de alimentos peruanos | 🟡 303 alimentos con platos típicos; falta revisión con CENAN | Contenido |
| Búsqueda rápida y alimentos frecuentes | ✅ | — |
| Código de barras (Open Food Facts) | ✅ falta prueba en teléfono | — |
| Foto del plato con IA | 🟡 falta desplegar y probar | F4 |
| Agua y lista de compras | ✅ | — |
| Peso semanal con gráfico | ✅ registro en Hoy, tendencia y proyección en Progreso (local, sin sincronizar aún) | — |
| Ajuste automático de calorías según progreso | ✅ propuesta semanal ±100–150 kcal con el motivo (`adaptiveAdjust`) | — |
| Recetas con pasos y foto propia | ⬜ texto en una línea | v1.x (producción de contenido) |
| Recordatorios (comer, agua, pesarte) | ✅ notificaciones locales en Perfil (comidas, agua, entreno, pesaje) | — |

## 3. Brecha frente a Simetri

| Función de Simetri | FitCoach | Fase |
|---|---|---|
| Rutina por objetivo, nivel, lugar y días | ✅ | — |
| Split semanal con calendario | ✅ | — |
| Registrar peso × repeticiones por serie | ✅ automático al terminar cada serie; se ajusta con ± durante el descanso | — |
| Historial y progresión de fuerza por ejercicio | ✅ mejor serie, % de cambio, volumen semanal | — |
| Temporizador de descanso en segundo plano | ✅ entreno guiado; avisos locales puntuales solo con permiso de alarmas exactas | — |
| Cambiar un ejercicio por otro equivalente | ✅ 6–10 opciones por músculo y lugar | — |
| Demostración visual del ejercicio (imagen) | ✅ fotos de inicio y final alternadas (`free-exercise-db`), en caché de disco | — |
| Video o modelo 3D del ejercicio | 🟡 animación 3D propia (Blender + MPFB) de los 51 ejercicios de casa; faltan los de gym (requieren modelar máquinas) | v1.x |
| Medidas corporales y fotos de progreso | ✅ pantalla Progreso: medidas con cambio acumulado, fotos en el teléfono y comparador inicio/ahora | — |
| Racha y logros | ✅ racha + 11 logros calculados con tus datos | — |
| Récords personales y progresión automática | ✅ récords por ejercicio, aviso de récord al terminar y objetivo de serie con doble progresión | — |
| Músculos trabajados en la semana | ✅ mapa anatómico + series por grupo en Entreno | — |

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

### Contenido ✅ (2026-11-17)
Hecho: 303 alimentos, 133 recetas, 109 ejercicios con imagen, generador ordenado por calorías y proteína absoluta tras escalar (plan de prueba: 3 022 kcal y 140 g frente a 2 990 y 140). Decisiones:
- Ejercicios: catálogo curado en español que apunta a ids de `free-exercise-db`, no el dataset completo (sus 800+ nombres e instrucciones están en inglés).
- Rol `M` para platos, dulces, bebidas y procesados: se registran y sirven al escáner, pero no entran en recetas ni en el respaldo del generador. `tag` admite varias etiquetas (`res,cebolla`). Migración `0004_food_dishes.sql`.
- `supabase/seed/foods_pe.csv` se regenera con `node supabase/seed/gen-foods-csv.mjs`.
- Pendiente: revisar los valores contra las tablas CENAN y las recetas a mano antes de publicar; ver las imágenes en el emulador.

Alcance original:
- **Alimentos:** 300+ desde CENAN (Tablas Peruanas) y USDA, con `source` y `tag` de alérgeno. Incluir platos peruanos comunes (lomo saltado, arroz con pollo, ceviche, causa, ají de gallina).
- **Recetas:** 120+ (≥ 25 por tipo de comida), generadas una vez con IA, validadas por script: cada `foodId` existe, macros recalculados desde la base, alérgenos derivados. Revisión manual antes de publicar.
- **Ejercicios:** catálogo `free-exercise-db` (800+, con imágenes) filtrado por `equipment`; mapear a los músculos del motor. Mantener el catálogo corto como respaldo.
- Mejorar el orden del generador de plan: cercanía a la proteína absoluta de la comida, no solo a la proporción (ver SPEC §7).

### F4 · Escáner IA 🟡 (2026-11-17)
Hecho: pestaña Plato con cámara, compresión a 1024 px JPEG 0.7, llamada a `scan-food`, emparejado local de cada nombre con la base (`matchFood`, sin red), gramos editables, cambio de alimento, totales, veredicto, "Registrar" o "Solo consultar". La función usa Groq por defecto con modo JSON y solo cuenta el escaneo si el proveedor respondió.
- Proveedor: Groq (gratis). Modelo por defecto `qwen/qwen3.8-27b`, en preview en Groq: si lo retiran, cambiar `VISION_MODEL` sin redesplegar.
- El emparejado se hace en la app con los 303 alimentos locales en vez de pg_trgm en la base: funciona offline y no depende de que la semilla esté cargada.
- Pendiente (usuario): aplicar `0004`, cargar la semilla nueva, `secrets set VISION_API_KEY` y desplegar la función; luego probar una foto real.

Alcance original:
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

- En el build (F8): pedir el permiso "Alarmas y recordatorios" en Android 12+ para que el fin del descanso suene a tiempo. Ya está declarado en `app.config.ts`; en Expo Go no se puede conceder y el aviso puede llegar hasta ~1 min tarde.

- Crear el proyecto Supabase en la nube y pasar `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` (ver `supabase/README.md`). Necesario para la sincronización de F3.
- Clave de Groq para F4 (decidido: Groq, gratis).
- Cuenta Expo para builds EAS en F8.
