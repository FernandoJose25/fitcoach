import type { Food } from '../types';
import { BASE_FOODS } from './foods';
import { PRODUCTS } from './products';

/** Catálogo completo: alimentos y platos más los productos envasados de Perú (ids `pe_…`). */
export const FOODS: Record<string, Food> = { ...BASE_FOODS, ...PRODUCTS };
