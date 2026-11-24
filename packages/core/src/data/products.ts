import type { Food } from '../types';

/**
 * Productos envasados que se venden en Perú: gaseosas y bebidas, galletas, golosinas y snacks.
 * id (se guarda como `pe_<id>`): [emoji, nombre, kcal, P, C, G, porción en g/ml, porción, códigos de barras, etiquetas].
 * Valores por 100 g (o 100 ml en bebidas). Los que tienen código salen de la etiqueta registrada en
 * Open Food Facts (ODbL); los demás, de la etiqueta típica del producto. Rol M: solo registro, no entran
 * en recetas. El código de barras se resuelve aquí primero, sin internet.
 */
type Row = [string, string, number, number, number, number, number, string, string?, string?];

// ── Gaseosas y bebidas (por 100 ml) ──
const DRINKS: Record<string, Row> = {
  inca_kola: ['🥤', 'Inca Kola', 19, 0, 4.3, 0, 500, '1 botella (500 ml)', '7750182006088 7750236173896 7750182001243 7750236000246 7750182006194'],
  inca_kola_zero: ['🥤', 'Inca Kola sin azúcar', 0, 0, 0, 0, 500, '1 botella (500 ml)', '7750182001809'],
  coca_cola: ['🥤', 'Coca-Cola sabor original', 42, 0, 10.6, 0, 500, '1 botella (500 ml)', '7750182006095 7750182155656 7750182003827 7750182000703 7750182000796 7750182544085'],
  coca_cola_zero: ['🥤', 'Coca-Cola sin azúcar', 0, 0, 0, 0, 500, '1 botella (500 ml)', '7750182000697 7801610350652'],
  sprite: ['🥤', 'Sprite', 0, 0, 0, 0, 500, '1 botella (500 ml)', '7750182187848 7750182000321'],
  fanta_kola: ['🥤', 'Fanta Kola Inglesa', 20, 0, 5, 0, 500, '1 botella (500 ml)', '7750182002363'],
  fanta_naranja: ['🥤', 'Fanta naranja', 25, 0, 6.2, 0, 500, '1 botella (500 ml)'],
  guarana: ['🥤', 'Guaraná Backus', 19, 0, 4.8, 0, 450, '1 botella (450 ml)', '7753749003186'],
  big_cola: ['🥤', 'Big Cola', 48, 0, 11.8, 0, 400, '1 botella (400 ml)', '7750670014250'],
  oro: ['🥤', 'Gaseosa Oro', 47, 0, 11.7, 0, 500, '1 botella (500 ml)', '7750670013437'],
  kola_real: ['🥤', 'Kola Real', 44, 0, 11, 0, 500, '1 botella (500 ml)'],
  pepsi: ['🥤', 'Pepsi', 44, 0, 11, 0, 500, '1 botella (500 ml)'],
  seven_up: ['🥤', '7 Up', 40, 0, 10, 0, 500, '1 botella (500 ml)'],
  concordia: ['🥤', 'Concordia (piña o fresa)', 45, 0, 11.3, 0, 500, '1 botella (500 ml)'],
  frugos: ['🧃', 'Frugos del Valle durazno', 40, 0.2, 9.8, 0, 235, '1 caja (235 ml)'],
  pulp: ['🧃', 'Pulp durazno', 48, 0.2, 11.8, 0, 315, '1 botella (315 ml)'],
  cifrut: ['🧃', 'Cifrut', 30, 0, 7.4, 0, 500, '1 botella (500 ml)'],
  sporade: ['🥤', 'Sporade', 9, 0, 2.2, 0, 500, '1 botella (500 ml)', '7750670010238'],
  gatorade: ['🥤', 'Gatorade', 24, 0, 6, 0, 500, '1 botella (500 ml)'],
  volt: ['⚡', 'Volt (energizante)', 45, 0, 11.2, 0, 300, '1 botella (300 ml)'],
  red_bull: ['⚡', 'Red Bull', 45, 0, 11, 0, 250, '1 lata (250 ml)'],
  agua: ['💧', 'Agua San Luis / Cielo', 0, 0, 0, 0, 625, '1 botella (625 ml)'],
  yogurt_gloria: ['🥛', 'Yogurt Gloria fresa', 90, 2.8, 15, 2.2, 180, '1 botella chica (180 g)', undefined, 'lacteos'],
};

// ── Galletas (por 100 g) ──
const COOKIES: Record<string, Row> = {
  soda_field: ['🍘', 'Galletas Soda Field', 403, 7.8, 75, 7.8, 32, '1 paquete (32 g)', '7622201714826', 'gluten'],
  soda_san_jorge: ['🍘', 'Galletas Soda San Jorge', 437, 8, 75, 12, 40, '1 paquete (40 g)', '7750106000277 7750106003094', 'gluten'],
  casino_menta: ['🍪', 'Casino sabor menta', 488, 4.7, 70, 21, 43, '1 paquete (43 g)', undefined, 'gluten'],
  casino_chocolate: ['🍪', 'Casino sabor chocolate', 488, 4.7, 72, 21, 43, '1 paquete (43 g)', '7750243052665', 'gluten'],
  casino_vainilla: ['🍪', 'Casino sabor vainilla', 488, 4.7, 67.4, 21, 43, '1 paquete (43 g)', '7750243052641', 'gluten'],
  casino_fresa: ['🍪', 'Casino sabor fresa', 488, 4.7, 70, 21, 43, '1 paquete (43 g)', '7750243052740', 'gluten'],
  casino_alfajor: ['🍪', 'Casino alfajor', 480, 4.5, 70, 20, 43, '1 paquete (43 g)', undefined, 'gluten'],
  casino_banada: ['🍪', 'Casino bañada', 513, 7.7, 64.1, 25.6, 39, '1 paquete (39 g)', '7750243061605 7750243061612', 'gluten,lacteos'],
  oreo: ['🍪', 'Oreo', 472, 4.2, 69.4, 19.4, 36, '4 galletas (36 g)', '7590011251100 7750168001953 7622201383589', 'gluten'],
  club_social: ['🍘', 'Club Social original', 458, 8.3, 70.8, 16.7, 24, '1 paquete (24 g)', '7622201717537 7622201717544', 'gluten'],
  club_social_integral: ['🍘', 'Club Social integral', 423, 7.7, 65.4, 15.4, 26, '1 paquete (26 g)', '7750168001694 7750168001687', 'gluten'],
  ritz: ['🍘', 'Ritz sabor queso', 484, 6.7, 59, 25, 30, '4 galletas (30 g)', '7622201390013 7622300124526', 'gluten,lacteos'],
  chokosoda: ['🍪', 'Choco Soda Field', 500, 4.2, 69.4, 22.2, 36, '1 paquete (36 g)', '7622210675569', 'gluten'],
  dona_pepa: ['🍪', 'Doña Pepa', 461, 4.3, 78, 13, 23, '1 unidad (23 g)', '7622300095888', 'gluten'],
  hony_bran: ['🍪', 'Hony Bran', 424, 6.1, 75.8, 12.1, 33, '1 paquete (33 g)', '7622300117207', 'gluten'],
  chips_ahoy: ['🍪', 'Chips Ahoy!', 467, 4.4, 68.9, 20, 45, '1 paquete (45 g)', '7750168214292', 'gluten'],
  morochas: ['🍪', 'Morochas', 480, 5, 66, 22, 32, '1 paquete (32 g)', '7613036335942', 'gluten'],
  sublime_galleta: ['🍪', 'Galleta Sublime', 560, 10.1, 49.4, 35.8, 46, '4 galletas (46 g)', '7778606000764', 'gluten,mani,lacteos'],
  tentacion: ['🍪', 'Tentación chocolate (Field)', 480, 5, 70, 20, 36, '1 paquete (36 g)', undefined, 'gluten'],
  glacitas: ['🍪', 'Glacitas (Field)', 470, 5, 70, 19, 30, '1 paquete (30 g)', undefined, 'gluten'],
  vainilla_field: ['🍪', 'Vainilla Field', 440, 6.5, 75, 12.5, 40, '1 paquete (40 g)', undefined, 'gluten'],
  animalitos: ['🍪', 'Animalitos Field', 440, 6.5, 74, 13, 32, '1 paquete (32 g)', undefined, 'gluten'],
  margarita: ['🍪', 'Margarita (Nestlé)', 450, 6, 72, 15, 40, '1 paquete (40 g)', undefined, 'gluten'],
  cua_cua: ['🍫', 'Cua Cua (Field)', 520, 5, 62, 28, 22, '1 unidad (22 g)', undefined, 'gluten,lacteos'],
  gran_cereal: ['🍪', 'Gran Cereal clásica (Costa)', 437, 7.8, 64.4, 17.8, 30, '3 galletas (30 g)', '7802215302053 7750885003995', 'gluten'],
  gran_cereal_cacao: ['🍪', 'Gran Cereal cacao (Costa)', 446, 7.4, 63.6, 18, 36, '1 paquete (36 g)', '7802215303241 7750885020923', 'gluten'],
  frac: ['🍪', 'Frac clásica (Costa)', 487, 6, 70, 20.3, 45.5, '1 paquete (45,5 g)', '7750885012904 7750885001458', 'gluten'],
  frac_chocolate: ['🍪', 'Frac chocolate (Costa)', 483, 6.3, 70, 19.3, 45.5, '1 paquete (45,5 g)', '7750885012881', 'gluten'],
  frac_vainilla: ['🍪', 'Frac vainilla (Costa)', 490, 6.3, 70, 20.3, 45.5, '1 paquete (45,5 g)', '7750885012928', 'gluten'],
  frac_menta: ['🍪', 'Frac menta (Costa)', 485, 5.6, 67.3, 21.5, 41, '1 paquete (41 g)', '7750885021203', 'gluten'],
  gretel: ['🍪', 'Gretel chocolate (Costa)', 525, 5, 67.2, 26.3, 30, '4 galletas (30 g)', '7802215515019', 'gluten'],
  agua_line: ['🍘', 'Agua Line (Costa)', 408, 8.2, 82.5, 5.1, 44, '1 paquete (44 g)', '7750885015363 7750885019620 7750885015356', 'gluten'],
  costa_integrales: ['🍘', 'Galletas integrales (Costa)', 442, 10.1, 72.8, 12.3, 30, '1 paquete (30 g)', '7750885002721', 'gluten'],
  costa_chips: ['🍪', 'Costa Chips con chispas de chocolate', 483, 4.3, 67.3, 21.8, 30, '3 galletas (30 g)', '7802215505058', 'gluten'],
  nik: ['🍪', 'Nik fresa (Costa)', 524, 3, 69.6, 25.9, 27, '1 paquete (27 g)', '7750885019873', 'gluten'],
  doblon: ['🍪', 'Doblón (Costa)', 500, 7.1, 71.4, 21.4, 16, '1 unidad (16 g)', '7750885006972', 'gluten'],
  obsesion: ['🍪', 'Obsesión (Costa)', 519, 3.7, 70.4, 22.2, 27, '1 paquete (27 g)', '7802215514333', 'gluten'],
  rellenitas: ['🍪', 'Rellenitas (GN)', 500, 5.6, 72.2, 19.4, 36, '1 paquete (36 g)', '7750106002592 7750106002622', 'gluten'],
  picaras: ['🍪', "Picaras (Winter's)", 500, 6, 67, 22, 40, '1 paquete (40 g)', '7752748005924 7752748005795', 'gluten'],
  chomp: ['🍪', 'Chomp (Victoria)', 490, 5, 66, 23, 38, '1 paquete (38 g)', '7750243058247', 'gluten'],
  bells: ['🍘', "Galletas saladitas Bell's", 478, 6.5, 71.7, 17.4, 46, '1 paquete (46 g)', '7750020541177', 'gluten'],
  union_kiwicha: ['🍘', 'Galletas integrales con kiwicha (Unión)', 467, 9, 70.5, 16.5, 30, '1 porción (30 g)', '7752056001625', 'gluten'],
  wafer: ["🧇", "Wafer de chocolate (Mabel's)", 494, 6.9, 69, 21, 28, '1 paquete (28 g)', '7773401006935 7773401006850 7773401006973 7773401006959', 'gluten'],
};

// ── Golosinas y chocolates (por 100 g) ──
const SWEETS: Record<string, Row> = {
  sublime: ['🍫', 'Sublime clásico', 537, 10, 50, 33, 30, '1 barra (30 g)', '8445290419484', 'mani,lacteos'],
  sublime_blanco: ['🍫', 'Sublime blanco', 566, 9.9, 51.6, 35.6, 38, '1 barra (38 g)', '8445290323392', 'mani,lacteos'],
  sublime_stick: ['🍫', 'Sublime stick', 540, 7.9, 52.9, 32.9, 14, '1 stick (14 g)', '7613036220149', 'mani,lacteos'],
  princesa: ['🍫', 'Princesa (Nestlé)', 516, 6, 60, 28, 30, '1 barra (30 g)', undefined, 'gluten,lacteos'],
  triangulo: ['🍫', 'Triángulo (D’Onofrio)', 540, 8, 55, 32, 30, '1 barra (30 g)', undefined, 'mani,lacteos'],
  chocman: ['🍫', 'Chocman (Costa)', 455, 4.5, 63, 20.5, 28, '1 unidad (28 g)', '7750885021128', 'gluten,lacteos'],
  golazo: ['🍫', 'Golazo (Ambrosoli)', 528, 3.6, 62.8, 29.2, 25, '1 unidad (25 g)', '7750885008389 7750885022989', 'lacteos'],
  vizzio: ['🍫', 'Vizzio (Costa)', 545, 10, 55, 32, 25, '1 porción (25 g)', '7750885011921 7750885017213', 'frutos,lacteos'],
  milky: ['🍫', 'Milky (La Ibérica)', 540, 10, 55, 30, 20, '1 barra (20 g)', '7750060001204 7750060000863', 'lacteos'],
  kit_kat: ['🍫', 'Kit Kat', 518, 6.5, 62, 27, 41.5, '1 barra (41,5 g)', undefined, 'gluten,lacteos'],
  snickers: ['🍫', 'Snickers', 488, 7.5, 60, 24, 50, '1 barra (50 g)', undefined, 'mani,lacteos'],
  m_and_ms: ['🍬', "M&M's de chocolate", 492, 4.4, 70, 21, 45, '1 bolsa (45 g)', undefined, 'lacteos'],
  bon_o_bon: ['🍫', 'Bon o Bon', 538, 8.9, 49, 34, 16, '1 bombón (16 g)', '7790580106959', 'mani,lacteos'],
  sapito: ['🍫', 'Sapito (Arcor)', 522, 5, 61.1, 28.9, 9, '1 unidad (9 g)', '7757174012478 7757174010573', 'lacteos'],
  golpe: ['🍫', 'Golpe (Arcor)', 504, 3.7, 70.4, 24.1, 27, '1 unidad (27 g)', '7757174002240', 'gluten'],
  cofler_block: ['🍫', 'Cofler Block maní', 572, 18, 31, 42, 40, '1 barra (40 g)', '7790580110284', 'mani,lacteos'],
  chocoteja: ['🍫', 'Chocoteja de pecanas', 480, 5, 60, 25, 25, '1 chocoteja (25 g)', undefined, 'frutos,lacteos'],
  king_kong: ['🍰', 'King Kong de manjar blanco', 400, 6, 65, 13, 50, '1 porción (50 g)', undefined, 'gluten,lacteos,huevo'],
  turron_mani: ['🥜', 'Turrón de maní', 426, 8.8, 73, 7.9, 25, '1 unidad (25 g)', '77940131 77940148', 'mani'],
  ambrosia: ['🍬', 'Caramelos Ambrosía', 383, 0.6, 95, 0, 32, '1 bolsa (32 g)', '7750885007757'],
  flipy: ['🍬', 'Gomitas Flipy', 350, 7.6, 78.8, 0.4, 25, '1 bolsa (25 g)', '7750885009478'],
  mogul: ['🍬', 'Gomitas Mogul', 325, 6, 75, 0, 30, '1 bolsa (30 g)', '7790580116958 7790580116965 7790580117047 7790580169312 7790580323721 7790580200107'],
  frunas: ['🍬', 'Frunas', 396, 0, 90, 4, 20, '1 tira (20 g)'],
  halls: ['🍬', 'Halls', 390, 0, 97, 0, 2.8, '1 caramelo (2,8 g)', '7622210427045 7622201776459'],
  chupetin: ['🍭', 'Chupetín', 390, 0, 97, 0, 10, '1 chupetín (10 g)'],
  marshmallows: ['🍡', 'Marshmallows (bombones)', 320, 2, 80, 0, 20, '4 unidades (20 g)'],
  helado_princesa: ['🍨', 'Helado Princesa (Nestlé)', 219, 4.2, 23.7, 11.9, 80, '1 bola (80 g)', '8445291078734', 'lacteos,gluten'],
};

// ── Snacks salados (por 100 g) ──
const SNACKS: Record<string, Row> = {
  lays: ['🥔', "Papas Lay's clásicas", 520, 5, 59, 29, 42, '1 bolsa personal (42 g)', '7752025006880 7758574003646'],
  doritos: ['🔺', 'Doritos queso atrevido', 510, 6, 58, 28, 42, '1 bolsa personal (42 g)', '7752025004763', 'lacteos'],
  cheetos: ['🧀', 'Cheetos horneados', 479, 5.9, 67.6, 20.6, 40, '1 bolsa personal (40 g)', '7758574004070', 'lacteos'],
  cuates: ['🌶️', 'Cuates picantes', 538, 7, 51, 34, 42, '1 bolsa (42 g)', '7758574003882'],
  piqueo_snax: ['🥨', 'Piqueo Snax', 531, 6, 57, 31, 45, '1 bolsa (45 g)', undefined, 'mani'],
  chizitos: ['🧀', 'Chizitos', 526, 6, 58, 30, 34, '1 bolsa (34 g)', undefined, 'lacteos'],
  tortees: ['🔺', 'Tortees picantes', 507, 6, 60, 27, 40, '1 bolsa (40 g)'],
  inka_chips: ['🥔', 'Inka Chips sal de mar', 509, 5.2, 59.1, 28, 28, '1 porción (28 g)', '7750526002745 7750526000895'],
  pringles: ['🥔', 'Pringles original', 536, 4.5, 51, 35, 30, '1 porción (30 g)'],
  stax: ['🥔', "Lay's Stax queso cheddar", 516, 6, 60, 28, 25, '1 porción (25 g)', '7501011178854', 'lacteos'],
  karinto_mani: ['🥜', 'Maní crocante Karinto', 531, 18, 45, 31, 30, '1 porción (30 g)', '7752025006484', 'mani,gluten'],
  karinto_habas: ['🫘', 'Habas saladas Karinto', 453, 25, 50, 17, 40, '1 bolsa (40 g)'],
  canchita: ['🌽', 'Canchita salada', 445, 8, 65, 17, 30, '1 puñado (30 g)'],
};

/** Categorías para explorar en Registrar; `kw` son palabras extra de búsqueda ("galleta" encuentra Oreo). */
export const PRODUCT_GROUPS = [
  { label: 'Gaseosas y bebidas', kw: 'gaseosa refresco bebida', rows: DRINKS },
  { label: 'Galletas', kw: 'galleta galletas', rows: COOKIES },
  { label: 'Golosinas', kw: 'golosina golosinas dulce', rows: SWEETS },
  { label: 'Snacks', kw: 'snack piqueo bocadito', rows: SNACKS },
].map((g) => ({ label: g.label, kw: g.kw, ids: Object.keys(g.rows).map((k) => `pe_${k}`) }));

const ROWS = Object.fromEntries(
  [DRINKS, COOKIES, SWEETS, SNACKS].flatMap((rows, i) => Object.entries(rows).map(([k, r]) => [k, { r, kw: PRODUCT_GROUPS[i].kw }])),
);

/** Productos envasados como `Food` (ids `pe_…`), con su porción. */
export const PRODUCTS: Record<string, Food> = Object.fromEntries(
  Object.entries(ROWS).map(([k, { r: [emoji, name, kcal, p, c, f, g, label, , tag], kw }]) => [
    `pe_${k}`,
    { id: `pe_${k}`, emoji, name, kcal, p, c, f, role: 'M', serving: { g, label }, kw, ...(tag ? { tag } : {}) } satisfies Food,
  ]),
);

/** Código de barras → id del producto. */
export const PRODUCT_BY_BARCODE: Record<string, string> = Object.fromEntries(
  Object.entries(ROWS).flatMap(([k, { r }]) => (r[8] ?? '').split(/\s+/).filter(Boolean).map((code) => [code, `pe_${k}`])),
);
