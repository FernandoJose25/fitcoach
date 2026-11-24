import type { Focus, Profile, Where } from './types';
import { EXERCISES } from './data/exercises';

/**
 * Descanso entre series. Como cada circuito alterna músculos distintos, cada músculo igual descansa
 * 2–3 min entre sus propias series (lo que pide la hipertrofia) sin pausas largas para el usuario.
 */
export const REST_SEC = 30;

/** Músculos que suma cada zona prioritaria. */
export const FOCUS_MUSCLES: Record<Focus, string[]> = {
  pecho: ['pecho'],
  espalda: ['espalda'],
  hombro: ['hombro'],
  brazos: ['biceps', 'triceps'],
  core: ['core'],
  pierna: ['pierna', 'gluteo'],
};

export const TRAIN_DAYS = { 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5] } as const; // 0 = lunes
export const SPLIT = {
  3: ['full', 'full', 'full'],
  4: ['upper', 'lower', 'upper', 'lower'],
  5: ['push', 'pull', 'legs', 'upper', 'lower'],
  6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
} as const;
export const SESSION_NAMES = {
  full: 'Cuerpo completo',
  upper: 'Superior',
  lower: 'Inferior',
  push: 'Empuje',
  pull: 'Tirón',
  legs: 'Pierna',
} as const;
const MUSCLES = {
  push: ['pecho', 'pecho', 'hombro', 'hombro', 'triceps', 'triceps'],
  pull: ['espalda', 'espalda', 'espalda', 'biceps', 'biceps', 'core'],
  legs: ['pierna', 'pierna', 'pierna', 'pierna', 'core', 'core'],
  upper: ['pecho', 'espalda', 'hombro', 'espalda', 'biceps', 'triceps'],
  lower: ['pierna', 'pierna', 'pierna', 'pierna', 'core', 'core'],
  full: ['pierna', 'pecho', 'espalda', 'hombro', 'pierna', 'core'],
} as const;
/**
 * Mujeres: mismo volumen y rangos (responden al entreno igual que los hombres), pero los días con pierna
 * reparten la pierna entre cuádriceps/femorales y glúteo, la zona que más suelen querer trabajar.
 */
const MUSCLES_FEMALE: Partial<Record<SessionKind, readonly string[]>> = {
  legs: ['pierna', 'gluteo', 'pierna', 'gluteo', 'core', 'core'],
  lower: ['pierna', 'gluteo', 'pierna', 'gluteo', 'core', 'core'],
  full: ['pierna', 'espalda', 'gluteo', 'pecho', 'hombro', 'core'],
};

export type SessionKind = keyof typeof MUSCLES;

export interface PlannedExercise {
  name: string;
  muscle: string;
  compound: boolean;
  sets: number;
  reps: string;
  restSec: number;
  /** Circuito (0 = A): sus ejercicios se hacen seguidos, una serie de cada uno, y se repiten por vueltas. */
  block: number;
  /** Ejercicio o serie extra por la zona que el usuario quiere priorizar. */
  focus?: boolean;
}

type Draft = Omit<PlannedExercise, 'block'>;

/**
 * Sesión del split: ejercicios del lugar (rotan con `occurrence`), series según nivel, repeticiones según
 * objetivo (ganar músculo: pesado; perder grasa: más repeticiones). En mujeres, los días con pierna incluyen
 * glúteo (ver `MUSCLES_FEMALE`). La zona prioritaria suma una serie a sus dos primeros ejercicios y, si la
 * sesión la trabaja poco, un ejercicio más. Sale ordenada en circuitos.
 */
export function buildSession(kind: SessionKind, occurrence: number, p: Profile): PlannedExercise[] {
  const where = p.where === 'home' ? 'home' : 'gym';
  const muscles = (p.sex === 'female' && MUSCLES_FEMALE[kind]) || MUSCLES[kind];
  const slots: { m: string; extra: boolean }[] = muscles.map((m) => ({ m, extra: false }));
  const countOf = (m: string) => slots.filter((s) => s.m === m).length;
  for (const f of (p.focus ?? []).slice(0, 2)) {
    // Zonas de dos grupos (brazos, piernas y glúteos): suma el que menos aparece en la sesión (bíceps en
    // empuje, tríceps en tirón), y nada si la zona ya tiene 3 ejercicios entre los dos.
    const group = FOCUS_MUSCLES[f] ?? [];
    const m = [...group].sort((a, b) => countOf(a) - countOf(b))[0];
    if (m && group.reduce((n, g) => n + countOf(g), 0) < 3) slots.push({ m, extra: true });
  }
  const focusMuscles = new Set((p.focus ?? []).flatMap((f) => FOCUS_MUSCLES[f] ?? []));
  const used = new Set<string>();
  const count: Record<string, number> = {};
  const out: Draft[] = [];
  slots.forEach(({ m, extra }, i) => {
    const list = EXERCISES[m][where];
    count[m] ??= 0;
    let name: string | null = null;
    for (let j = 0; j < list.length; j++) {
      const c = list[(occurrence + count[m] + j) % list.length];
      if (!used.has(c)) {
        name = c;
        break;
      }
    }
    count[m]++;
    if (!name) return;
    used.add(name);
    const compound = i < 2;
    const base = p.level === 'beginner' ? 3 : p.level === 'advanced' ? (compound ? 5 : 4) : compound ? 4 : 3;
    const prioritized = focusMuscles.has(m) && !extra && count[m] <= 2;
    const sets = Math.min(5, base + (prioritized ? 1 : 0));
    const reps =
      p.goal === 'gain'
        ? compound
          ? '6–8'
          : '10–12'
        : p.goal === 'lose'
          ? compound
            ? '10–12'
            : '12–15'
          : compound
            ? '8–10'
            : '10–12';
    out.push({ name, muscle: m, compound, sets, reps, restSec: REST_SEC, ...(extra || prioritized ? { focus: true } : {}) });
  });
  return toCircuits(out);
}

/**
 * Reparte la sesión en circuitos de 2–3 ejercicios de músculos distintos (los compuestos primero):
 * así nunca se encadenan series del mismo músculo y el entreno se siente variado.
 */
export function toCircuits(exs: Draft[]): PlannedExercise[] {
  const n = exs.length;
  const blocks = Math.ceil(n / 3);
  const left = [...exs];
  const out: PlannedExercise[] = [];
  for (let b = 0; b < blocks; b++) {
    const size = Math.floor(n / blocks) + (b < n % blocks ? 1 : 0);
    const block: Draft[] = [];
    while (block.length < size && left.length) {
      const i = left.findIndex((e) => !block.some((x) => x.muscle === e.muscle));
      block.push(left.splice(Math.max(0, i), 1)[0]);
    }
    out.push(...block.map((e) => ({ ...e, block: b })));
  }
  return out;
}

/** Letra del circuito: 0 → "A". */
export const circuitLetter = (block: number) => String.fromCharCode(65 + block);

/** Sesión que corresponde a un día de la semana (0 = lunes) o null si es descanso. */
export function sessionForWeekday(weekday: number, p: Profile): { kind: SessionKind; occurrence: number } | null {
  const days = TRAIN_DAYS[p.daysPerWeek] as readonly number[];
  const idx = days.indexOf(weekday);
  if (idx < 0) return null;
  const split = SPLIT[p.daysPerWeek] as readonly SessionKind[];
  const kind = split[idx];
  const occurrence = split.slice(0, idx).filter((k) => k === kind).length;
  return { kind, occurrence };
}

/** Siguiente sesión de entreno a partir de un día (excluido), para entrenar en un día de descanso. */
export function nextSession(weekday: number, p: Profile): { kind: SessionKind; occurrence: number } {
  for (let i = 1; i <= 7; i++) {
    const s = sessionForWeekday((weekday + i) % 7, p);
    if (s) return s;
  }
  return { kind: 'full', occurrence: 0 };
}

/** Equivalentes para cambiar un ejercicio: mismo músculo y lugar, sin los que ya están en la sesión. */
export const alternativeExercises = (muscle: string, where: Where, used: string[]): string[] =>
  (EXERCISES[muscle]?.[where] ?? []).filter((n) => !used.includes(n));

/**
 * Sesión con los cambios de ejercicio del usuario aplicados (índice → nombre). Un cambio guardado con
 * otro orden de la sesión (otra zona prioritaria, versión anterior) se ignora si no es del mismo músculo.
 */
export const applySwaps = (session: PlannedExercise[], swaps: Record<number, string>): PlannedExercise[] =>
  session.map((e, i) => {
    const n = swaps[i];
    const ok = n && (EXERCISES[e.muscle]?.gym.includes(n) || EXERCISES[e.muscle]?.home.includes(n));
    return ok ? { ...e, name: n } : e;
  });

/** Serie registrada: repeticiones y peso (0 = solo peso corporal). */
export interface SetLog {
  exercise: string;
  setNo: number;
  reps: number;
  weightKg: number;
}

/** Carga estimada de una serie (1RM de Epley). Sin peso cuenta las repeticiones. */
export const setScore = (s: { reps: number; weightKg: number }) => (s.weightKg > 0 ? s.weightKg * (1 + s.reps / 30) : s.reps);

export interface ExerciseSession {
  day: string;
  best: SetLog;
  volume: number; // kg × reps del día
}

/** Historial de un ejercicio por día, del más antiguo al más reciente. */
export function exerciseHistory(setsByDay: Record<string, SetLog[]>, exercise: string): ExerciseSession[] {
  return Object.keys(setsByDay)
    .sort()
    .flatMap((day) => {
      const sets = setsByDay[day].filter((s) => s.exercise === exercise);
      if (!sets.length) return [];
      const best = sets.reduce((a, b) => (setScore(b) > setScore(a) ? b : a));
      return [{ day, best, volume: sets.reduce((v, s) => v + s.weightKg * s.reps, 0) }];
    });
}

/** Último registro del ejercicio antes de `before` (misma serie si existe; si no, la última de ese día). */
export function lastSet(setsByDay: Record<string, SetLog[]>, exercise: string, setNo: number, before: string): SetLog | null {
  const days = Object.keys(setsByDay)
    .filter((d) => d < before)
    .sort()
    .reverse();
  for (const d of days) {
    const sets = setsByDay[d].filter((s) => s.exercise === exercise);
    if (!sets.length) continue;
    return sets.find((s) => s.setNo === setNo) ?? sets[sets.length - 1];
  }
  return null;
}

/** Volumen total (kg × reps) de los días indicados, opcionalmente de un solo ejercicio. */
export const volumeOf = (setsByDay: Record<string, SetLog[]>, days: string[], exercise?: string) =>
  days.reduce((v, d) => v + (setsByDay[d] ?? []).filter((s) => !exercise || s.exercise === exercise).reduce((x, s) => x + s.weightKg * s.reps, 0), 0);

/** Primer número del rango de repeticiones ("6–8" → 6). */
export const repsLow = (reps: string) => Number.parseInt(reps, 10) || 10;

/** Sesión del día N del programa (0 = Día 1), en el orden del split, sin atarla a un día de la semana. */
export function sessionForDay(day: number, p: Profile): { kind: SessionKind; occurrence: number } {
  const split = SPLIT[p.daysPerWeek] as readonly SessionKind[];
  const i = day % split.length;
  return { kind: split[i], occurrence: split.slice(0, i).filter((k) => k === split[i]).length };
}

/** Semana del programa (1, 2, …) contando desde el lunes en que empezó. Fechas "YYYY-MM-DD". */
export function programWeek(start: string, today: string): number {
  const ms = Date.parse(`${today}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  return Math.max(1, Math.floor(ms / 86_400_000 / 7) + 1);
}

/** Ejercicios isométricos: se cuentan en segundos, no en repeticiones. */
export const isTimed = (name: string) => /^plancha/i.test(name); // "Flexión con giro a plancha lateral" va por repeticiones

/** Último número del rango de repeticiones ("6–8" → 8). */
export const repsHigh = (reps: string) => {
  const n = reps.match(/\d+/g);
  return n ? Number(n[n.length - 1]) : 10;
};

/** Duración de una serie: ~3 s por repetición + 5 s para colocarse, en múltiplos de 5 (20–60 s). Isométricos: 30 s. */
export function setSeconds(ex: Pick<PlannedExercise, 'name' | 'reps'>): number {
  if (isTimed(ex.name)) return 30;
  return Math.min(60, Math.max(20, Math.round((repsHigh(ex.reps) * 3 + 5) / 5) * 5));
}

/** Paso del entreno guiado. En `rest`, `ex` y `set` indican lo que viene después del descanso. */
export type Step =
  | { kind: 'prep'; ex: number; set: number; secs: number }
  | { kind: 'work'; ex: number; set: number; secs: number }
  | { kind: 'rest'; ex: number; set: number; secs: number };

/**
 * Línea de tiempo en circuitos: en cada vuelta, una serie de cada ejercicio del circuito con su descanso
 * entre medio; al terminar las vueltas, el circuito siguiente. No hay descanso tras la última serie.
 */
export function buildTimeline(exs: PlannedExercise[], prepSec = 10): Step[] {
  const works: { ex: number; set: number }[] = [];
  for (const b of [...new Set(exs.map((e) => e.block))]) {
    const idx = exs.flatMap((e, i) => (e.block === b ? [i] : []));
    const rounds = Math.max(...idx.map((i) => exs[i].sets));
    for (let set = 1; set <= rounds; set++) for (const i of idx) if (exs[i].sets >= set) works.push({ ex: i, set });
  }
  const out: Step[] = [{ kind: 'prep', ex: works[0]?.ex ?? 0, set: 1, secs: prepSec }];
  works.forEach((w, k) => {
    out.push({ kind: 'work', ...w, secs: setSeconds(exs[w.ex]) });
    const next = works[k + 1];
    if (next) out.push({ kind: 'rest', ...next, secs: exs[w.ex].restSec });
  });
  return out;
}

/** Ejercicio de la última serie antes del paso `i` (−1 si aún no hubo ninguna). */
export function prevWorkEx(t: Step[], i: number): number {
  for (let k = i - 1; k >= 0; k--) if (t[k].kind === 'work') return t[k].ex;
  return -1;
}

export const timelineSeconds = (t: Step[]) => t.reduce((a, s) => a + s.secs, 0);
