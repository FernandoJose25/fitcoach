/** Cómo se compran los ingredientes de las recetas: sección del mercado, unidades y peso en seco. */

export type Aisle = 'verduras' | 'frutas' | 'carnes' | 'lacteos' | 'menestras' | 'granos' | 'despensa';

/** Secciones en el orden en que se recorre la lista. */
export const AISLES: ReadonlyArray<readonly [Aisle, string]> = [
  ['verduras', 'Verduras'],
  ['frutas', 'Frutas'],
  ['carnes', 'Carnes, aves y pescados'],
  ['lacteos', 'Huevos y lácteos'],
  ['menestras', 'Menestras y soya'],
  ['granos', 'Granos, panes y tubérculos'],
  ['despensa', 'Despensa'],
];

export const FRUITS = new Set(['platano', 'manzana', 'palta', 'fresa', 'papaya', 'pina', 'mango', 'arandano', 'limon']);

/** Secciones que no se deducen del rol y las etiquetas del alimento (ver `aisleOf`). */
export const AISLE_OF: Record<string, Aisle> = {
  lenteja: 'menestras',
  frijol: 'menestras',
  frijol_negro: 'menestras',
  garbanzo: 'menestras',
  pallar: 'menestras',
  habas: 'menestras',
  tarwi: 'menestras',
  leche_soya: 'lacteos',
  leche_almendra: 'lacteos',
  atun: 'despensa',
  sardina: 'despensa',
  whey: 'despensa',
  pasas: 'despensa',
};

/** Se compran por unidad: gramos (comestibles) por unidad y cómo se cuentan. */
export const PIECES: Record<string, [number, string, string]> = {
  huevo: [50, 'unidad', 'unidades'],
  huevo_codorniz: [10, 'unidad', 'unidades'],
  platano: [100, 'unidad', 'unidades'],
  manzana: [150, 'unidad', 'unidades'],
  palta: [150, 'unidad', 'unidades'],
  mango: [250, 'unidad', 'unidades'],
  limon: [25, 'unidad', 'unidades'],
  tomate: [120, 'unidad', 'unidades'],
  cebolla: [150, 'unidad', 'unidades'],
  pimiento: [150, 'unidad', 'unidades'],
  pepino: [200, 'unidad', 'unidades'],
  zapallito: [200, 'unidad', 'unidades'],
  zanahoria: [80, 'unidad', 'unidades'],
  aji_amarillo: [40, 'unidad', 'unidades'],
  lechuga: [300, 'unidad', 'unidades'],
  broc: [300, 'unidad', 'unidades'],
  choclo: [150, 'unidad', 'unidades'],
  papa: [150, 'unidad', 'unidades'],
  papa_amarilla: [100, 'unidad', 'unidades'],
  camote: [250, 'unidad', 'unidades'],
  pan_frances: [35, 'unidad', 'unidades'],
  pan: [30, 'tajada', 'tajadas'],
  pan_molde: [27, 'tajada', 'tajadas'],
  tortilla_maiz: [30, 'unidad', 'unidades'],
  tortilla_trigo: [45, 'unidad', 'unidades'],
  galleta_arroz: [9, 'unidad', 'unidades'],
  tostada: [10, 'unidad', 'unidades'],
  whey: [30, 'scoop', 'scoops'],
};

/** Variantes que se compran como otro ingrediente: [ingrediente que se compra, gramos de esta variante por unidad]. */
export const SAME_AS: Record<string, [string, number]> = {
  huevo_duro: ['huevo', 50],
  huevo_frito: ['huevo', 50],
  clara: ['huevo', 33],
};

/** Granos y menestras de las recetas van cocidos; se compran secos: gramos secos por gramo cocido. */
export const DRY: Record<string, number> = {
  arroz: 0.36,
  arroz_integral: 0.34,
  quinua: 0.33,
  lenteja: 0.33,
  frijol: 0.37,
  frijol_negro: 0.39,
  garbanzo: 0.45,
  pallar: 0.34,
  fideo: 0.43,
  fideo_integral: 0.43,
  fideo_arroz: 0.3,
  cuscus: 0.3,
};

/** Se compran por volumen (ml ≈ g). */
export const LIQUIDS = new Set(['leche', 'leche_desc', 'leche_soya', 'leche_almendra', 'aceite']);

/** Nombre en la lista cuando el del catálogo describe el plato y no lo que se compra. */
export const BUY_NAME: Record<string, string> = {
  ensal: 'Verduras para ensalada',
  papa: 'Papa',
  papa_amarilla: 'Papa amarilla',
  arroz: 'Arroz',
  arroz_integral: 'Arroz integral',
  frijol: 'Frijol canario',
  frijol_negro: 'Frijoles negros',
  garbanzo: 'Garbanzos',
  pallar: 'Pallares',
  habas: 'Habas',
  tarwi: 'Tarwi (chocho)',
  choclo: 'Choclo',
  mote: 'Mote',
  yuca: 'Yuca',
  olluco: 'Olluco',
  fideo_integral: 'Fideos integrales',
  fideo_arroz: 'Fideos de arroz',
  cuscus: 'Cuscús',
};
