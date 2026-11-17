import type { SlotType } from './types';

/** Reparto de kcal y proteína por número de comidas: [etiqueta, tipo, proporción]. */
export const SPLITS: Record<3 | 4 | 5, ReadonlyArray<readonly [string, SlotType, number]>> = {
  3: [
    ['Desayuno', 'D', 0.28],
    ['Almuerzo', 'A', 0.4],
    ['Cena', 'C', 0.32],
  ],
  4: [
    ['Desayuno', 'D', 0.26],
    ['Almuerzo', 'A', 0.36],
    ['Snack', 'S', 0.1],
    ['Cena', 'C', 0.28],
  ],
  5: [
    ['Desayuno', 'D', 0.22],
    ['Colación', 'S', 0.1],
    ['Almuerzo', 'A', 0.32],
    ['Merienda', 'S', 0.1],
    ['Cena', 'C', 0.26],
  ],
};
