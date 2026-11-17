import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { computeTargets, type Item, type Profile, type Targets } from '@fitcoach/core';

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
  setDraft: (patch: Partial<Profile>) => void;
  resetDraft: (from?: Profile | null) => void;
  commitProfile: (p: Profile) => void;
  swapRecipe: (slot: number) => void;
  addLogs: (items: LogItem[], day?: string) => void;
  clearSlot: (slot: number, day?: string) => void;
  setWater: (glasses: number, day?: string) => void;
  setScheme: (s: SchemePref) => void;
}

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
      setDraft: (patch) => set({ draft: { ...get().draft, ...patch } }),
      resetDraft: (from) => set({ draft: from ? { ...from } : { ...DRAFT_DEFAULT } }),
      commitProfile: (p) => set({ profile: p, targets: computeTargets(p), variants: [], draft: { ...p } }),
      swapRecipe: (slot) => {
        const v = [...get().variants];
        v[slot] = (v[slot] ?? 0) + 1;
        const day = todayKey();
        set({ variants: v, logs: { ...get().logs, [day]: (get().logs[day] ?? []).filter((l) => l.slot !== slot) } });
      },
      addLogs: (items, day = todayKey()) =>
        set({ logs: { ...get().logs, [day]: [...(get().logs[day] ?? []), ...items] } }),
      clearSlot: (slot, day = todayKey()) =>
        set({ logs: { ...get().logs, [day]: (get().logs[day] ?? []).filter((l) => l.slot !== slot) } }),
      setWater: (glasses, day = todayKey()) => set({ water: { ...get().water, [day]: Math.max(0, Math.min(8, glasses)) } }),
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
      }),
      onRehydrateStorage: () => () => useApp.setState({ hydrated: true }),
    },
  ),
);
