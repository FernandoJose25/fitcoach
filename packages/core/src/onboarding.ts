import type { Activity, Focus, Goal, Level, Pace, Where } from './types';

export interface Option<T extends string = string> {
  value: T;
  label: string;
  desc: string;
}

export const LIMITS = { age: [14, 80], weightKg: [35, 250], heightCm: [130, 220] } as const;
export const MINOR_NOTICE =
  'A tu edad lo mejor es comer bien y entrenar con técnica; consulta con un profesional de salud.';
export const isMinor = (age: number) => age < 18;

export const GOALS: Option<Goal>[] = [
  { value: 'gain', label: 'Ganar masa muscular', desc: 'Más calorías, proteína alta y circuitos de fuerza pesados' },
  { value: 'lose', label: 'Perder grasa', desc: 'Déficit moderado y circuitos con más repeticiones para quemar más' },
  { value: 'maintain', label: 'Mantener peso', desc: 'Comer lo que gastas y tonificar' },
];
/** Zonas que se pueden priorizar: más ejercicios y series para ellas, sin dejar de entrenar el resto. */
export const FOCUS_OPTIONS: Option<Focus>[] = [
  { value: 'pecho', label: 'Pecho', desc: 'Pectorales más llenos y fuertes' },
  { value: 'espalda', label: 'Espalda', desc: 'Espalda ancha y buena postura' },
  { value: 'hombro', label: 'Hombros', desc: 'Hombros anchos y redondos' },
  { value: 'brazos', label: 'Brazos', desc: 'Bíceps y tríceps' },
  { value: 'core', label: 'Abdomen', desc: 'Core fuerte y marcado' },
  { value: 'pierna', label: 'Piernas y glúteos', desc: 'Cuádriceps, femorales y glúteos' },
];
export const MAX_FOCUS = 2;
/** "Pecho y Brazos", o "Equilibrado" si no hay zona prioritaria. */
export const focusLabel = (focus?: Focus[]) =>
  focus?.length ? focus.map((f) => FOCUS_OPTIONS.find((o) => o.value === f)?.label ?? f).join(' y ') : 'Equilibrado';

export const PACES: Option<Pace>[] = [
  { value: 'slow', label: 'Lento', desc: 'Recomendado si empiezas: menos grasa acumulada' },
  { value: 'moderate', label: 'Moderado', desc: 'Equilibrio entre velocidad y calidad' },
  { value: 'fast', label: 'Rápido', desc: 'Más veloz, pero exige más disciplina' },
];
export const LEVELS: Option<Level>[] = [
  { value: 'beginner', label: 'Principiante', desc: 'Menos de 6 meses con constancia' },
  { value: 'intermediate', label: 'Intermedio', desc: '6 meses a 2 años' },
  { value: 'advanced', label: 'Avanzado', desc: 'Más de 2 años con progresión constante' },
];
export const PLACES: Option<Where>[] = [
  { value: 'gym', label: 'Gimnasio', desc: 'Barras, mancuernas, poleas y máquinas' },
  { value: 'home', label: 'Casa', desc: 'Peso corporal, mochila y botellas' },
];
export const ACTIVITIES: Option<Activity>[] = [
  { value: 'low', label: 'Poco activo', desc: 'Trabajo sentado y caminas poco' },
  { value: 'active', label: 'Activo', desc: 'Estás de pie o caminas bastante' },
  { value: 'very_active', label: 'Muy activo', desc: 'Trabajo físico o mucho movimiento' },
];
export const DAYS_OPTIONS = [3, 4, 5, 6] as const;
export const ALLERGIES = ['Maní', 'Mariscos', 'Lácteos', 'Gluten', 'Huevo', 'Soya', 'Frutos secos', 'Pescado'];
export const AVOIDS = ['Cerdo', 'Res', 'Pollo', 'Vegetariano', 'Vegano', 'Hongos', 'Brócoli', 'Cebolla'];
export const MEALS_OPTIONS: Option<'3' | '4' | '5'>[] = [
  { value: '3', label: '3', desc: 'Desayuno, almuerzo y cena' },
  { value: '4', label: '4', desc: 'Incluye un snack, recomendado' },
  { value: '5', label: '5', desc: 'Dos colaciones, ideal si te cuesta comer mucho' },
];

// Primero el objetivo y la zona a trabajar: es lo que el usuario viene a decir.
export const STEPS = [
  { id: 'goal', title: '¿Qué quieres lograr?', subtitle: 'Define tus calorías y cómo entrenas: más fuerza para ganar músculo, más repeticiones para quemar grasa.' },
  { id: 'focus', title: '¿Qué zona quieres trabajar más?', subtitle: 'Le damos más ejercicios y series sin descuidar el resto. Elige hasta dos, o ninguna para un plan equilibrado.' },
  { id: 'basics', title: 'Tus datos básicos', subtitle: 'Los usamos para estimar cuántas calorías gasta tu cuerpo en reposo.' },
  { id: 'pace', title: 'Ritmo de progreso', subtitle: '' },
  { id: 'level', title: 'Tu experiencia entrenando', subtitle: 'Ajustamos series, repeticiones y volumen a tu nivel.' },
  { id: 'where', title: '¿Dónde y cuánto entrenas?', subtitle: 'En casa y en gimnasio los ejercicios son distintos.' },
  { id: 'activity', title: '¿Qué tan activo eres fuera del gym?', subtitle: 'Sin contar tu entrenamiento. Es lo que más cambia tus calorías diarias.' },
  { id: 'allergies', title: 'Alergias e intolerancias', subtitle: 'Nunca te mostraremos alimentos con estos ingredientes.' },
  { id: 'avoid', title: 'Alimentos que prefieres evitar', subtitle: 'Por gusto, religión o tipo de dieta. Elige solo lo que aplique.' },
  { id: 'meals', title: '¿Cuántas comidas haces al día?', subtitle: 'Repartimos tus calorías y tu proteína entre ellas.' },
  { id: 'summary', title: 'Tu plan está listo', subtitle: 'Calculado con tus datos; podrás ajustarlo.' },
] as const;

export type StepId = (typeof STEPS)[number]['id'];

/** Opciones de objetivo y ritmo permitidas para la edad (menores: sin déficit ni ritmo rápido). */
export const goalOptions = (age: number) => (isMinor(age) ? GOALS.filter((g) => g.value !== 'lose') : GOALS);
export const paceOptions = (age: number) => (isMinor(age) ? PACES.filter((g) => g.value !== 'fast') : PACES);

export interface BasicsInput {
  name: string;
  age: number;
  weightKg: number;
  heightCm: number;
}
export type BasicsErrors = Partial<Record<keyof BasicsInput, string>>;

const inRange = (v: number, [a, b]: readonly [number, number]) => Number.isFinite(v) && v >= a && v <= b;

export function validateBasics(b: BasicsInput): BasicsErrors {
  const e: BasicsErrors = {};
  if (!b.name?.trim()) e.name = 'Escribe tu nombre';
  if (!inRange(b.age, LIMITS.age)) e.age = `Edad entre ${LIMITS.age[0]} y ${LIMITS.age[1]} años`;
  if (!inRange(b.weightKg, LIMITS.weightKg)) e.weightKg = `Peso entre ${LIMITS.weightKg[0]} y ${LIMITS.weightKg[1]} kg`;
  if (!inRange(b.heightCm, LIMITS.heightCm)) e.heightCm = `Altura entre ${LIMITS.heightCm[0]} y ${LIMITS.heightCm[1]} cm`;
  return e;
}
