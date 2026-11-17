export const palette = {
  dark: {
    bg: '#0B0F14',
    card: '#151A21',
    ink: '#F0F3F6',
    mut: '#8B95A5',
    line: '#232A34',
    acc: '#C8F44D',
    on: '#0B0F14',
    p: '#C8F44D',
    c: '#FFB547',
    f: '#FF7A59',
  },
  light: {
    bg: '#F3F5EF',
    card: '#FFFFFF',
    ink: '#11151B',
    mut: '#5F6B7A',
    line: '#E3E7DD',
    acc: '#1E9E57',
    on: '#FFFFFF',
    p: '#1E9E57',
    c: '#E08A00',
    f: '#E0533A',
  },
} as const;

export type Scheme = keyof typeof palette;
export type Palette = (typeof palette)[Scheme];

export const radius = { card: 24, btn: 18, chip: 16 } as const;
export const spring = { damping: 12, stiffness: 220, mass: 0.6 } as const; // rebote de botones
export const ease = { out: [0.22, 1, 0.36, 1] as const }; // curva de entradas
