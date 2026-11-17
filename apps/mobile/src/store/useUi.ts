import { create } from 'zustand';

interface UiState {
  toast: string | null;
  burst: number;
  showToast: (text: string) => void;
  confetti: () => void;
}

let timer: ReturnType<typeof setTimeout> | null = null;

export const useUi = create<UiState>()((set, get) => ({
  toast: null,
  burst: 0,
  showToast: (text) => {
    if (timer) clearTimeout(timer);
    set({ toast: text });
    timer = setTimeout(() => set({ toast: null }), 1800);
  },
  confetti: () => set({ burst: get().burst + 1 }),
}));
