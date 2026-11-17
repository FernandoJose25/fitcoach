import type { Food } from '../types';

/** id: [emoji, nombre, kcal, P, C, G, rol, etiqueta]. Valores por 100 g (sección 11.1). */
type Row = [string, string, number, number, number, number, Food['role'], string?];

const ROWS: Record<string, Row> = {
  pollo: ['🍗', 'Pechuga de pollo', 165, 31, 0, 3.6, 'P', 'pollo'],
  huevo: ['🥚', 'Huevos', 143, 13, 1, 10, 'P', 'huevo'],
  res: ['🥩', 'Lomo de res', 190, 26, 0, 9, 'P', 'res'],
  atun: ['🐟', 'Atún en agua', 116, 26, 0, 1, 'P', 'pescado'],
  trucha: ['🐟', 'Trucha', 148, 21, 0, 7, 'P', 'pescado'],
  camaron: ['🍤', 'Camarones', 99, 24, 0, 0.3, 'P', 'mariscos'],
  cerdo: ['🥓', 'Lomo de cerdo', 143, 21, 0, 6, 'P', 'cerdo'],
  yogur: ['🥛', 'Yogur griego', 97, 9, 4, 5, 'P', 'lacteos'],
  queso: ['🧀', 'Queso fresco', 264, 18, 3, 20, 'P', 'lacteos'],
  tofu: ['🧈', 'Tofu', 76, 8, 2, 5, 'P', 'soya'],
  lenteja: ['🫘', 'Lentejas', 116, 9, 20, 0.4, 'P'],
  leche: ['🥛', 'Leche', 61, 3.2, 4.8, 3.3, 'P', 'lacteos'],
  jamon: ['🥪', 'Jamón de pavo', 104, 17, 2, 3, 'P', 'pavo'],
  arroz: ['🍚', 'Arroz', 130, 2.7, 28, 0.3, 'C'],
  papa: ['🥔', 'Papa sancochada', 87, 1.9, 20, 0.1, 'C'],
  camote: ['🍠', 'Camote', 90, 2, 21, 0.1, 'C'],
  quinua: ['🌾', 'Quinua', 120, 4.4, 21, 1.9, 'C'],
  avena: ['🥣', 'Avena', 389, 17, 66, 7, 'C', 'gluten'],
  pan: ['🍞', 'Pan integral', 247, 13, 41, 3.4, 'C', 'gluten'],
  fideo: ['🍝', 'Fideos', 158, 5.8, 31, 0.9, 'C', 'gluten'],
  yuca: ['🥔', 'Yuca', 160, 1.4, 38, 0.3, 'C'],
  platano: ['🍌', 'Plátano', 89, 1.1, 23, 0.3, 'C'],
  ensal: ['🥗', 'Ensalada', 20, 1.2, 3.5, 0.2, 'V'],
  broc: ['🥦', 'Brócoli', 34, 2.8, 7, 0.4, 'V', 'brocoli'],
  tomate: ['🍅', 'Tomate', 18, 0.9, 3.9, 0.2, 'V'],
  manzana: ['🍎', 'Manzana', 52, 0.3, 14, 0.2, 'V'],
  palta: ['🥑', 'Palta', 160, 2, 9, 15, 'F'],
  mani: ['🥜', 'Maní', 567, 26, 16, 49, 'F', 'mani'],
  pbut: ['🥜', 'Mantequilla de maní', 588, 25, 20, 50, 'F', 'mani'],
  almendra: ['🌰', 'Almendras', 579, 21, 22, 50, 'F', 'frutos'],
  aceite: ['🫒', 'Aceite de oliva', 884, 0, 0, 100, 'F'],
};

export const FOODS: Record<string, Food> = Object.fromEntries(
  Object.entries(ROWS).map(([id, [emoji, name, kcal, p, c, f, role, tag]]) => [
    id,
    { id, emoji, name, kcal, p, c, f, role, ...(tag ? { tag } : {}) },
  ]),
);
