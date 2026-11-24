import type { Food } from '../types';
import { BASE_FOODS } from './foods';
import { AKA, EXTRA_FOODS } from './foods-extra';
import { PRODUCTS } from './products';

const NAMED: Record<string, Food> = Object.fromEntries(Object.entries(BASE_FOODS).map(([id, f]) => [id, AKA[id] ? { ...f, aka: AKA[id] } : f]));

/** Catálogo completo: alimentos, platos y bebidas, más los productos envasados de Perú (ids `pe_…`). */
export const FOODS: Record<string, Food> = { ...NAMED, ...EXTRA_FOODS, ...PRODUCTS };
