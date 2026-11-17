import { useColorScheme } from 'react-native';
import { useApp } from '@/store/useApp';

/**
 * Dirección visual: "instrumento de precisión". Carbón + hueso, un único acento
 * bermellón como señal, macros en tonos minerales (latón / acero), filetes finos.
 */
export const palette = {
  dark: {
    bg: '#0C0C0B',
    card: '#151513',
    ink: '#EDE9E1',
    mut: '#8C887F',
    line: '#262520',
    acc: '#FF5A2E',
    on: '#0C0C0B',
    p: '#FF5A2E',
    c: '#D6B26E',
    f: '#8EA4B9',
    hero: '#1A1512',
    water: '#2B4456',
    rest: '#8EA4B9',
  },
  light: {
    bg: '#F1EEE7',
    card: '#FAF8F3',
    ink: '#151513',
    mut: '#6B675E',
    line: '#DCD7CB',
    acc: '#E0461C',
    on: '#FFFFFF',
    p: '#E0461C',
    c: '#A57A23',
    f: '#4D6C8A',
    hero: '#F6E6DC',
    water: '#C7D8E4',
    rest: '#3E6585',
  },
} as const;

export type Scheme = keyof typeof palette;
export type Palette = (typeof palette)[Scheme];

export const radius = { card: 14, btn: 10, chip: 8 } as const;
export const spring = { damping: 16, stiffness: 260, mass: 0.6 } as const; // rebote contenido, sin "gomitas"
export const ease = { out: [0.22, 1, 0.36, 1] as const }; // curva de entradas

export const fonts = {
  title: 'BarlowCondensed_700Bold',
  titleX: 'BarlowCondensed_800ExtraBold',
  titleS: 'BarlowCondensed_600SemiBold',
  body: 'IBMPlexSans_400Regular',
  med: 'IBMPlexSans_500Medium',
  bold: 'IBMPlexSans_600SemiBold',
  num: 'IBMPlexMono_500Medium',
  numB: 'IBMPlexMono_600SemiBold',
} as const;

/** Escala de los titulares condensados respecto al tamaño nominal (son más estrechos y bajos). */
export const titleScale = 1.22;

/** Color con alfa (hex #RRGGBB + 0–1). */
export const alpha = (hex: string, a: number) =>
  hex +
  Math.round(a * 255)
    .toString(16)
    .padStart(2, '0');

export function useTheme() {
  const sys = useColorScheme();
  const pref = useApp((s) => s.scheme);
  const scheme: Scheme = pref === 'auto' ? (sys === 'light' ? 'light' : 'dark') : pref;
  return { c: palette[scheme], scheme };
}
