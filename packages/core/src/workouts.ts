import type { Profile } from './types';
import { EXERCISES } from './data/exercises';

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

export type SessionKind = keyof typeof MUSCLES;

export interface PlannedExercise {
  name: string;
  muscle: string;
  compound: boolean;
  sets: number;
  reps: string;
  restSec: number;
}

export function buildSession(kind: SessionKind, occurrence: number, p: Profile): PlannedExercise[] {
  const where = p.where === 'home' ? 'home' : 'gym';
  const used = new Set<string>();
  const count: Record<string, number> = {};
  const out: PlannedExercise[] = [];
  MUSCLES[kind].forEach((m, i) => {
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
    const sets = p.level === 'beginner' ? 3 : p.level === 'advanced' ? (compound ? 5 : 4) : compound ? 4 : 3;
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
    out.push({ name, muscle: m, compound, sets, reps, restSec: compound ? 120 : 75 });
  });
  return out;
}

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
