# FitCoach — Ficha de Google Play y beta

Todo lo que pide Play Console para publicar, listo para copiar. Los límites de caracteres están verificados.

---

## 1. Ficha principal

**Nombre de la app** (máx. 30):

```
FitCoach: Dieta y Gimnasio
```

**Descripción breve** (máx. 80):

```
Menú con platos peruanos, escáner de platos y rutinas de gym o casa. Gratis.
```

**Descripción completa** (máx. 4000):

```
FitCoach es tu entrenador y nutricionista en el bolsillo, gratis. Te arma un plan de comidas con platos peruanos y una rutina para el gimnasio o para tu casa, y te ayuda a cumplirlos día a día.

TU PLAN, CALCULADO PARA TI
Responde unas preguntas (edad, peso, altura, objetivo, actividad y experiencia) y FitCoach calcula tus calorías y tu proteína, carbohidratos y grasas. Sirve para ganar masa muscular, perder grasa o mantener tu peso. Cada semana compara tu peso real con el esperado y te propone un ajuste pequeño de calorías, explicándote el motivo.

MENÚ CON COMIDA DE AQUÍ
• Más de 130 recetas, con platos peruanos y opciones veganas y sin gluten.
• Respeta tus alergias y los alimentos que no comes.
• Cambia cualquier receta por otra con un toque; las porciones se ajustan a tus metas.
• Lista de compras para la semana.

CONSULTA ANTES DE COMER
• Toma una foto de tu plato: FitCoach reconoce los alimentos, estima los gramos y te dice si encaja con tu día antes de que lo comas. Puedes solo consultar sin registrar nada.
• Lee el código de barras de productos envasados.
• Busca entre más de 300 alimentos, incluidos platos típicos como lomo saltado, ají de gallina o causa.
• Tus comidas frecuentes siempre a mano.

ENTRENA CON GUÍA
• Programa por semanas según tu objetivo, tu nivel, tus días disponibles y si entrenas en el gimnasio o en casa.
• Entreno guiado: preparación, serie y descanso, con indicaciones por voz, vibración y aviso aunque salgas de la app.
• Registra peso y repeticiones de cada serie; FitCoach te propone la siguiente meta.
• Récords personales, volumen semanal y mapa de los músculos que trabajaste.
• Animaciones 3D de los ejercicios en casa y fotos de cada ejercicio.
• ¿Máquina ocupada? Cámbiala por un ejercicio equivalente.

MIRA TU PROGRESO
• Peso con tendencia y proyección.
• Medidas corporales y fotos de progreso con comparador. Las fotos se quedan en tu teléfono.
• Racha de entrenos y logros.
• Recordatorios de comidas, agua, entreno y pesaje.

APRENDE SIN JERGA
Una guía con tus propios números: qué son las calorías y los macros, qué comer para tu objetivo, cómo repartir tu comida y cómo usar el escáner.

PRIVACIDAD
No necesitas correo ni contraseña. No vendemos tus datos ni mostramos publicidad. Puedes borrar tu cuenta y tus datos desde la app.

FitCoach es informativa: no reemplaza a un nutricionista ni a un médico. Las estimaciones de calorías, y en especial las de las fotos, son aproximadas.

Datos de productos: Open Food Facts (ODbL). Imágenes de ejercicios: free-exercise-db.
```

**Categoría:** Salud y bienestar (Health & Fitness).
**Etiquetas sugeridas:** Nutrición, Fitness, Seguimiento de dieta, Entrenamiento.
**Correo de contacto** (obligatorio y público en la ficha): [CORREO DE CONTACTO].
**Política de privacidad:** https://github.com/FernandoJose25/fitcoach/blob/main/docs/privacy-policy.md

### Recursos gráficos

| Recurso | Formato | Estado |
|---|---|---|
| Ícono | PNG 512 × 512, 32 bits | Exportar desde `apps/mobile/assets/icon.png` |
| Gráfico de funciones | PNG o JPG 1024 × 500, sin transparencia | Por hacer |
| Capturas de teléfono | Mínimo 2, máximo 8. Usa 1080 × 1920 (Play no acepta un lado más del doble que el otro, así que las capturas de 1080 × 2400 del emulador hay que recortarlas) | Por hacer |

Capturas recomendadas (en este orden, tema oscuro, con datos de ejemplo realistas):
1. Hoy: anillo de calorías, macros y coach.
2. Menú: receta peruana con porciones.
3. Escáner de plato con el veredicto "Encaja bien con tu día".
4. Entreno guiado durante una serie, con la animación 3D.
5. Entreno: programa de la semana y mapa muscular.
6. Progreso: gráfico de peso con proyección.
7. Aprende con los números del usuario.

---

## 2. Contenido de la app (Play Console → Política → Contenido de la app)

### Seguridad de los datos (Data safety)

| Pregunta | Respuesta |
|---|---|
| ¿Tu app recopila o comparte alguno de los tipos de datos de usuario requeridos? | Sí |
| ¿Todos los datos se encriptan en tránsito? | Sí |
| ¿Ofreces una forma de que los usuarios soliciten la eliminación de sus datos? | Sí (en la app, Perfil, y por correo) |
| URL para solicitar la eliminación de la cuenta | La política de privacidad, sección 7 |

Tipos de datos **recopilados** (ninguno se **comparte** con terceros: Supabase y Groq son proveedores que procesan los datos por cuenta de la app, y eso no cuenta como compartir):

| Categoría Play | Tipo | Recopilado | Efímero | ¿Obligatorio? | Propósito |
|---|---|---|---|---|---|
| Información personal | Nombre | Sí | No | Obligatorio | Funcionalidad de la app, Personalización |
| Información personal | ID de usuario (id anónimo de Supabase) | Sí | No | Obligatorio | Funcionalidad de la app, Administración de la cuenta |
| Información personal | Otra información (edad, sexo) | Sí | No | Obligatorio | Funcionalidad de la app, Personalización |
| Salud y fitness | Información de salud (peso e historial de peso, altura, alergias, comidas registradas) | Sí | No | Obligatorio | Funcionalidad de la app, Personalización |
| Salud y fitness | Información de fitness (series, pesos levantados, días de entreno) | Sí | No | Opcional | Funcionalidad de la app |
| Fotos y videos | Fotos (foto del plato que se escanea) | Sí | **Sí** (se procesa y no se guarda) | Opcional | Funcionalidad de la app |

**No** recopilados (se quedan en el teléfono): medidas corporales, fotos de progreso y preferencias. Tampoco se recopilan ubicación, contactos, mensajes, archivos, identificadores de publicidad ni datos de pago.

> Si más adelante se sincronizan las medidas o las fotos, o se agrega AdMob, actualiza esta tabla y la política de privacidad **antes** de publicar esa versión.

### Clasificación de contenido (cuestionario IARC)

- Categoría: **Todas las demás apps** (no es juego, ni red social, ni noticias).
- Violencia, sexualidad, lenguaje soez, drogas, apuestas o juegos de azar: **No** a todo.
- ¿Los usuarios pueden interactuar o intercambiar contenido entre sí? **No**.
- ¿Comparte la ubicación del usuario con otros? **No**.
- ¿Permite compras digitales? **No**.
- ¿Es un navegador web o motor de búsqueda? **No**.
- Resultado esperado: **Para todos / PEGI 3 / ESRB Everyone**.

### Otros formularios

- **Público objetivo:** 13 a 15, 16 a 17 y 18 o más (la app pide 14 años como mínimo y no tiene ninguna sección dirigida a niños). No marcar menores de 13: eso activaría la política de Familias.
- **Anuncios:** No contiene anuncios.
- **Acceso a la app:** todas las funciones están disponibles sin credenciales (sesión anónima). En "instrucciones para revisión" indica: "No requiere inicio de sesión. Completa el cuestionario inicial con cualquier dato."
- **Apps de salud:** declarar que es una app de **nutrición y fitness, no un dispositivo médico**, y que no usa Health Connect.
- **Permiso de alarmas exactas** (`SCHEDULE_EXACT_ALARM`): lo usa el temporizador de descanso del entreno guiado. Es un permiso que concede el usuario; si Play pide justificarlo, el motivo es: "Avisa el fin del descanso entre series en el momento exacto cuando la app está en segundo plano".
- **App gubernamental / financiera / VPN:** No.

---

## 3. Builds

```bash
cd apps/mobile
# APK para probar con un enlace (perfil preview, distribución interna)
eas build -p android --profile preview
# AAB para Play (perfil production)
eas build -p android --profile production
```

- El proyecto EAS es `@ferrrrr23/fitcoach`. Las variables `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` ya están en los entornos `preview` y `production` de EAS.
- Antes de cada build para Play, sube `android.versionCode` en `app.config.ts` (EAS no lo autoincrementa con config dinámica). Si cambias `version`, cambia también la de la ficha.
- El APK `preview` y el AAB de Play usan firmas distintas: quien tenga el APK instalado debe desinstalarlo antes de instalar la versión de Play (pierde sus datos: con la cuenta anónima no se recuperan al reinstalar).
- Firma de Play: deja que EAS genere el keystore de subida en el primer build y activa **Play App Signing** al subir el primer AAB. Guarda una copia del keystore (`eas credentials`): si algún día se usa la otra cuenta Expo, debe ser el mismo.

---

## 4. Beta con 10 personas

**Importante:** las cuentas de desarrollador **personales** creadas después de noviembre de 2023 no pueden pasar a producción sin antes hacer una **prueba cerrada con al menos 12 testers que se mantengan inscritos 14 días seguidos**. La prueba interna no cuenta. Si tu cuenta es personal, invita a 12 o más personas (lo ideal son 15, por si alguien se sale).

### Paso a paso

1. **Antes de invitar**, prueba tú mismo el APK `preview` en un teléfono real: registro por código de barras, foto de plato, entreno guiado con la pantalla apagada y borrar cuenta desde Perfil.
2. **Play Console → Crear app**: nombre, idioma español (Latinoamérica), app gratuita, aceptar las declaraciones.
3. Completa **Contenido de la app** (sección 2) y la **ficha** (sección 1).
4. **Pruebas → Prueba cerrada → Crear pista**: país Perú (y los que quieras), lista de testers con sus correos de Google.
5. Sube el primer AAB **a mano** desde Play Console (Google exige que la primera subida sea manual; las siguientes pueden hacerse con `eas submit`, que necesita una clave JSON de cuenta de servicio de Google Cloud).
6. Envía la versión a revisión. Cuando la aprueben, comparte el **enlace de inscripción**: cada tester lo abre con su cuenta de Google, acepta y descarga desde Play.
7. Durante los 14 días, pide a cada tester que use la app al menos 3 días y que responda este formulario corto:
   - ¿Qué tan fácil fue el cuestionario inicial? (1 a 5)
   - ¿El menú tenía comidas que sí comerías? ¿Qué cambiarías?
   - ¿El escáner de platos acertó con los alimentos? Comparte una foto en la que haya fallado.
   - ¿Usaste el entreno guiado? ¿Algo confuso?
   - ¿La app se cerró sola o se quedó trabada? ¿Dónde?
   - Lo que más te gustó y lo que quitarías.
8. Revisa los fallos en Play Console → **Calidad → Android vitals** (bloqueos y ANR) y corrige antes de pedir acceso a producción.
9. Al terminar los 14 días: **Panel → Solicitar acceso a producción** y responde el cuestionario sobre la prueba.

### Si solo quieres probar sin Play

Comparte el enlace del build `preview` (APK) que da EAS. No necesita Play Console, pero no cuenta para el requisito de 12 testers durante 14 días.
