/**
 * Catálogo de ejercicios por músculo y lugar. Cada entrada: [nombre, id en free-exercise-db].
 * Los primeros de cada lista son los compuestos principales; los nombres del catálogo v1 se
 * mantienen al inicio para conservar el historial y la rotación.
 * Imágenes: free-exercise-db (dominio público, github.com/yuhonas/free-exercise-db).
 */
type Entry = [string, string];

const CATALOG: Record<string, { gym: Entry[]; home: Entry[] }> = {
  pecho: {
    gym: [
      ['Press banca', 'Barbell_Bench_Press_-_Medium_Grip'],
      ['Press inclinado con mancuernas', 'Incline_Dumbbell_Press'],
      ['Aperturas en polea', 'Cable_Crossover'],
      ['Press inclinado con barra', 'Barbell_Incline_Bench_Press_-_Medium_Grip'],
      ['Press con mancuernas', 'Dumbbell_Bench_Press'],
      ['Press de pecho en máquina', 'Machine_Bench_Press'],
      ['Aperturas con mancuernas', 'Dumbbell_Flyes'],
      ['Fondos para pecho', 'Dips_-_Chest_Version'],
      ['Contractora (peck deck)', 'Butterfly'],
    ],
    home: [
      ['Flexiones', 'Pushups'],
      ['Flexiones con pies elevados', 'Push-Ups_With_Feet_Elevated'],
      ['Flexiones diamante', 'Push-Ups_-_Close_Triceps_Position'],
      ['Flexiones abiertas', 'Push-Up_Wide'],
      ['Flexiones inclinadas', 'Incline_Push-Up'],
      ['Flexiones explosivas', 'Plyo_Push-up'],
      ['Flexión con giro a plancha lateral', 'Push_Up_to_Side_Plank'],
    ],
  },
  espalda: {
    gym: [
      ['Jalón al pecho', 'Wide-Grip_Lat_Pulldown'],
      ['Remo con barra', 'Bent_Over_Barbell_Row'],
      ['Remo en polea baja', 'Seated_Cable_Rows'],
      ['Dominadas', 'Pullups'],
      ['Remo con mancuerna a una mano', 'One-Arm_Dumbbell_Row'],
      ['Remo en T', 'T-Bar_Row_with_Handle'],
      ['Jalón con agarre cerrado', 'Close-Grip_Front_Lat_Pulldown'],
      ['Pullover en polea alta', 'Straight-Arm_Pulldown'],
    ],
    home: [
      ['Remo invertido en mesa', 'Inverted_Row_with_Straps'],
      ['Remo con mochila', 'Bent_Over_Two-Dumbbell_Row'],
      ['Superman', 'Superman'],
      ['Remo a una mano con mochila', 'One-Arm_Dumbbell_Row'],
      ['Dominadas (si tienes barra)', 'Pullups'],
      ['Dominadas supinas (si tienes barra)', 'Chin-Up'],
      ['Extensión lumbar en el suelo', 'Hyperextensions_With_No_Hyperextension_Bench'],
    ],
  },
  pierna: {
    gym: [
      ['Sentadilla con barra', 'Barbell_Squat'],
      ['Prensa de piernas', 'Leg_Press'],
      ['Peso muerto rumano', 'Romanian_Deadlift'],
      ['Zancadas con mancuernas', 'Dumbbell_Lunges'],
      ['Sentadilla hack', 'Hack_Squat'],
      ['Hip thrust con barra', 'Barbell_Hip_Thrust'],
      ['Curl femoral tumbado', 'Lying_Leg_Curls'],
      ['Extensión de cuádriceps', 'Leg_Extensions'],
      ['Sentadilla frontal', 'Front_Barbell_Squat'],
      ['Elevación de talones de pie', 'Standing_Calf_Raises'],
    ],
    home: [
      ['Sentadilla búlgara', 'Split_Squat_with_Dumbbells'],
      ['Zancadas', 'Bodyweight_Walking_Lunge'],
      ['Puente de glúteo', 'Butt_Lift_Bridge'],
      ['Sentadilla con mochila', 'Dumbbell_Squat'],
      ['Sentadilla libre', 'Bodyweight_Squat'],
      ['Puente de glúteo a una pierna', 'Single_Leg_Glute_Bridge'],
      ['Subidas a una silla', 'Dumbbell_Step_Ups'],
      ['Sentadilla con salto', 'Freehand_Jump_Squat'],
      ['Zancada hacia atrás', 'Dumbbell_Rear_Lunge'],
      ['Elevación de talones', 'Standing_Dumbbell_Calf_Raise'],
    ],
  },
  hombro: {
    gym: [
      ['Press militar', 'Standing_Military_Press'],
      ['Elevaciones laterales', 'Side_Lateral_Raise'],
      ['Face pull', 'Face_Pull'],
      ['Press con mancuernas sentado', 'Seated_Dumbbell_Press'],
      ['Press Arnold', 'Arnold_Dumbbell_Press'],
      ['Pájaros con mancuernas', 'Reverse_Flyes'],
      ['Elevaciones frontales', 'Front_Dumbbell_Raise'],
      ['Press de hombro en máquina', 'Machine_Shoulder_Military_Press'],
      ['Elevaciones laterales en polea', 'Cable_Seated_Lateral_Raise'],
    ],
    home: [
      ['Pike push-ups', 'Handstand_Push-Ups'],
      ['Elevaciones con botellas', 'Side_Lateral_Raise'],
      ['Flexiones en pica', 'Handstand_Push-Ups'],
      ['Press con botellas', 'Standing_Dumbbell_Press'],
      ['Pájaros con botellas', 'Reverse_Flyes'],
      ['Elevaciones frontales con botellas', 'Front_Two-Dumbbell_Raise'],
      ['Aperturas con banda elástica', 'Band_Pull_Apart'],
    ],
  },
  triceps: {
    gym: [
      ['Extensión en polea', 'Triceps_Pushdown'],
      ['Press francés', 'EZ-Bar_Skullcrusher'],
      ['Fondos en paralelas', 'Dips_-_Triceps_Version'],
      ['Press banca agarre cerrado', 'Close-Grip_Barbell_Bench_Press'],
      ['Extensión con cuerda', 'Triceps_Pushdown_-_Rope_Attachment'],
      ['Extensión sobre la cabeza con cuerda', 'Triceps_Overhead_Extension_with_Rope'],
      ['Patada de tríceps', 'Tricep_Dumbbell_Kickback'],
    ],
    home: [
      ['Fondos en silla', 'Bench_Dips'],
      ['Flexiones cerradas', 'Incline_Push-Up_Close-Grip'],
      ['Extensión con mochila', 'Standing_Dumbbell_Triceps_Extension'],
      ['Patada de tríceps con botella', 'Tricep_Dumbbell_Kickback'],
      ['Extensión con toalla', 'Standing_Towel_Triceps_Extension'],
      ['Press de tríceps en el suelo', 'Body_Tricep_Press'],
    ],
  },
  biceps: {
    gym: [
      ['Curl con barra', 'Barbell_Curl'],
      ['Curl martillo', 'Hammer_Curls'],
      ['Curl en polea', 'Standing_Biceps_Cable_Curl'],
      ['Curl predicador', 'Preacher_Curl'],
      ['Curl inclinado con mancuernas', 'Incline_Dumbbell_Curl'],
      ['Curl concentrado', 'Concentration_Curls'],
      ['Curl con barra Z', 'Close-Grip_EZ_Bar_Curl'],
    ],
    home: [
      ['Curl con mochila', 'Barbell_Curl'],
      ['Curl con toalla', 'Standing_Biceps_Cable_Curl'],
      ['Curl con botellas', 'Dumbbell_Bicep_Curl'],
      ['Curl martillo con botellas', 'Hammer_Curls'],
      ['Curl concentrado con botella', 'Concentration_Curls'],
      ['Curl inverso con mochila', 'Reverse_Barbell_Curl'],
    ],
  },
  core: {
    gym: [
      ['Plancha', 'Plank'],
      ['Elevación de piernas', 'Hanging_Leg_Raise'],
      ['Crunch en polea', 'Cable_Crunch'],
      ['Rueda abdominal', 'Ab_Roller'],
      ['Pallof press', 'Pallof_Press'],
      ['Leñador en polea', 'Standing_Cable_Wood_Chop'],
      ['Plancha lateral', 'Side_Bridge'],
      ['Crunch en máquina', 'Ab_Crunch_Machine'],
    ],
    home: [
      ['Plancha', 'Plank'],
      ['Bicicleta abdominal', 'Air_Bike'],
      ['Elevación de piernas', 'Flat_Bench_Lying_Leg_Raise'],
      ['Plancha lateral', 'Side_Bridge'],
      ['Bicho muerto', 'Dead_Bug'],
      ['Crunch', 'Crunches'],
      ['Giros rusos', 'Russian_Twist'],
      ['Crunch inverso', 'Reverse_Crunch'],
    ],
  },
};

const names = (l: Entry[]) => l.map(([n]) => n);

export const EXERCISES: Record<string, { gym: string[]; home: string[] }> = Object.fromEntries(
  Object.entries(CATALOG).map(([m, { gym, home }]) => [m, { gym: names(gym), home: names(home) }]),
);

/** Nombre → id de free-exercise-db. */
export const EXERCISE_DB_ID: Record<string, string> = Object.fromEntries(
  Object.values(CATALOG).flatMap(({ gym, home }) => [...gym, ...home]),
);

const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

/** Dos fotos (posición inicial y final) del ejercicio, o [] si no tiene. */
export const exerciseImages = (name: string): string[] => {
  const id = EXERCISE_DB_ID[name];
  return id ? [`${IMG_BASE}${id}/0.jpg`, `${IMG_BASE}${id}/1.jpg`] : [];
};
