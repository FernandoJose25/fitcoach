# Animaciones con movimiento real para FitCoach (Mixamo y HY-Motion)

Lo que Mixamo no tiene se genera gratis con HY-Motion: ver [la última sección](#hy-motion-ia-gratis-de-texto-a-movimiento).

Aquí van los FBX que descargas de [mixamo.com](https://www.mixamo.com). No hace falta renombrarlos: deja el nombre con el que
Mixamo los baja (p. ej. `Air Squat.fbx`). Esta carpeta no se sube a GitHub (ver `.gitignore`); guarda una copia en tu Drive.

## Cómo descargar cada una

1. Busca en **Animations** con **una sola palabra** (`push`, `pull`, `curl`…): Mixamo busca la frase exacta y con dos palabras casi nunca encuentra nada.
2. Si aparecen varias, elige la que más se parezca al ejercicio. Puedes bajar más de una (p. ej. `Air Squat` y `Air Squat Bent Arms`).
3. **Download** con: Format **FBX Binary (.fbx)** · Skin **Without Skin** · Frames per Second **30** · Keyframe Reduction **none**.
   Los controles del panel (Overdrive, Arm-Space, Trim) se dejan como vienen.
4. Si no aparece nada parecido, márcalo como "no está" y sigue: esos ejercicios se quedan con la animación actual.

Una descarga cubre todas las variantes del mismo movimiento: la barra, las mancuernas, el banco o la silla los pone el
script de Blender, y las variantes (abiertas, diamante, inclinadas…) se ajustan desde la animación base.

## Prueba (primero estas 3)

| Buscar en Mixamo | Cubre en la app | ¿Está? |
|---|---|---|
| Air Squat | Sentadilla libre, con mochila, con barra, frontal | ✓ (y "Air Squat Bent Arms") |
| Push Up | Las 7 flexiones, flexiones en pica, pike push-ups | ✓ |
| Pull Up | Dominadas, dominadas supinas | |

## Resto del catálogo

| Buscar en Mixamo | Cubre en la app | ¿Está? |
|---|---|---|
| Jump Squat | Sentadilla con salto | |
| Lunge | Zancadas, zancada hacia atrás, sentadilla búlgara, zancadas con mancuernas | |
| Step Up | Subidas a una silla | |
| Calf Raise | Elevación de talones (de pie, con mancuernas) | |
| Glute Bridge | Puente de glúteo, a una pierna, hip thrust con barra | no está |
| Deadlift | Peso muerto rumano | |
| Bent Over Row | Remo con barra, con mochila, a una mano, remo en T | |
| Bench Press | Press banca, inclinado, con mancuernas, agarre cerrado | |
| Shoulder Press | Press militar, press con botellas, sentado, Arnold | |
| Lateral Raise | Elevaciones laterales (botellas, mancuernas, polea) | |
| Front Raise | Elevaciones frontales (botellas, mancuernas) | |
| Bicep Curl | Todos los curls de pie (barra, botellas, mochila, martillo, inverso, polea, toalla) | ✓ (un solo brazo) |
| Tricep Extension | Extensión con mochila, con toalla, sobre la cabeza con cuerda | |
| Tricep Kickback | Patada de tríceps (botella, mancuerna) | |
| Dips | Fondos en silla, fondos en paralelas, fondos para pecho | |
| Superman | Superman, extensión lumbar en el suelo | |
| Plank | Plancha | ✓ (plancha alta, sobre las manos) |
| Side Plank | Plancha lateral | |
| Crunch | Crunch, crunch inverso, crunch en polea, crunch en máquina | |
| Sit Up | (respaldo de Crunch si no aparece) | |
| Bicycle Crunch | Bicicleta abdominal | |
| Russian Twist | Giros rusos | |
| Leg Raise | Elevación de piernas (suelo y colgado) | |
| Dead Bug | Bicho muerto | |

## No buscar en Mixamo

Ejercicios en máquina o polea que Mixamo no tiene: prensa de piernas, curl femoral, extensión de cuádriceps, jalón al
pecho, contractora, remo en polea, face pull, pullover en polea, curl predicador, rueda abdominal, pallof press y
leñador en polea. Para estos: pack pagado de gimnasio o video a 3D (se decide después de la prueba).

## HY-Motion: IA gratis de texto a movimiento

Demo de Tencent en Hugging Face: <https://huggingface.co/spaces/tencent/HY-Motion-1.0>. **No se instala nada**: funciona
en el navegador con la GPU de Hugging Face (correrla en esta PC no sirve: pide una NVIDIA de ~24 GB y la tarjeta es AMD).
Entra con una cuenta gratis de Hugging Face: sin cuenta el cupo diario de GPU es más chico.

1. Pega la frase de la tabla en **📝 Input Text**.
2. Si aparece **🔄 Rewrite Text**, púlsalo (hasta entonces Generate está desactivado). Revisa **✏️ Rewritten Text**: si cambió
   el movimiento, bórralo y pega la frase original.
3. Pon **⏱️ Action Duration** en los segundos de la tabla (el Rewrite la cambia sola).
4. Pulsa **🚀 Generate Motion**. Salen 4 versiones del mismo ejercicio.
5. Mira las 4 a la derecha y elige la más natural. En **📦 Download FBX Files** baja solo el `.fbx` de esa: los archivos
   terminan en `_000`, `_001`, `_002`, `_003`, en el orden de las versiones. Los `.txt` no hacen falta.
6. Renómbralo como dice la columna **Archivo** y déjalo en esta carpeta.
7. Si ninguna sirve, abre **🔧 Advanced Settings**, pulsa 🎲 (otras semillas) y genera de nuevo.

Si sale un error de cuota de GPU es el límite diario gratis: se sigue al día siguiente. Cada frase describe una sola
repetición que empieza y termina en la misma postura, porque el render usa el clip entero y toma el medio como pico.
Estos FBX traen el esqueleto SMPL-H, no el de Mixamo: `mocap.py` se adapta con el primero que llegue.
Licencia (Tencent HY-Motion Community): uso comercial gratis hasta 1 millón de usuarios activos al mes.

| Archivo | Frase (pegar tal cual) | Seg. |
|---|---|---|
| HY Air Squat.fbx | A man stands with feet shoulder-width apart and arms forward, squats down until the thighs are parallel to the floor, then stands back up to the starting position. | 3 |
| HY Push Up.fbx | A man in a push-up position on the hands and toes with the body straight lowers the chest close to the floor by bending the elbows, then pushes back up until the arms are straight. | 3 |
| HY Pull Up.fbx | A man hangs from an overhead bar with both hands and straight arms, pulls the body up until the chin passes the hands, then slowly lowers back down until the arms are straight. | 3.5 |
| HY Jump Squat.fbx | A man stands, squats down, jumps straight up explosively, lands softly on both feet and stands back up. | 3 |
| HY Lunge.fbx | A man stands with feet together, steps forward with the right leg and lowers the hips until both knees are bent at 90 degrees, then pushes back to standing with feet together. | 3.5 |
| HY Step Up.fbx | A man steps up onto a knee-high box with the right foot, stands up straight on top of it, then steps back down to the floor with both feet. | 4 |
| HY Calf Raise.fbx | A man stands upright with feet hip-width apart and arms at the sides, keeping the torso and hips still, slowly rises up onto the toes lifting the heels as high as possible, then lowers the heels back to the floor. | 2.5 |
| HY Glute Bridge.fbx | A man lies on the back with knees bent and feet flat on the floor, lifts the hips until the body forms a straight line from shoulders to knees, then lowers the hips back down. | 3 |
| HY Deadlift.fbx | A man stands with arms hanging in front of the thighs, hinges at the hips with a flat back and slightly bent knees, lowering the hands to mid-shin, then stands back up straight. | 3.5 |
| HY Bent Over Row.fbx | A man bent forward at the hips with a flat back and arms hanging straight down pulls both elbows back to bring the hands to the waist, then lowers the arms again. | 3 |
| HY Bench Press.fbx | A man lies face up on a flat bench with feet on the floor and both arms straight above the chest, lowers the hands to the chest by bending the elbows, then presses them back up. | 3 |
| HY Shoulder Press.fbx | A man stands upright with feet hip-width apart and fists at shoulder height, keeping the torso and hips still, presses both arms straight overhead, then lowers the fists back to the shoulders. | 3 |
| HY Lateral Raise.fbx | A man stands upright with feet hip-width apart and arms at the sides, keeping the torso and hips still, raises both straight arms out to the sides up to shoulder height, then slowly lowers them back down. | 3 |
| HY Front Raise.fbx | A man stands upright with feet hip-width apart and arms in front of the thighs, keeping the torso and hips still, raises both straight arms forward up to shoulder height, then slowly lowers them back down. | 3 |
| HY Bicep Curl.fbx | A man stands upright with feet hip-width apart, knees straight and torso still, elbows pinned to his sides and fists closed, then curls both fists up to his shoulders at the same time and slowly lowers them back down. | 3 |
| HY Tricep Extension.fbx | A man stands upright with feet hip-width apart, both hands together behind the head and elbows pointing up, keeping the torso and hips still, straightens both arms overhead, then lowers the hands behind the head again. | 3 |
| HY Tricep Kickback.fbx | A man bent forward at the hips with a flat back keeps the upper arms close to the body with elbows bent, straightens both forearms backward, then bends the elbows again. | 3 |
| HY Dips.fbx | A man sits on the edge of a chair with hands beside the hips, slides the hips forward off the edge, lowers the body by bending the elbows, then pushes back up until the arms are straight. | 3.5 |
| HY Superman.fbx | A man lies face down on the floor with arms stretched overhead, lifts the arms, chest and legs off the floor at the same time, holds for a moment, then lowers back down. | 3 |
| HY Plank.fbx | A man holds a forearm plank, resting on the forearms and toes with the body in a straight line from head to heels, staying still and breathing steadily. | 3 |
| HY Side Plank.fbx | A man holds a side plank on the right forearm with the feet stacked and the hips lifted so the body forms a straight line, the left hand resting on the hip. | 3 |
| HY Crunch.fbx | A man lies on the back with knees bent, feet flat on the floor and hands behind the head, curls the shoulders and upper back off the floor, then lowers back down. | 2.5 |
| HY Sit Up.fbx | A man lies on the back with knees bent and feet flat on the floor, sits all the way up until the chest is near the knees, then slowly lies back down. | 3 |
| HY Bicycle Crunch.fbx | A man lies on the back with hands behind the head and legs raised, brings the right elbow to the left knee while straightening the right leg, then switches and brings the left elbow to the right knee. | 3 |
| HY Russian Twist.fbx | A man sits on the floor leaning back slightly with knees bent, feet lifted and hands together in front of the chest, rotates the torso to touch the floor on the right side, then on the left side. | 3 |
| HY Leg Raise.fbx | A man lies on the back with legs straight and arms at the sides, raises both straight legs up to vertical, then slowly lowers them back down until they are just above the floor. | 3 |
| HY Dead Bug.fbx | A man lies on the back with arms pointing up and knees bent at 90 degrees above the hips, extends the right arm overhead and the left leg forward, returns, then repeats with the left arm and right leg. | 4 |

## En uso en la app (21 de noviembre de 2026)

Los HY se generaron con HY-Motion en la PC (CPU), 2 versiones por frase; se eligió una mirando los cuadros. `mocap.py`
recorta cada clip de HY a una repetición: bucle si el clip la completa, o ida y vuelta si solo hace media repetición.

| Ejercicio de la app | Archivo | Bucle |
|---|---|---|
| Sentadilla libre, Sentadilla con mochila | Air Squat.fbx (Mixamo) | el del clip |
| Flexiones | Push Up.fbx (Mixamo) | el del clip |
| Curl con botellas, Curl con mochila | HY Bicep Curl.fbx (frase anterior, "A person…") | repetición completa |
| Press con botellas | HY Shoulder Press.fbx | ida y vuelta, WebP a 40 fps |
| Elevaciones con botellas (laterales) | HY Lateral Raise.fbx | ida y vuelta, WebP a 40 fps |
| Extensión con mochila | HY Tricep Extension.fbx | ida y vuelta |
| Plancha | HY Plank.fbx | ida y vuelta (postura fija) |
| Elevación de piernas | HY Leg Raise.fbx | ida y vuelta |

Se descartaron y siguen con poses clave: dominadas (no sube), sentadilla con salto, zancadas, subidas a una silla y
fondos (no calzan con la silla), elevación de talones, puente de glúteo y superman (casi no se mueven), remo (dobla el
torso sin remar), elevaciones frontales (sube por encima de la cabeza echándose atrás), patada de tríceps (balancea
el brazo), plancha lateral, crunch (hace un abdominal completo), bicicleta, giros rusos y bicho muerto.

Volver a renderizar uno, desde la raíz del repo:

```
python .claude/skills/blender-core/scripts/run_in_blender.py --user-prefs apps/mobile/assets/anim/build_anim.py -- --out <frames> --only curl-botellas --mocap "apps/mobile/assets/anim/mocap/HY Bicep Curl.fbx" --size 480
python apps/mobile/assets/anim/assemble_webp.py <frames>/curl-botellas apps/mobile/assets/anim/curl-botellas.webp --fps 30
```
