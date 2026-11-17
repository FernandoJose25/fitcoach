import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyKcalDelta, computeTargets, type Food, type Item, type Profile, type SetLog, type Targets } from '@fitcoach/core';

export type Via = 'plan' | 'manual' | 'scan' | 'barcode';
export interface LogItem extends Item {
  slot: number; // índice de la comida dentro del plan del día
  via: Via;
}
export type SchemePref = 'auto' | 'light' | 'dark';
/** Medidas corporales en cm. */
export interface Measures {
  waist?: number;
  chest?: number;
  arm?: number;
  hip?: number;
  thigh?: number;
}
export interface ProgressPhoto {
  date: string;
  uri: string; // archivo en el almacenamiento de la app (no en la caché)
}
export interface Reminders {
  meals: boolean;
  water: boolean;
  workout: boolean;
  weigh: boolean;
}

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const DRAFT_DEFAULT: Partial<Profile> = {
  name: '',
  sex: 'male',
  age: 25,
  weightKg: 70,
  heightCm: 175,
  goal: 'gain',
  pace: 'moderate',
  level: 'beginner',
  where: 'gym',
  daysPerWeek: 4,
  activity: 'active',
  allergies: [],
  avoid: [],
  mealsPerDay: 4,
};

interface AppState {
  hydrated: boolean;
  profile: Profile | null;
  targets: Targets | null;
  variants: number[];
  logs: Record<string, LogItem[]>; // por día
  water: Record<string, number>; // vasos por día
  streak: number;
  scheme: SchemePref;
  draft: Partial<Profile>;
  customFoods: Record<string, Food>; // productos escaneados por código de barras (Open Food Facts)
  dirtyDays: string[]; // días con cambios sin subir a Supabase
  profileDirty: boolean;
  sets: Record<string, SetLog[]>; // series registradas por día
  swaps: Record<string, Record<number, string>>; // por sesión ("push-0"): índice → ejercicio elegido
  workoutDays: string[]; // fechas con entreno terminado (racha)
  programStart: string | null; // lunes de la semana 1 del programa
  sessionsDone: { date: string; week: number; day: number }[]; // días del programa completados
  voice: boolean; // indicaciones por voz en el entreno guiado
  guide: GuidePref; // cómo se muestra la demostración del ejercicio
  weights: Record<string, number>; // kg por fecha
  measures: Record<string, Measures>; // cm por fecha
  photos: ProgressPhoto[];
  reminders: Reminders;
  kcalAdjust: number; // ajuste adaptativo acumulado sobre las metas calculadas
  adjustedAt: string | null; // fecha del último ajuste (uno por semana como máximo)
  startProgram: () => void;
  setVoice: (on: boolean) => void;
  setGuide: (g: GuidePref) => void;
  logWeight: (kg: number, day?: string) => void;
  setMeasures: (patch: Measures, day?: string) => void;
  addPhoto: (p: ProgressPhoto) => void;
  removePhoto: (uri: string) => void;
  setReminders: (patch: Partial<Reminders>) => void;
  applyAdjust: (delta: number) => void;
  logSet: (s: SetLog, day?: string) => void;
  removeSet: (exercise: string, setNo: number, day?: string) => void;
  swapExercise: (sessionKey: string, index: number, name: string | null) => void; // null = volver al recomendado
  finishWorkout: (week: number, day: number) => boolean;
  addFood: (f: Food) => void;
  setDraft: (patch: Partial<Profile>) => void;
  resetDraft: (from?: Profile | null) => void;
  commitProfile: (p: Profile) => void;
  swapRecipe: (slot: number) => void;
  addLogs: (items: LogItem[], day?: string) => void;
  clearSlot: (slot: number, day?: string) => void;
  setWater: (glasses: number, day?: string) => void;
  setScheme: (s: SchemePref) => void;
}

/** Demostración de ejercicios: animación 3D (si existe para ese ejercicio) o fotos. */
export type GuidePref = '3d' | 'foto';

const touch = (days: string[], day: string) => (days.includes(day) ? days : [...days, day]);

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      profile: null,
      targets: null,
      variants: [],
      logs: {},
      water: {},
      streak: 0,
      scheme: 'auto',
      draft: { ...DRAFT_DEFAULT },
      customFoods: {},
      dirtyDays: [],
      profileDirty: false,
      sets: {},
      swaps: {},
      workoutDays: [],
      programStart: null,
      sessionsDone: [],
      voice: true,
      guide: '3d',
      weights: {},
      measures: {},
      photos: [],
      reminders: { meals: false, water: false, workout: false, weigh: false },
      kcalAdjust: 0,
      adjustedAt: null,
      startProgram: () => {
        if (get().programStart) return;
        const d = new Date();
        d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        set({ programStart: todayKey(d) });
      },
      setVoice: (voice) => set({ voice }),
      setGuide: (guide) => set({ guide }),
      logWeight: (kg, day = todayKey()) => set({ weights: { ...get().weights, [day]: Math.round(kg * 10) / 10 } }),
      setMeasures: (patch, day = todayKey()) => set({ measures: { ...get().measures, [day]: { ...get().measures[day], ...patch } } }),
      addPhoto: (ph) => set({ photos: [...get().photos, ph] }),
      removePhoto: (uri) => set({ photos: get().photos.filter((x) => x.uri !== uri) }),
      setReminders: (patch) => set({ reminders: { ...get().reminders, ...patch } }),
      applyAdjust: (delta) => {
        const t = get().targets;
        if (!t) return;
        set({ targets: applyKcalDelta(t, delta), kcalAdjust: get().kcalAdjust + delta, adjustedAt: todayKey(), profileDirty: true });
      },
      logSet: (x, day = todayKey()) => {
        const rest = (get().sets[day] ?? []).filter((s) => !(s.exercise === x.exercise && s.setNo === x.setNo));
        set({ sets: { ...get().sets, [day]: [...rest, x] }, dirtyDays: touch(get().dirtyDays, day) });
      },
      removeSet: (exercise, setNo, day = todayKey()) =>
        set({
          sets: { ...get().sets, [day]: (get().sets[day] ?? []).filter((s) => !(s.exercise === exercise && s.setNo === setNo)) },
          dirtyDays: touch(get().dirtyDays, day),
        }),
      swapExercise: (key, index, name) => {
        const rest = { ...get().swaps[key] };
        delete rest[index];
        set({ swaps: { ...get().swaps, [key]: name ? { ...rest, [index]: name } : rest } });
      },
      // Marca el día del programa como hecho; la racha sube solo con el primer entreno de cada fecha.
      finishWorkout: (week, day) => {
        const date = todayKey();
        const s = get();
        const sessionsDone = s.sessionsDone.some((x) => x.week === week && x.day === day) ? s.sessionsDone : [...s.sessionsDone, { date, week, day }];
        if (s.workoutDays.includes(date)) {
          set({ sessionsDone });
          return false;
        }
        set({ sessionsDone, workoutDays: [...s.workoutDays, date], streak: s.streak + 1 });
        return true;
      },
      addFood: (f) => set({ customFoods: { ...get().customFoods, [f.id]: f } }),
      setDraft: (patch) => set({ draft: { ...get().draft, ...patch } }),
      resetDraft: (from) => set({ draft: from ? { ...from } : { ...DRAFT_DEFAULT } }),
      commitProfile: (p) =>
        set({
          profile: p,
          targets: computeTargets(p),
          variants: [],
          draft: { ...p },
          profileDirty: true,
          kcalAdjust: 0,
          weights: get().profile?.weightKg === p.weightKg && Object.keys(get().weights).length ? get().weights : { ...get().weights, [todayKey()]: p.weightKg },
        }),
      swapRecipe: (slot) => {
        const v = [...get().variants];
        v[slot] = (v[slot] ?? 0) + 1;
        const day = todayKey();
        set({ variants: v, logs: { ...get().logs, [day]: (get().logs[day] ?? []).filter((l) => l.slot !== slot) }, dirtyDays: touch(get().dirtyDays, day) });
      },
      addLogs: (items, day = todayKey()) =>
        set({ logs: { ...get().logs, [day]: [...(get().logs[day] ?? []), ...items] }, dirtyDays: touch(get().dirtyDays, day) }),
      clearSlot: (slot, day = todayKey()) =>
        set({ logs: { ...get().logs, [day]: (get().logs[day] ?? []).filter((l) => l.slot !== slot) }, dirtyDays: touch(get().dirtyDays, day) }),
      setWater: (glasses, day = todayKey()) => 
        set({ water: { ...get().water, [day]: Math.max(0, Math.min(8, glasses)) }, dirtyDays: touch(get().dirtyDays, day) }),
      setScheme: (scheme) => set({ scheme }),
    }),
    {
      name: 'fitcoach',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        profile: s.profile,
        targets: s.targets,
        variants: s.variants,
        logs: s.logs,
        water: s.water,
        streak: s.streak,
        scheme: s.scheme,
        draft: s.draft,
        customFoods: s.customFoods,
        dirtyDays: s.dirtyDays,
        profileDirty: s.profileDirty,
        sets: s.sets,
        swaps: s.swaps,
        workoutDays: s.workoutDays,
        programStart: s.programStart,
        sessionsDone: s.sessionsDone,
        voice: s.voice,
        guide: s.guide,
        weights: s.weights,
        measures: s.measures,
        photos: s.photos,
        reminders: s.reminders,
        kcalAdjust: s.kcalAdjust,
        adjustedAt: s.adjustedAt,
      }),
      onRehydrateStorage: () => () => useApp.setState({ hydrated: true }),
    },
  ),
);
