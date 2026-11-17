import { EXERCISES } from './data/exercises';
import type { Goal, Targets } from './types';
import { repsHigh, repsLow, setScore, type SetLog } from './workouts';

const DAY = 86_400_000;
const dayNum = (d: string) => Date.parse(`${d}T00:00:00Z`) / DAY;
const kg = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));

// ------------------------------------------------------------------------------------------------
// Músculos trabajados

const MUSCLE_OF: Record<string, string> = Object.fromEntries(
  Object.entries(EXERCISES).flatMap(([m, { gym, home }]) => [...gym, ...home].map((n) => [n, m] as const)),
);

/** Grupo muscular de un ejercicio del catálogo (null si no está). */
export const muscleOf = (exercise: string): string | null => MUSCLE_OF[exercise] ?? null;

/** Series hechas por grupo muscular en los días indicados. */
export function muscleSets(setsByDay: Record<string, SetLog[]>, days: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of days)
    for (const s of setsByDay[d] ?? []) {
      const m = muscleOf(s.exercise);
      if (m) out[m] = (out[m] ?? 0) + 1;
    }
  return out;
}

// ------------------------------------------------------------------------------------------------
// Sobrecarga progresiva

export interface Suggestion {
  weightKg: number;
  reps: number;
  /** Por qué se propone este objetivo, para mostrarlo en la serie. */
  note: string;
}

/**
 * Objetivo de la próxima serie a partir de la última (doble progresión): si completaste el tope del
 * rango, sube el peso y vuelve al mínimo; si no, una repetición más. Sin peso, solo repeticiones.
 * Isométricos (`timed`): +5 s.
 */
export function suggestNext(last: SetLog | null, reps: string, timed: boolean, step = 2.5): Suggestion | null {
  if (!last) return null;
  if (timed) return { weightKg: 0, reps: last.reps + 5, note: `+5 s: la vez pasada aguantaste ${last.reps} s` };
  const low = repsLow(reps);
  const high = repsHigh(reps);
  if (last.reps >= high && last.weightKg > 0)
    return { weightKg: last.weightKg + step, reps: low, note: `+${kg(step)} kg: la vez pasada hiciste ${last.reps} reps con ${kg(last.weightKg)} kg` };
  if (last.reps >= high) return { weightKg: 0, reps: last.reps + 1, note: `+1 rep: la vez pasada hiciste ${last.reps}` };
  if (last.reps < low) return { weightKg: last.weightKg, reps: low, note: `Mismo peso: apunta a ${low} reps (la vez pasada ${last.reps})` };
  return { weightKg: last.weightKg, reps: last.reps + 1, note: `+1 rep: la vez pasada hiciste ${last.reps}${last.weightKg ? ` con ${kg(last.weightKg)} kg` : ''}` };
}

// ------------------------------------------------------------------------------------------------
// Récords

export interface PersonalRecord {
  exercise: string;
  day: string;
  best: SetLog;
}

/** Mejor serie (1RM estimado o repeticiones) de cada ejercicio en todo el historial. */
export function personalRecords(setsByDay: Record<string, SetLog[]>): PersonalRecord[] {
  const best: Record<string, PersonalRecord> = {};
  for (const day of Object.keys(setsByDay).sort())
    for (const s of setsByDay[day]) {
      const cur = best[s.exercise];
      if (!cur || setScore(s) > setScore(cur.best)) best[s.exercise] = { exercise: s.exercise, day, best: s };
    }
  return Object.values(best).sort((a, b) => (a.day < b.day ? 1 : -1));
}

/** Ejercicios en los que `day` superó la mejor marca anterior (la primera vez no cuenta como récord). */
export function newRecords(setsByDay: Record<string, SetLog[]>, day: string): (PersonalRecord & { prev: SetLog })[] {
  const before = Object.fromEntries(Object.entries(setsByDay).filter(([d]) => d < day));
  const prev = Object.fromEntries(personalRecords(before).map((r) => [r.exercise, r.best]));
  const today: Record<string, SetLog> = {};
  for (const s of setsByDay[day] ?? []) if (!today[s.exercise] || setScore(s) > setScore(today[s.exercise])) today[s.exercise] = s;
  return Object.values(today)
    .filter((s) => prev[s.exercise] && setScore(s) > setScore(prev[s.exercise]))
    .map((s) => ({ exercise: s.exercise, day, best: s, prev: prev[s.exercise] }));
}

/** Cuántas veces se batió una marca propia (para logros). */
function recordCount(setsByDay: Record<string, SetLog[]>): number {
  const best: Record<string, number> = {};
  let n = 0;
  for (const day of Object.keys(setsByDay).sort()) {
    const top: Record<string, number> = {};
    for (const s of setsByDay[day]) top[s.exercise] = Math.max(top[s.exercise] ?? 0, setScore(s));
    for (const [e, v] of Object.entries(top)) {
      if (best[e] !== undefined && v > best[e]) n++;
      best[e] = Math.max(best[e] ?? 0, v);
    }
  }
  return n;
}

// ------------------------------------------------------------------------------------------------
// Peso y ajuste de calorías

export interface Trend {
  /** Cambio de peso por semana según la recta de mejor ajuste (kg). */
  kgPerWeek: number;
  latest: number;
  entries: number;
  spanDays: number;
}

/** Tendencia del peso en las últimas `windowDays` (regresión lineal; suaviza el ruido diario). */
export function weightTrend(weights: Record<string, number>, today: string, windowDays = 28): Trend | null {
  const t0 = dayNum(today);
  const pts = Object.entries(weights)
    .map(([d, w]) => [dayNum(d), w] as const)
    .filter(([x]) => x <= t0 && x > t0 - windowDays)
    .sort((a, b) => a[0] - b[0]);
  if (pts.length < 2) return null;
  const n = pts.length;
  const mx = pts.reduce((a, [x]) => a + x, 0) / n;
  const my = pts.reduce((a, [, y]) => a + y, 0) / n;
  const sxx = pts.reduce((a, [x]) => a + (x - mx) ** 2, 0);
  const slope = sxx ? pts.reduce((a, [x, y]) => a + (x - mx) * (y - my), 0) / sxx : 0;
  return { kgPerWeek: +(slope * 7).toFixed(2), latest: pts[n - 1][1], entries: n, spanDays: pts[n - 1][0] - pts[0][0] };
}

export interface Adjustment {
  delta: number;
  reason: string;
}

/**
 * Ajuste semanal de calorías (como el modo adaptativo de Fitia): compara tu tendencia real con el
 * ritmo que pide el plan y propone ±100–150 kcal. Pide al menos 3 pesajes en 2 semanas.
 */
export function adaptiveAdjust(weights: Record<string, number>, t: Targets, goal: Goal, today: string): Adjustment | null {
  const tr = weightTrend(weights, today, 28);
  if (!tr || tr.entries < 3 || tr.spanDays < 14) return null;
  const real = tr.kgPerWeek;
  const plan = t.weeklyKg;
  const diff = real - plan;
  const rate = (v: number) => `${v > 0 ? '+' : ''}${kg(+v.toFixed(2))} kg/sem`;
  if (goal === 'lose') {
    if (diff > 0.15)
      return { delta: diff > 0.35 ? -150 : -100, reason: `Vas a ${rate(real)} y el plan apunta a ${rate(plan)}. Bajar un poco las calorías retoma el ritmo.` };
    if (diff < -0.3) return { delta: 100, reason: `Bajas a ${rate(real)}, más rápido de lo planeado (${rate(plan)}). Subir un poco protege tu músculo.` };
  } else if (goal === 'gain') {
    if (diff < -0.1)
      return { delta: diff < -0.25 ? 150 : 100, reason: `Vas a ${rate(real)} y el plan apunta a ${rate(plan)}. Subir un poco las calorías retoma el ritmo.` };
    if (diff > 0.25) return { delta: -100, reason: `Subes a ${rate(real)}, más rápido de lo planeado (${rate(plan)}): parte sería grasa.` };
  } else if (Math.abs(real) > 0.2) {
    return { delta: real > 0 ? -100 : 100, reason: `Tu peso cambia ${rate(real)} y quieres mantenerlo.` };
  }
  return null;
}

/** Metas con `delta` kcal: la proteína no cambia; el resto se reparte 60 % carbos y 40 % grasa. */
export function applyKcalDelta(t: Targets, delta: number): Targets {
  const kcal = Math.round((t.kcal + delta) / 10) * 10;
  return {
    ...t,
    kcal,
    carbs: Math.max(0, Math.round(t.carbs + (delta * 0.6) / 4)),
    fat: Math.max(0, Math.round(t.fat + (delta * 0.4) / 9)),
    weeklyKg: +(((kcal - t.tdee) * 7) / 7700).toFixed(2),
  };
}

// ------------------------------------------------------------------------------------------------
// Logros

export interface AchievementInput {
  workoutDays: string[];
  sessionsDone: { week: number; day: number }[];
  daysPerWeek: number;
  streak: number;
  sets: Record<string, SetLog[]>;
  mealDays: number;
  water: Record<string, number>;
  weights: Record<string, number>;
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  /** 0–1; 1 = conseguido. */
  progress: number;
}

export function achievements(x: AchievementInput): Achievement[] {
  const workouts = x.workoutDays.length;
  const perWeek: Record<number, Set<number>> = {};
  for (const s of x.sessionsDone) (perWeek[s.week] ??= new Set()).add(s.day);
  const fullWeek = Object.values(perWeek).some((d) => d.size >= x.daysPerWeek);
  const records = recordCount(x.sets);
  const volume = Object.values(x.sets).flat().reduce((v, s) => v + s.weightKg * s.reps, 0);
  const hydrated = Object.values(x.water).filter((g) => g >= 8).length;
  const weighWeeks = new Set(Object.keys(x.weights).map((d) => Math.floor((dayNum(d) + 3) / 7))).size;
  const p = (v: number, goal: number) => Math.min(1, v / goal);
  return [
    { id: 'primer-entreno', title: 'Primer entreno', desc: 'Termina tu primera sesión guiada.', progress: p(workouts, 1) },
    { id: 'racha-7', title: 'Racha de 7', desc: 'Entrena 7 días de entreno seguidos sin romper la racha.', progress: p(x.streak, 7) },
    { id: 'semana-completa', title: 'Semana completa', desc: 'Haz todos los días de tu programa en una semana.', progress: fullWeek ? 1 : 0 },
    { id: 'entrenos-10', title: '10 entrenos', desc: 'Completa 10 sesiones.', progress: p(workouts, 10) },
    { id: 'entrenos-50', title: '50 entrenos', desc: 'Completa 50 sesiones.', progress: p(workouts, 50) },
    { id: 'primer-record', title: 'Primer récord', desc: 'Supera tu mejor marca en un ejercicio.', progress: p(records, 1) },
    { id: 'records-10', title: '10 récords', desc: 'Bate tus marcas 10 veces.', progress: p(records, 10) },
    { id: 'toneladas-10', title: '10 toneladas', desc: 'Levanta 10 000 kg de volumen en total.', progress: p(volume, 10_000) },
    { id: 'primera-comida', title: 'Primera comida', desc: 'Registra tu primera comida.', progress: p(x.mealDays, 1) },
    { id: 'hidratado-7', title: 'Bien hidratado', desc: 'Llega a 2 L de agua en 7 días.', progress: p(hydrated, 7) },
    { id: 'pesaje-4', title: 'Constancia', desc: 'Regístrate el peso 4 semanas distintas.', progress: p(weighWeeks, 4) },
  ];
}
