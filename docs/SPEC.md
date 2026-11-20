# FitCoach — Especificación completa para construir

App móvil gratuita de **nutrición + entrenamiento** para ganar masa muscular (también perder grasa o mantener). Alternativa a Fitia/Simetri con: plan de comidas con recetas, escáner de comida **antes de comer**, rutinas para casa o gimnasio y una sección "Aprende" para quien no sabe de nutrición.

> **Referencia visual interactiva (v2 del prototipo):** https://claude.ai/artifact/RHNQ4q61N6DzoHbuKSCr2e
> Este documento está pensado para dárselo a Claude Code fase por fase (sección 15).

---

## 1. Alcance

| MVP (v1.0) | Después (v1.x) |
|---|---|
| Onboarding profesional (9 pasos) | Ajuste adaptativo semanal de calorías |
| Motor de calorías y macros | Fotos de progreso y medidas |
| Plan de comidas con recetas, alergias y cambio de receta | Modelos 3D de ejercicios |
| Registro manual (búsqueda) y por código de barras | Escáner de etiquetas nutricionales |
| Escáner de plato con IA, con veredicto antes de comer | Health Connect (pasos) |
| Entreno: split, series, descanso | Retos, logros y comunidad |
| Aprende (guía de nutrición) | Sustitución inteligente de ingredientes |
| Agua, racha, progreso semanal, lista de compras | Anuncio de apertura (AdMob) |

Fuera de alcance v1: cuentas sociales, pagos, chat con IA abierto.

---

## 2. Stack y decisiones

- **App:** Expo (SDK vigente) + React Native + TypeScript + **Expo Router**.
- **Estado:** Zustand (+ persistencia con `@react-native-async-storage/async-storage`). Datos remotos con TanStack Query.
- **Animaciones:** `react-native-reanimated` (resortes, entradas, anillo), `react-native-svg` (anillo y barras), `expo-haptics`.
- **Cámara:** `expo-camera` (foto + códigos de barras) y `expo-image-picker` (galería).
- **Backend:** Supabase (Auth anónima + email, Postgres, RLS, Edge Functions en Deno).
- **IA del escáner (gratis):** Groq (API compatible con OpenAI, modelo con visión) **o** Gemini (Google AI Studio). El proveedor y el modelo van en variables de entorno porque los modelos y los límites gratuitos cambian: **verifica el modelo vigente y los límites en su documentación antes de fijarlos**. La clave vive solo en la Edge Function.
- **Fuentes de alimentos:** Tablas Peruanas de Composición de Alimentos (CENAN/INS, cargar como CSV), USDA FoodData Central, Open Food Facts (códigos de barras; exige atribución, revisa su licencia).
- **Ejercicios:** `free-exercise-db` (dominio público, 800+ ejercicios con imágenes) para el catálogo completo; el motor de rutinas v1 usa el catálogo corto de la sección 11.
- **Decisión clave:** la IA **solo identifica alimentos y gramos**. Las calorías y macros salen **siempre de la base de datos**, no del modelo. Es más consistente y auditable.

---

## 3. Estructura del repositorio (pnpm monorepo)

```
fitcoach/
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
├─ docs/SPEC.md                         # este archivo
├─ packages/core/                       # TypeScript puro, sin React, 100 % testeable
│  ├─ package.json
│  └─ src/
│     ├─ index.ts
│     ├─ types.ts
│     ├─ nutrition.ts                   # calorías y macros
│     ├─ meals.ts                       # generador de plan con recetas
│     ├─ workouts.ts                    # generador de rutinas
│     ├─ scan.ts                        # veredicto antes de comer
│     ├─ splits.ts                      # reparto de kcal por nº de comidas (SPLITS, sección 7)
│     ├─ onboarding.ts                  # preguntas y validaciones
│     ├─ data/foods.ts
│     ├─ data/recipes.ts
│     ├─ data/exercises.ts
│     └─ __tests__/*.test.ts
├─ apps/mobile/
│  ├─ app.config.ts
│  ├─ app/
│  │  ├─ _layout.tsx
│  │  ├─ welcome.tsx
│  │  ├─ onboarding/[step].tsx
│  │  ├─ scan.tsx                       # modal de cámara + hoja de resultado
│  │  ├─ perfil.tsx
│  │  └─ (tabs)/
│  │     ├─ _layout.tsx                 # barra con botón central de cámara
│  │     ├─ index.tsx                   # Hoy
│  │     ├─ plan.tsx
│  │     ├─ entreno.tsx
│  │     └─ aprende.tsx
│  └─ src/
│     ├─ theme.ts
│     ├─ lib/supabase.ts
│     ├─ lib/scanApi.ts
│     ├─ store/useApp.ts
│     └─ components/                    # Ring, MacroBar, MealCard, Chip, OptionCard, SetButton, RestTimer, Sheet, Accordion, Confetti
└─ supabase/
   ├─ migrations/0001_init.sql
   ├─ functions/scan-food/index.ts
   └─ seed/foods_pe.csv
```

---

## 4. Diseño (tokens)

**Tipografía:** Sora 600/700/800 (títulos y números) y DM Sans 400/500/700 (texto), con `@expo-google-fonts`.

`apps/mobile/src/theme.ts`
```ts
export const palette = {
  dark:  { bg:'#0B0F14', card:'#151A21', ink:'#F0F3F6', mut:'#8B95A5', line:'#232A34', acc:'#C8F44D', on:'#0B0F14', p:'#C8F44D', c:'#FFB547', f:'#FF7A59' },
  light: { bg:'#F3F5EF', card:'#FFFFFF', ink:'#11151B', mut:'#5F6B7A', line:'#E3E7DD', acc:'#1E9E57', on:'#FFFFFF', p:'#1E9E57', c:'#E08A00', f:'#E0533A' },
};
export const radius = { card: 24, btn: 18, chip: 16 };
export const spring = { damping: 12, stiffness: 220, mass: 0.6 };   // rebote de botones
export const ease = { out: [0.22, 1, 0.36, 1] as const };           // curva de entradas
```

**Animaciones obligatorias**
- Botones: al presionar escala a 0.93 con resorte y vuelve al soltar; `Haptics.impactAsync(Light)`.
- Anillo de calorías: 1.1 s con curva `ease.out`, parte del valor anterior (no de cero).
- Barras de macros: 1 s, mismo comportamiento.
- Cambio de pestaña: fade + desplazamiento vertical de 14 px, 350 ms.
- Chips de selección: `scale 1.04` al activarse.
- "Cambiar receta": giro en X de 60° a 0° con fade.
- Hoja inferior (escáner): sube 550 ms con `ease.out`.
- Registro exitoso: confeti corto + toast.
- Check de series: relleno con resorte.
- Tema claro y oscuro automáticos (`useColorScheme`) con selector manual.

**Pantallas principales:** ver sección 5.

---

## 5. Pantallas y flujos

### 5.1 Welcome
Marca "FitCoach", frase "Tu entrenador y nutricionista, gratis.", tres beneficios (plan que respeta alergias, rutina casa/gimnasio, escáner de plato) y botón **Empezar**.

### 5.2 Onboarding (9 pasos, barra de progreso, botón atrás)
Cada paso tiene título, **una línea que explica para qué se pide** y opciones con descripción. Textos exactos:

| # | Título | Subtítulo | Campos |
|---|---|---|---|
| 1 | Tus datos básicos | Los usamos para estimar cuántas calorías gasta tu cuerpo en reposo. | Nombre · Sexo biológico (Hombre/Mujer) · Edad · Peso actual (kg) · Altura (cm) |
| 2 | ¿Qué quieres lograr? | Tu objetivo define cuántas calorías comes por encima o por debajo de tu mantenimiento. | **Ganar masa muscular** (Más calorías, proteína alta y entrenamiento de fuerza) · **Perder grasa** (Déficit moderado cuidando tu músculo) · **Mantener peso** (Comer lo que gastas y mejorar tu composición) |
| 2b | Ritmo de progreso | | **Lento** (Recomendado si empiezas: menos grasa acumulada) · **Moderado** (Equilibrio entre velocidad y calidad) · **Rápido** (Más veloz, pero exige más disciplina) |
| 3 | Tu experiencia entrenando | Ajustamos series, repeticiones y volumen a tu nivel. | **Principiante** (Menos de 6 meses con constancia) · **Intermedio** (6 meses a 2 años) · **Avanzado** (Más de 2 años con progresión constante) |
| 4 | ¿Dónde y cuánto entrenas? | En casa y en gimnasio los ejercicios son distintos. | **Gimnasio** (Barras, mancuernas, poleas y máquinas) · **Casa** (Peso corporal, mochila y botellas) · Días por semana: 3, 4, 5, 6 |
| 5 | ¿Qué tan activo eres fuera del gym? | Sin contar tu entrenamiento. Es lo que más cambia tus calorías diarias. | **Poco activo** (Trabajo sentado y caminas poco) · **Activo** (Estás de pie o caminas bastante) · **Muy activo** (Trabajo físico o mucho movimiento) |
| 6 | Alergias e intolerancias | Nunca te mostraremos alimentos con estos ingredientes. | Maní, Mariscos, Lácteos, Gluten, Huevo, Soya, Frutos secos, Pescado |
| 7 | Alimentos que prefieres evitar | Por gusto, religión o tipo de dieta. Elige solo lo que aplique. | Cerdo, Res, Pollo, Vegetariano, Vegano, Hongos, Brócoli, Cebolla |
| 8 | ¿Cuántas comidas haces al día? | Repartimos tus calorías y tu proteína entre ellas. | **3** (Desayuno, almuerzo y cena) · **4** (Incluye un snack, recomendado) · **5** (Dos colaciones, ideal si te cuesta comer mucho) |
| 9 | Resumen "Tu plan está listo" | Calculado con tus datos; podrás ajustarlo. | Kcal, mantenimiento, kg/semana estimados, macros, lugar/días/nivel, exclusiones |

**Validaciones** (`packages/core/src/onboarding.ts`): edad 14–80, peso 35–250 kg, altura 130–220 cm. **Si edad < 18:** ocultar "Perder grasa" y "Rápido", y mostrar: "A tu edad lo mejor es comer bien y entrenar con técnica; consulta con un profesional de salud".

### 5.3 Hoy
Tira semanal · tarjeta principal (anillo de calorías restantes, meta, consumidas, mantenimiento, 3 barras de macros) · coach (sugerencia según lo que falta) · "Siguiente comida" con receta y botón *Registrar* · comidas del día con botón ＋ · agua (8 vasos de 250 ml).

### 5.4 Plan
Resumen de cobertura del plan vs metas · exclusiones activas · botón **Lista de compras (7 días)** · una tarjeta por comida con: tipo, nombre de la **receta**, chips de ingredientes con gramos, macros, **preparación** en una línea, botones *↻ Cambiar* y *Registrar* (alterna a "✓ Registrado").

### 5.5 Escáner — **consultar antes de comer** (pantalla clave)
1. Botón central de cámara abre el modal. Modos: *Plato* · *Código de barras* · *Buscar*.
2. Foto → animación de escaneo → hoja con los alimentos detectados y gramos ajustables (− / + de 25 g, quitar al llegar a 0).
3. La hoja muestra el **impacto en tu día** (calorías, proteína y carbos del día con esto) y un **veredicto**:
   - ✅ Encaja bien con tu día
   - 🎯 Muy alto en proteína, bueno para tu objetivo
   - 🟠 Ocupa casi todas las calorías que te quedan
   - ⚠️ Te pasarías de tu meta
4. Dos botones: **Solo consultar, no lo comeré** (no guarda nada) y **Lo voy a comer · registrar en [comida]**.
5. Aviso permanente: las fotos son aproximadas (±20–30 %); ajusta los gramos.

### 5.6 Entreno
Tira semanal con puntos en días de entreno · tarjeta de la sesión (nombre, nº de ejercicios, lugar, nivel, barra de progreso) · por ejercicio: músculo, series × repeticiones, descanso, botones de serie · **temporizador de descanso** flotante con +15 s y Saltar · *Terminar entreno* (suma racha). Día sin entreno: tarjeta de descanso activo.

### 5.7 Aprende (para quien no sabe de nutrición)
Acordeones animados, con los **números del usuario** insertados:
1. Cómo funciona ganar músculo (entrenar con progresión, comer suficiente, descansar).
2. Calorías y macros: qué significa cada uno (con sus metas en gramos y kcal por gramo 4/4/9).
3. Qué comer para ganar masa (listas calculadas desde la base: mejores proteínas por kcal, carbohidratos, grasas; filtradas por sus alergias).
4. Cuándo y cómo repartir tu comida (proteína por comida = meta ÷ nº de comidas; antes y después de entrenar).
5. Cómo usar el escáner antes de comer.
6. Preguntas frecuentes (¿pesar todo?, ¿si no llego a mis calorías?, ¿cuánto tardaré?) y aviso: *"orientativo, no reemplaza a un nutricionista ni a un médico"*.

### 5.8 Perfil (avatar del encabezado)
Gráfico de calorías de 7 días, resumen del plan, *Editar mis datos* (reabre el onboarding y recalcula todo).

---

## 6. Motor nutricional

Tipos en `packages/core/src/types.ts` (`Sex`, `Goal`, `Pace`, `Activity`, `Level`, `Where`, `SlotType`, `Profile`, `Targets`, `Food`, `Item`, `Recipe`, `Meal`).

`packages/core/src/nutrition.ts`: **Mifflin-St Jeor × actividad** (low 1.4 · active 1.55 · very_active 1.7), ajustado por objetivo (ganar +250 × ritmo · perder −300 × ritmo · mantener 0; ritmo slow 1 · moderate 1.6 · fast 2.2), piso 1500 kcal hombre / 1200 mujer, redondeo a 10 kcal. Proteína: 2.2 g/kg al perder, 2 al ganar, 1.8 al mantener. Grasa: máx(0.9 g/kg, 20 % kcal). Carbohidratos: el resto. `weeklyKg = (kcal − tdee) × 7 / 7700`.

`totals(items, foods)` suma kcal/p/c/f de una lista de ingredientes.

**Reglas de seguridad del motor:** piso 1500/1200 kcal; menores de 18 sin déficit; no mostrar rachas ni mensajes que culpen por comer de más; el coach nunca recomienda saltarse comidas.

---

## 7. Generador de plan de comidas (con recetas)

**Idea:** no se combinan alimentos sueltos; se eligen **recetas reales** y se **escalan sus porciones** a la meta de cada comida.

Reparto por número de comidas (`splits.ts`): 3 → D .28 / A .40 / C .32 · 4 → D .26 / A .36 / S .10 / C .28 · 5 → D .22 / S .10 / A .32 / S .10 / C .26.

Algoritmo por comida (`meals.ts`, `buildDays` / `buildPlan`); el menú cambia cada día:
1. Filtrar recetas cuyo `slots` incluya el tipo de comida **y** cuyos ingredientes no estén vetados (alérgenos + evitados, vía `TAGS` → `bannedTags`).
2. Escalar: `factor = clamp(kcalMeta / kcalBase, 0.55, 1.9)`; gramos redondeados a 5 g. Ordenar por la distancia tras escalar: error relativo de kcal + error relativo de proteína frente a la meta de esa comida.
3. Rotación semanal (lunes a domingo, `dayNumber`): cada comida recorre sus 20 mejores recetas en un orden barajado propio de esa semana (determinista), sin repetir receta en la semana ni en el día mientras haya opciones, y solo acepta la que deja el día en proteína ±8 % y kcal entre −5 % y +40 kcal (por encima, un día sin registros ya pediría compensar). Si ninguna cumple, la que más se acerca.
4. El botón *Cambiar* (↻) solo vale el día en que se pulsa (`variants` + `variantsDay`): avanza esa comida a la siguiente receta mejor ajustada sin tocar las demás.
5. Si no hay ninguna receta permitida, usar el generador de respaldo por roles (proteína + carbohidrato + verdura + grasa, con porciones calculadas).

`shoppingList(días, foods)` (`shopping.ts` + `data/market.ts`): suma los menús reales de los próximos 7 días, por sección del mercado; unidades para lo que se compra por pieza (las variantes de huevo se suman como huevos), ml/L para líquidos y peso seco para granos y menestras. Pantalla `compras.tsx` con casillas de "comprado" que valen una semana.

**Verificación con el catálogo de contenido (133 recetas)** para el perfil de prueba (hombre, 25 años, 70 kg, 175 cm, ganar masa, 4 comidas):
- Meta: 2 990 kcal y 140 g de proteína. El plan da 3 022 kcal y 140 g.
- Con "Vegano", o con gluten y lácteos vetados, todas las comidas siguen con recetas distintas (sin respaldo).
- Platos preparados, dulces y bebidas (rol `M`) no entran en recetas ni en el respaldo por roles.

---

## 8. Generador de rutinas

- **Split por días:** 3 → Cuerpo completo ×3 · 4 → Superior/Inferior ×2 · 5 → Empuje/Tirón/Pierna/Superior/Inferior · 6 → Empuje/Tirón/Pierna ×2.
- **Días de la semana:** 3 → L‑X‑V · 4 → L‑M‑J‑V · 5 → L‑M‑X‑V‑S · 6 → L a S.
- **Ejercicios por sesión:** 6, elegidos por músculo desde el catálogo de **gimnasio o casa**, sin repetir y rotando según la ocurrencia de la sesión.
- **Series:** principiante 3 · intermedio 4 en compuestos y 3 en accesorios · avanzado 5 y 4.
- **Repeticiones:** ganar → compuestos 6–8, accesorios 10–12 · perder → 10–12 / 12–15 · mantener → 8–10 / 10–12.
- **Descanso:** compuestos 120 s, accesorios 75 s. Los 2 primeros ejercicios de la sesión son compuestos.

Implementado en `packages/core/src/workouts.ts` (`TRAIN_DAYS`, `SPLIT`, `buildSession`, `sessionForWeekday`).

---

## 9. Escáner con IA

### 9.1 Flujo
```
Cámara → foto comprimida (≤ 1024 px, JPEG 0.7, base64)
  → Edge Function `scan-food` (valida JWT, limita 30 escaneos/día/usuario)
     → proveedor de visión (Groq o Gemini) devuelve SOLO { items: [{ name, grams, confidence }] }
  → app empareja cada `name` con la base local (`matchFood` en `scan.ts`) y toma kcal/macros de ahí
  → hoja de resultado editable → veredicto → consultar o registrar
```
Si un alimento no se encuentra en la base, se marca "No está en la base" y el usuario elige el alimento con el buscador; no se registra hasta elegirlo.

### 9.2 Prompt del sistema
Ver `supabase/functions/scan-food/index.ts` (constante `SYSTEM`).

### 9.3 Edge Function
`supabase/functions/scan-food/index.ts` (Deno). Variables (`supabase secrets set`): `VISION_BASE_URL`, `VISION_MODEL` (modelo con visión **vigente**), `VISION_API_KEY`.

### 9.4 Emparejado con la base
`matchFood(foods, name)` en `packages/core/src/scan.ts`, en la app y sin red: quita artículos, preposiciones y formas de cocción, reduce plurales a su raíz y puntúa por palabras compartidas. Devuelve `null` si el puntaje es menor que 0.75.

### 9.5 Veredicto antes de comer
`packages/core/src/scan.ts` → `verdict(item, eaten, targets, goal)` devuelve `over` (> 105 % de la meta), `protein` (ganar: ≥ 25 % kcal de proteína; perder: ≥ 30 %), `tight` (> 80 % de lo que queda) u `ok`.

### 9.6 Código de barras
`expo-camera` (`onBarcodeScanned`) → `GET https://world.openfoodfacts.org/api/v2/product/{codigo}.json` → mapear `nutriments` (`energy-kcal_100g`, `proteins_100g`, `carbohydrates_100g`, `fat_100g`) → guardar en `foods` con `source='off'` como caché. Mostrar la atribución a Open Food Facts en Ajustes → Acerca de.

### 9.7 Coach (reglas, sin IA) — `coachMessage` en `scan.ts`
- Sin registros: "Empieza registrando tu primera comida".
- Más de 100 kcal sobre la meta: sugerir proteína y verduras en la siguiente comida (sin culpa).
- Faltan > 25 g de proteína: alimento permitido con mejor proteína/kcal y los **gramos exactos** que cubren lo que falta.
- Menos de 150 kcal restantes: "Día casi completo".
- En otro caso: calorías restantes.

---

## 10. Base de datos (Supabase)

`supabase/migrations/0001_init.sql`: `profiles`, `foods` (índice `gin_trgm_ops` en `name_es`), `recipes`, `recipe_items`, `meal_logs`, `meal_log_items`, `workout_sets`, `water_logs`, `weight_logs`, `scan_usage`. RLS: cada usuario solo ve y edita lo suyo; `foods`, `recipes` y `recipe_items` son de lectura pública; `scan_usage` sin política (solo service role).

**Offline‑first:** el motor (`packages/core`) corre en el teléfono; el catálogo de alimentos/recetas se descarga una vez y se cachea. El registro se guarda localmente y se sincroniza al haber red.

---

## 11. Datos semilla

- **Alimentos** (por 100 g): `packages/core/src/data/foods.ts` y `supabase/seed/foods_pe.csv` (31 alimentos). Ampliar con CENAN/USDA (meta: 300+ alimentos, incluidos platos peruanos). Valores de referencia redondeados; al importar CENAN/USDA reemplázalos por los oficiales y guarda `source`.
- **Recetas** (porciones base): `packages/core/src/data/recipes.ts` (23 recetas). **Meta de contenido:** 120+ recetas (≥ 25 por tipo de comida), incluyendo platos peruanos. Genera el catálogo una sola vez con una IA gratuita, valida que cada `foodId` exista, recalcula macros desde la base y revisa a mano antes de publicar.
- **Ejercicios**: `packages/core/src/data/exercises.ts` (catálogo corto por músculo, gym/home). Fase posterior: `free-exercise-db` filtrando por `equipment`.

---

## 12. Contenido de "Aprende"
Los textos están en el prototipo (acordeones 1–6 de la sección 5.7). Reglas de redacción: frases cortas, sin jerga, siempre con **los números del usuario**; evitar promesas de resultados y cifras absolutas; incluir el aviso orientativo al final.

---

## 13. Monetización (después del MVP)

- **Un solo anuncio al abrir la app**, con `react-native-google-mobile-ads` (AdMob), formato **App Open**. Requiere *development build*.
- **No puede ser un anuncio largo sin opción de cerrar.** Las políticas de Google Play exigen anuncios fáciles de cerrar. Si quieres algo más largo, usa un **anuncio opcional con recompensa**.
- Reglas: máximo 1 al abrir, nunca durante el registro ni el escáner, intervalo mínimo de 4 horas.
- Pedir el consentimiento correspondiente con la UMP SDK cuando aplique.

---

## 14. Seguridad, privacidad y legal

- Los datos de peso, medidas y hábitos de salud son **sensibles**: cifrado en tránsito, RLS en todas las tablas, borrar cuenta y datos desde Ajustes.
- Política de privacidad pública y enlace dentro de la app. Revisa la Ley N.º 29733 (Perú) para el consentimiento y el tratamiento.
- Atribución de Open Food Facts y de las demás fuentes en "Acerca de".
- La app es **informativa**: no diagnostica ni trata. Aviso visible en onboarding y Aprende.
- Menores de 18: sin déficit calórico ni ritmo rápido.
- No mostrar mensajes de culpa ni objetivos extremos; ofrecer ayuda profesional si el usuario muestra patrones de riesgo.
- Clave de IA solo en la Edge Function; límite diario por usuario; nunca enviar el nombre del usuario al proveedor de IA.

---

## 15. Roadmap por fases

| Fase | Entregable | Aceptación |
|---|---|---|
| **F0** Setup | Monorepo pnpm, Expo, Supabase local, ESLint/Prettier, CI con tests | `pnpm -w test` y `pnpm --filter mobile start` funcionan |
| **F1** Core | `packages/core`: nutrición, plan, rutinas, veredicto + datos semilla | Tests de la sección 17 en verde |
| **F2** Onboarding + Hoy + Plan | Pantallas 5.1–5.4 con animaciones y tema | Calcula metas reales, respeta alergias, cambia de receta |
| **F3** Registro | Búsqueda, ＋ por comida, código de barras, agua | El anillo y las barras reflejan el registro; persiste y sincroniza |
| **F4** Escáner IA | Edge Function, cámara, hoja con veredicto, "Solo consultar" | Foto → alimentos con gramos editables → macros desde la base |
| **F5** Entreno | Split, series, temporizador de descanso, racha | Casa y gimnasio cambian los ejercicios; el descanso funciona en segundo plano |
| **F6** Aprende + Perfil + Lista de compras | Acordeones con números del usuario | Todo el contenido personalizado |
| **F7** Pulido | Animaciones finas, hápticos, accesibilidad, offline, errores | Sin pantallas vacías ni estados sin manejar |
| **F8** Beta | Build interno, prueba con 10 personas, Play Console | Feedback incorporado; ficha de tienda lista |

**Prompt por fase (ejemplo F2):**
```
Implementa F2 según docs/SPEC.md secciones 4 y 5.1–5.4: tema claro/oscuro con los tokens de theme.ts, onboarding de 9 pasos con
las preguntas exactas, validaciones, pantallas Hoy y Plan con las animaciones de la sección 4. Usa packages/core para toda la lógica.
Referencia visual: https://claude.ai/artifact/RHNQ4q61N6DzoHbuKSCr2e
```

---

## 16. Qué más para igualar o superar a Fitia (por prioridad)

1. **Catálogo peruano grande** (CENAN) + recetas con pasos y fotos.
2. **Consultar antes de comer** como función estrella; añade **escáner de etiqueta** y **código de barras** de productos peruanos.
3. **Ajuste adaptativo semanal:** compara el peso real con el esperado y sube o baja ~100–150 kcal; explica el porqué.
4. **Progreso completo:** peso, medidas y fotos con comparador antes/después.
5. **Sustitución inteligente:** "no tengo pollo" → alternativas con macros equivalentes.
6. **Recordatorios útiles** (hora de comer, agua, entreno) y racha amable, sin culpa.
7. **Lista de compras** exportable y planificación semanal.
8. **Modo offline** real y registro rápido de "comidas frecuentes".
9. **Health Connect / Apple Health:** pasos y peso automáticos.
10. **Ejercicios con video o modelo 3D**, solo después de lo anterior.

---

## 17. Pruebas obligatorias

`packages/core/src/__tests__/core.test.ts` (Vitest): nutrición (2 990 kcal / 2 594 tdee / 140 g proteína; piso 1200; macros ≈ kcal), plan (sin vetados; vegano; ±12 % kcal; variante cambia receta), rutinas (casa ≠ gym; 6 sin repetir; 5 días distintos), veredicto (over; protein).

> Si un test falla por valores de redondeo, ajusta el rango del test **solo si** la fórmula de la sección 6 sigue intacta.

---

## 18. Variables de entorno

`apps/mobile/.env` (ver `.env.example`): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

`supabase secrets set`: `VISION_BASE_URL`, `VISION_MODEL`, `VISION_API_KEY`.

---

## 19. Definición de "terminado" para v1.0

- Onboarding completo con validaciones y explicación de cada pregunta.
- Plan diario con recetas, alérgenos respetados, cambio de receta y lista de compras.
- Escáner de plato y de código de barras con **veredicto antes de comer** y opción "Solo consultar".
- Entreno para casa y gimnasio con temporizador de descanso.
- Sección Aprende personalizada.
- Tema claro/oscuro, animaciones de la sección 4, offline básico.
- Pruebas del core en verde, política de privacidad publicada, build firmado para Google Play.
