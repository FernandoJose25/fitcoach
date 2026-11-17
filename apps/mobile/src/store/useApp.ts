import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { computeTargets, type Food, type Item, type Profile, type Targets } from '@fitcoach/core';

export type Via = 'plan' | 'manual' | 'scan' | 'barcode';
export interface LogItem extends Item {
  slot: number; // índice de la comida dentro del plan del día
  via: Via;
}
export type SchemePref = 'auto' | 'light' | 'dark';

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
      addFood: (f) => set({ customFoods: { ...get().customFoods, [f.id]: f } }),
      setDraft: (patch) => set({ draft: { ...get().draft, ...patch } }),
      resetDraft: (from) => set({ draft: from ? { ...from } : { ...DRAFT_DEFAULT } }),
      commitProfile: (p) => set({ profile: p, targets: computeTargets(p), variants: [], draft: { ...p }, profileDirty: true }),
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
      }),
      onRehydrateStorage: () => () => useApp.setState({ hydrated: true }),
    },
  ),
);
