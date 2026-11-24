import type { Food } from '../types';

/**
 * Productos envasados que se venden en Perú: bebidas, cereales, galletas, golosinas, snacks, lácteos y despensa.
 * id (se guarda como `pe_<id>`): [emoji, nombre, kcal, P, C, G, porción en g/ml, porción, códigos de barras, etiquetas].
 * Valores por 100 g (o 100 ml en bebidas). Salen de la etiqueta (la publicada por la tienda o la registrada en
 * Open Food Facts, ODbL); si no se encontró, de la etiqueta típica del producto. Rol M: solo registro, no entran
 * en recetas. El código de barras se resuelve aquí primero, sin internet.
 */
type Row = [string, string, number, number, number, number, number, string, string?, string?];

// ── Gaseosas y bebidas (por 100 ml) ──
const DRINKS: Record<string, Row> = {
  inca_kola: ['🥤', 'Inca Kola', 19, 0, 4.3, 0, 500, '1 botella (500 ml)', '7750182006088 7750236173896 7750182001243 7750236000246 7750182006194 7750182003339 7750236330169 0049000009866 7750182007474 7750236016711 7750236156714'],
  inca_kola_zero: ['🥤', 'Inca Kola sin azúcar', 0, 0, 0, 0, 500, '1 botella (500 ml)', '7750182001809 7750182003933 7750182005463 7750182007412 7750182003322'],
  coca_cola: ['🥤', 'Coca-Cola sabor original', 42, 0, 10.6, 0, 500, '1 botella (500 ml)', '7750182006095 7750182155656 7750182003827 7750182000703 7750182000796 7750182544085 7750182001250 7750182001236 7750182155663 7801610001196 0067000010118 7750298002165 7750182102766'],
  coca_cola_zero: ['🥤', 'Coca-Cola sin azúcar', 0, 0, 0, 0, 500, '1 botella (500 ml)', '7750182000697 7801610350652 7750182003919 7750182007139 7750182005456 7801610350355 7750182000857 7750182006200 0736983893987 0049000042566'],
  sprite: ['🥤', 'Sprite', 0, 0, 0, 0, 500, '1 botella (500 ml)', '7750182187848 7750182000321 7750182004466 7750182000222 7801610005194 7750182220361 0049000001327'],
  fanta_kola: ['🥤', 'Fanta Kola Inglesa', 20, 0, 5, 0, 500, '1 botella (500 ml)', '7750182002363 7750182002394 7750182005609'],
  fanta_naranja: ['🥤', 'Fanta naranja', 25, 0, 6.2, 0, 500, '1 botella (500 ml)', '7750182495301 7750182698337 7801610002193 7750182220378 7801610002858'],
  guarana: ['🥤', 'Guaraná Backus', 19, 0, 4.8, 0, 450, '1 botella (450 ml)', '7753749003186 7753749001632 7753749001649 7753749003117 7753749002493 7753749009225'],
  big_cola: ['🥤', 'Big Cola', 23, 0, 5.8, 0, 400, '1 botella (400 ml)', '7750670014250 7750670016193 7750670003520 7750670015882 7750670018142 7750670007047'],
  oro: ['🥤', 'Gaseosa Oro', 47, 0, 11.7, 0, 500, '1 botella (500 ml)', '7750670013437'],
  kola_real: ['🥤', 'Kola Real', 44, 0, 11, 0, 500, '1 botella (500 ml)', '7750670016155 7750670016179 7750670013444 7750670013420 7750670019484 7750670018425 7750670019873 7750670006071 7750670016162 7750670013451'],
  pepsi: ['🥤', 'Pepsi', 44, 0, 11, 0, 500, '1 botella (500 ml)', '7401005914690 7401005914652 7401016716153 7401005914669 7401005914645 7401005914676 7401005904011 7401005914614 7751580000968 7751912101264 7751580000364 7751580000883'],
  seven_up: ['🥤', '7 Up', 40, 0, 10, 0, 500, '1 botella (500 ml)', '7401005917370 7751580000982 7751580001040'],
  concordia: ['🥤', 'Concordia (piña o fresa)', 20, 0, 5, 0, 500, '1 botella (500 ml)', '7401005912849 7401005917363 7758282000951 7401005912863 7401005913037 7751580001026 7751912000109 7401005912979 7758282001026 7751580001019 7751912000130'],
  frugos: ['🧃', 'Frugos del Valle durazno', 40, 0.2, 9.8, 0, 235, '1 caja (235 ml)', '7750182008396 7750182008358 7750182004893 7750182004879 7750182008327 7750182003346 7750236000185'],
  pulp: ['🧃', 'Pulp durazno', 48, 0.2, 11.8, 0, 315, '1 botella (315 ml)', '7750670019293 7750670020800 7750670000758 7750670021173 7750670011839 7750670019095 7750670003186'],
  cifrut: ['🧃', 'Cifrut', 24, 0, 5.8, 0, 500, '1 botella (500 ml)', '7750670018982 7750670017794 7750670018999 7750670014694 7750670017787 7750670004947 7750670004954 7750670003773 7750670014687 7750670003766'],
  sporade: ['🥤', 'Sporade', 21, 0, 5.2, 0, 500, '1 botella (500 ml)', '7750670010238 7750670004329 7750670015370 7750670010177 7750670020206 7750670010221 7750670004442'],
  gatorade: ['🥤', 'Gatorade', 25, 0, 6, 0, 500, '1 botella (500 ml)', '7401005916908 7751655001494 7751655000602 7751655000671 7751655001357 7751655000596 7751655001371 7751655001364 7401005917189 7751655001333 7751655001388 7751655001326 7751655000633 7751655001395 7751655000664'],
  volt: ['⚡', 'Volt (energizante)', 45, 0, 11.2, 0, 300, '1 botella (300 ml)', '7750670021654 7750670021661 7750670021678 7750670021722 7750670021692 7750670021739 7750670022088 7750670019279 7750670012300 7750670016896 7750670020886'],
  red_bull: ['⚡', 'Red Bull', 45, 0, 11, 0, 250, '1 lata (250 ml)', '9002490266325 9002490100070 9002490223076 9002490223205 9002490100094 9002490232627'],
  agua: ['💧', 'Agua San Luis / Cielo', 0, 0, 0, 0, 625, '1 botella (625 ml)', '7750182005685 7750182007269 7750182008938 7750298000710 7750182001199 7750182001229 7750182000925 7755064072656 7750670009454 7750670000734 7750670313537 7750670009041 7750670336901 7750670244954 7751731001042 7751731156247'],
  yogurt_gloria: ['🥛', 'Yogurt Gloria bebible', 69, 2.9, 9.9, 2, 180, '1 botella chica (180 g)', '7751271033329 7751271033343 7751271030403 7751271030427 7751271030434 7751271030335 7751271012263 7751271031837 7751271037488 7751271149761 7751271037495', 'lacteos'],
  powerade: ['🥤', 'Powerade', 22, 0, 5.6, 0, 600, '1 botella (600 ml)', '7750182004428 7750182007818 7750182004626 7750182004435 7750182008778 7750182004640 7750182009010 7750182008808 7750182008815 7750182009027 7750182009041'],
  electrolight: ['🥤', 'Electrolight', 24, 0, 6, 0, 475, '1 botella (475 ml)', '7759307018548 7759307005234 8001200111192 7759307005210 7759307005197 7759307005241 7759307011563 7759307017688 7759307017718 7759307017602 7759307018555'],
  aquarius: ['🧃', 'Aquarius', 20, 0, 5, 0, 500, '1 botella (500 ml)'],
  frugos_fresh: ['🧃', 'Frugos Fresh', 19, 0, 4.8, 0, 500, '1 botella (500 ml)', '7750182007290 7750182006521 7750182008099 7750182007108 7750182007092 7750182005982 7750182007283'],
  free_tea: ['🥤', 'Free Tea té verde limón', 19, 0, 4.8, 0, 500, '1 botella (500 ml)', '7750670013475 7750670012164 7750670012171'],
  free_tea_rojos: ['🥤', 'Free Tea té negro frutos rojos', 23, 0, 5.8, 0, 500, '1 botella (500 ml)', '7750670012485'],
  chicha_gloria: ['🍇', 'Chicha morada Gloria', 33, 0, 8.3, 0, 400, '1 botella (400 ml)', '7751271014496 7751271013444'],
  chicha_naturale: ['🍇', 'Chicha morada Naturale', 40, 0.1, 10, 0, 500, '1 botella (500 ml)', '7750096000103 7750096000233 7750096000196 7750096000028 7750096000554 7750096000431 7750096000097'],
  volt_zero: ['⚡', 'Volt sin azúcar', 0, 0, 0, 0, 300, '1 botella (300 ml)', '7750670020657 7750670020640 7750670016926 7750670021708'],
  red_bull_zero: ['⚡', 'Red Bull sin azúcar', 2, 0, 0.4, 0, 250, '1 lata (250 ml)', '9002490206710 9002490306595 9002490206635'],
  monster: ['⚡', 'Monster Energy', 46, 0, 11.7, 0, 473, '1 lata (473 ml)', '0070847010517 0070847010500'],
  guarana_zero: ['🥤', 'Guaraná Backus sin azúcar', 0, 0, 0, 0, 450, '1 botella (450 ml)', '7753749009355'],
  crush: ['🥤', 'Crush naranja', 19, 0, 4.8, 0, 500, '1 botella (500 ml)', '7750182003247 7750236495318 0078000009125 0078000009118 7750182000567 0078000091205'],
  bio_amayu: ['🧃', 'Bio Amayu aguaymanto', 34, 0.2, 7.9, 0.1, 300, '1 botella (300 ml)', '7750670016421'],
  agua_sabor: ['💧', 'Agua saborizada sin azúcar (San Carlos, San Luis)', 0, 0, 0, 0, 600, '1 botella (600 ml)', '7750182007757 7750182007764 7750182008730 7750182008761 7750182006958 7750182007962 7401005916847 7401005916854'],
};

// ── Galletas (por 100 g) ──
const COOKIES: Record<string, Row> = {
  soda_field: ['🍘', 'Galletas Soda Field', 403, 7.8, 75, 7.8, 32, '1 paquete (32 g)', '7622201714826', 'gluten'],
  soda_san_jorge: ['🍘', 'Galletas Soda San Jorge', 437, 8, 75, 12, 40, '1 paquete (40 g)', '7750106000277 7750106003094', 'gluten'],
  casino_menta: ['🍪', 'Casino sabor menta', 488, 4.7, 70, 21, 43, '1 paquete (43 g)', undefined, 'gluten'],
  casino_chocolate: ['🍪', 'Casino sabor chocolate', 488, 4.7, 72, 21, 43, '1 paquete (43 g)', '7750243052665', 'gluten'],
  casino_vainilla: ['🍪', 'Casino sabor vainilla', 488, 4.7, 67.4, 21, 43, '1 paquete (43 g)', '7750243052641', 'gluten'],
  casino_fresa: ['🍪', 'Casino sabor fresa', 488, 4.7, 70, 21, 43, '1 paquete (43 g)', '7750243052740 7750243079334', 'gluten'],
  casino_alfajor: ['🍪', 'Casino alfajor', 480, 4.5, 70, 20, 43, '1 paquete (43 g)', undefined, 'gluten'],
  casino_banada: ['🍪', 'Casino bañada', 513, 7.7, 64.1, 25.6, 39, '1 paquete (39 g)', '7750243061605 7750243061612', 'gluten,lacteos'],
  oreo: ['🍪', 'Oreo', 472, 4.2, 69.4, 19.4, 36, '4 galletas (36 g)', '7590011251100 7750168001953 7622201383589 7622202217494 7622202903076', 'gluten'],
  club_social: ['🍘', 'Club Social original', 458, 8.3, 70.8, 16.7, 24, '1 paquete (24 g)', '7622201717537 7622201717544 7622201720421', 'gluten'],
  club_social_integral: ['🍘', 'Club Social integral', 423, 7.7, 65.4, 15.4, 26, '1 paquete (26 g)', '7750168001694 7750168001687', 'gluten'],
  ritz: ['🍘', 'Ritz sabor queso', 484, 6.7, 59, 25, 30, '4 galletas (30 g)', '7622201390013 7622300124526 7622202014765 7622202232756', 'gluten,lacteos'],
  chokosoda: ['🍪', 'Choco Soda Field', 500, 4.2, 69.4, 22.2, 36, '1 paquete (36 g)', '7622210675569', 'gluten'],
  dona_pepa: ['🍪', 'Doña Pepa', 461, 4.3, 78, 13, 23, '1 unidad (23 g)', '7622300095888 7622202818912', 'gluten'],
  hony_bran: ['🍪', 'Hony Bran', 424, 6.1, 75.8, 12.1, 33, '1 paquete (33 g)', '7622300117207', 'gluten'],
  chips_ahoy: ['🍪', 'Chips Ahoy!', 467, 4.4, 68.9, 20, 45, '1 paquete (45 g)', '7750168214292 7750168000697', 'gluten'],
  morochas: ['🍪', 'Morochas', 480, 5, 66, 22, 32, '1 paquete (32 g)', '7613036335942', 'gluten'],
  sublime_galleta: ['🍪', 'Galleta Sublime', 560, 10.1, 49.4, 35.8, 46, '4 galletas (46 g)', '7778606000764', 'gluten,mani,lacteos'],
  tentacion: ['🍪', 'Tentación chocolate (Field)', 480, 5, 70, 20, 36, '1 paquete (36 g)', undefined, 'gluten'],
  glacitas: ['🍪', 'Glacitas (Field)', 470, 5, 70, 19, 30, '1 paquete (30 g)', undefined, 'gluten'],
  vainilla_field: ['🍪', 'Vainilla Field', 440, 6.5, 75, 12.5, 40, '1 paquete (40 g)', '7622202802782 7622201635848', 'gluten'],
  animalitos: ['🍪', 'Animalitos Field', 440, 6.5, 74, 13, 32, '1 paquete (32 g)', '7750106127837 7750106010023 7750106000024 7750106010375', 'gluten'],
  margarita: ['🍪', 'Margarita (Nestlé)', 450, 6, 72, 15, 40, '1 paquete (40 g)', undefined, 'gluten'],
  cua_cua: ['🍫', 'Cua Cua (Field)', 520, 5, 62, 28, 22, '1 unidad (22 g)', '7750168143615 7750168001533 7750168001106', 'gluten,lacteos'],
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
  rellenitas: ['🍪', 'Rellenitas (GN)', 500, 5.6, 72.2, 19.4, 36, '1 paquete (36 g)', '7750106002592 7750106002622 7750106004305', 'gluten'],
  picaras: ['🍪', "Picaras (Winter's)", 500, 6, 67, 22, 40, '1 paquete (40 g)', '7752748005924 7752748005795 7752748010119 7752748012458 7752748010508', 'gluten'],
  chomp: ['🍪', 'Chomp (Victoria)', 490, 5, 66, 23, 38, '1 paquete (38 g)', '7750243058247', 'gluten'],
  bells: ['🍘', "Galletas saladitas Bell's", 478, 6.5, 71.7, 17.4, 46, '1 paquete (46 g)', '7750020541177', 'gluten'],
  union_kiwicha: ['🍘', 'Galletas integrales con kiwicha (Unión)', 467, 9, 70.5, 16.5, 30, '1 porción (30 g)', '7752056001625', 'gluten'],
  wafer: ['🧇', "Wafer de chocolate (Mabel's)", 494, 6.9, 69, 21, 28, '1 paquete (28 g)', '7773401006935 7773401006850 7773401006973 7773401006959', 'gluten'],
  bimboletes: ['🍰', 'Bimboletes (Bimbo)', 340, 5.7, 43, 17.1, 35, '1 unidad (35 g)', '7750727014288 7750727014271 7750727014264 7750727014240', 'gluten,huevo,lacteos'],
  paneton_todinno: ['🍞', 'Panetón Todinno', 351, 9.1, 52.1, 11.8, 100, '1 tajada (100 g)', '7750885020749', 'gluten,huevo,lacteos'],
  paneton_costa: ['🍞', 'Panetón Costa', 360, 9.7, 50.5, 13.2, 100, '1 tajada (100 g)', '7750885020763 7750885020787', 'gluten,huevo,lacteos'],
};

// ── Golosinas y chocolates (por 100 g) ──
const SWEETS: Record<string, Row> = {
  sublime: ['🍫', 'Sublime clásico', 537, 10, 50, 33, 30, '1 barra (30 g)', '8445290419484 7613036615303 8445292079082', 'mani,lacteos'],
  sublime_blanco: ['🍫', 'Sublime blanco', 566, 9.9, 51.6, 35.6, 38, '1 barra (38 g)', '8445290323392', 'mani,lacteos'],
  sublime_stick: ['🍫', 'Sublime stick', 540, 7.9, 52.9, 32.9, 14, '1 stick (14 g)', '7613036220149', 'mani,lacteos'],
  princesa: ['🍫', 'Princesa (Nestlé)', 516, 6, 60, 28, 30, '1 barra (30 g)', '7613036537063 7613034381262 7613035604797 8445291985872 7613287866196 7613035863569', 'gluten,lacteos'],
  triangulo: ['🍫', 'Triángulo (D’Onofrio)', 540, 8, 55, 32, 30, '1 barra (30 g)', undefined, 'mani,lacteos'],
  chocman: ['🍫', 'Chocman (Costa)', 455, 4.5, 63, 20.5, 28, '1 unidad (28 g)', '7750885021128 7750885021500 7750885024341 7750885026970', 'gluten,lacteos'],
  golazo: ['🍫', 'Golazo (Ambrosoli)', 528, 3.6, 62.8, 29.2, 25, '1 unidad (25 g)', '7750885008389 7750885022989', 'lacteos'],
  vizzio: ['🍫', 'Vizzio (Costa)', 545, 10, 55, 32, 25, '1 porción (25 g)', '7750885011921 7750885017213 7750885022569 7750885020848 7750885020824 7750885020855 7750885011778 7750885011815 7750885025553 7750885028301 7750885023764 7750885023740 7750885027014 7750885023757 7750885026000 7750885022545 7750885022644 7750885022484 7750885029261 7750885022538', 'frutos,lacteos'],
  milky: ['🍫', 'Milky (La Ibérica)', 540, 10, 55, 30, 20, '1 barra (20 g)', '7750060001204 7750060000863', 'lacteos'],
  kit_kat: ['🍫', 'Kit Kat', 518, 6.5, 62, 27, 41.5, '1 barra (41,5 g)', '8445290417008 7891000248362 7891000280959', 'gluten,lacteos'],
  snickers: ['🍫', 'Snickers', 488, 7.5, 60, 24, 50, '1 barra (50 g)', '0040000514251 0040000597551 0040000012023', 'mani,lacteos'],
  m_and_ms: ['🍬', "M&M's de chocolate", 492, 4.4, 70, 21, 45, '1 bolsa (45 g)', undefined, 'lacteos'],
  bon_o_bon: ['🍫', 'Bon o Bon', 538, 8.9, 49, 34, 16, '1 bombón (16 g)', '7790580106959 7757174014687 7757174012317 7757174009874 7757174019484 7757174018975 7757174018982 7757174019330 7757174014236 7757174011136 7757174019514 7757174017596 7898142866867 7790580421663 7757174018968 7757174017787 7757174015882 7757174010733 7898142866782 7757174015769 7757174015776', 'mani,lacteos'],
  sapito: ['🍫', 'Sapito (Arcor)', 522, 5, 61.1, 28.9, 9, '1 unidad (9 g)', '7757174012478 7757174010573', 'lacteos'],
  golpe: ['🍫', 'Golpe (Arcor)', 504, 3.7, 70.4, 24.1, 27, '1 unidad (27 g)', '7757174002240', 'gluten'],
  cofler_block: ['🍫', 'Cofler Block maní', 572, 18, 31, 42, 40, '1 barra (40 g)', '7790580110284', 'mani,lacteos'],
  chocoteja: ['🍫', 'Chocoteja de pecanas', 480, 5, 60, 25, 25, '1 chocoteja (25 g)', undefined, 'frutos,lacteos'],
  king_kong: ['🍰', 'King Kong de manjar blanco', 400, 6, 65, 13, 50, '1 porción (50 g)', undefined, 'gluten,lacteos,huevo'],
  turron_mani: ['🥜', 'Turrón de maní', 426, 8.8, 73, 7.9, 25, '1 unidad (25 g)', '77940131 77940148', 'mani'],
  ambrosia: ['🍬', 'Caramelos Ambrosía', 383, 0.6, 95, 0, 32, '1 bolsa (32 g)', '7750885007757 7750885019255 7750885171410 7750885007795'],
  flipy: ['🍬', 'Gomitas Flipy', 350, 7.6, 78.8, 0.4, 25, '1 bolsa (25 g)', '7750885009478 7750885019248 7750885023405'],
  mogul: ['🍬', 'Gomitas Mogul', 325, 6, 75, 0, 30, '1 bolsa (30 g)', '7790580116958 7790580116965 7790580117047 7790580169312 7790580323721 7790580200107 7790580424602 7790580141660 7790580140434 7802225514125 7790580424619 7790580424565 7790580130244 7790580141844 7790580415846 7802225424561 7757174013369 7790580151195 7757174017510 7802225405454 7790580129347'],
  frunas: ['🍬', 'Frunas', 396, 0, 90, 4, 20, '1 tira (20 g)', '0040000141143'],
  halls: ['🍬', 'Halls', 390, 0, 97, 0, 2.8, '1 caramelo (2,8 g)', '7622210427045 7622201776459 7622210427076 7702133020421 78948464 7622210427106 7622210427137'],
  chupetin: ['🍭', 'Chupetín', 390, 0, 97, 0, 10, '1 chupetín (10 g)'],
  marshmallows: ['🍡', 'Marshmallows (bombones)', 320, 2, 80, 0, 20, '4 unidades (20 g)'],
  helado_princesa: ['🍨', 'Helado Princesa (Nestlé)', 219, 4.2, 23.7, 11.9, 80, '1 bola (80 g)', '8445291078734', 'lacteos,gluten'],
  ambrosito: ['🍬', 'Gomitas Ambrosito', 376, 6.4, 86.8, 0.4, 25, '1 porción (25 g)', '7750885019231 7750885009157'],
  gusanos: ['🍬', 'Gomitas Gusanos (Ambrosoli)', 344, 5.6, 80.4, 0, 25, '1 porción (25 g)', '7750885020053 7750885023412'],
  loop: ['🍬', 'Gomitas ácidas Loop (Ambrosoli)', 359, 6, 82.8, 0.4, 25, '1 porción (25 g)', '7750885019262 7750885023436'],
  fini: ['🍬', 'Gomitas Fini', 360, 6, 83, 0, 20, '1 porción (20 g)', '7908228808169 7898279792077 7898279790639 7908228806011 8410525248122 7898591451591 7898279790431 8410525211225 8410525222368 7898279790400 7908228807230 7898279790394'],
  frugele: ['🍬', 'Frugelé', 350, 1, 86, 0, 25, '1 bolsa (25 g)', '7750885007566 7750885024662 7750885017114 7750885026628 7750885002097'],
  trululu: ['🍬', 'Gomitas Trululu', 340, 5, 80, 0, 25, '1 porción (25 g)'],
  globo_pop: ['🍭', 'Globo Pop', 379, 0, 94.7, 0, 19, '1 chupetín (19 g)', '7758102005197 7758102005418 7758102005005 7758102004060 7758102004930 7758102004985 7758102004992 7758102005111 7758102005159'],
  mentos: ['🍬', 'Mentos', 390, 0, 94, 1.5, 2.7, '1 caramelo (2,7 g)'],
  hersheys: ['🍫', "Hershey's con leche", 515, 6, 55, 30, 20, '1 porción (20 g)', undefined, 'lacteos'],
  canonazo: ['🍫', 'Cañonazo', 510, 4.2, 63.3, 26.7, 12, '1 unidad (12 g)', '7750885023207', 'gluten,lacteos'],
  lentejas: ['🍫', 'Lentejas de chocolate (Chin Chin, D’Onofrio)', 500, 3.1, 65.6, 25, 32, '1 porción (32 g)', undefined, 'lacteos'],
  beso_moza: ['🍫', 'Beso de Moza', 430, 4, 66, 16.5, 30, '1 unidad (30 g)', '7613031328536 7613035539051', 'gluten,lacteos'],
  twix: ['🍫', 'Twix', 495, 4.5, 65, 24, 50, '1 paquete (50 g)', '7896423471007 0040000514206', 'gluten,lacteos'],
  milky_way: ['🍫', 'Milky Way', 449, 4, 71, 17, 52, '1 barra (52 g)', '0040000422068 0040000011019', 'gluten,lacteos'],
  trident: ['🍬', 'Chicle Trident sin azúcar', 160, 0, 40, 0, 1.7, '1 chicle (1,7 g)', '7622201711757 7506105606077 7622210407757 7506105606060 7622201760458 7622201760397 7506105606053 7506105606084 7622201711726 7506105606091 7622201735432 7622202394799 7506105616052 7622202395130 7622201760380 7506105616069 7506105616090 7506105616076 7622202209031 7622202395536 7622201685379 0012546075480'],
};

// ── Snacks salados (por 100 g) ──
const SNACKS: Record<string, Row> = {
  lays: ['🥔', "Papas Lay's clásicas", 520, 5, 59, 29, 42, '1 bolsa personal (42 g)', '7752025006880 7758574003646 7758574005541'],
  doritos: ['🔺', 'Doritos queso atrevido', 510, 6, 58, 28, 42, '1 bolsa personal (42 g)', '7752025004763 7758574005480 7758574004445 7758574006739 7758574007330 7758574006982 7758574005497 0028400003209 0060410068458', 'lacteos'],
  cheetos: ['🧀', 'Cheetos horneados', 479, 5.9, 67.6, 20.6, 40, '1 bolsa personal (40 g)', '7758574004070 7758574002953 7702189045577 7758574005916 7758574000003 7758574005305 7758574005336 7758574006715 0028400062114 0028400022231 0028400032520 7758574005800 7758574005817 7758574004681', 'lacteos'],
  cuates: ['🌶️', 'Cuates picantes', 538, 7, 51, 34, 42, '1 bolsa (42 g)', '7758574003882 7758574005824 7758574005411 7758574006302 7758574006319'],
  piqueo_snax: ['🥨', 'Piqueo Snax', 531, 6, 57, 31, 45, '1 bolsa (45 g)', '7758574003318 7758574007064 7758574006395 7758574004230 7758574002021 7758574006722', 'mani'],
  chizitos: ['🧀', 'Chizitos', 526, 6, 58, 30, 34, '1 bolsa (34 g)', '7758574003776 7758574004667', 'lacteos'],
  tortees: ['🔺', 'Tortees picantes', 507, 6, 60, 27, 40, '1 bolsa (40 g)', '7758574006920 7758574006913 7758574003844 7758574003851'],
  inka_chips: ['🥔', 'Inka Chips sal de mar', 509, 5.2, 59.1, 28, 28, '1 porción (28 g)', '7750526002745 7750526000895 7750526002684 7750526002752 7750526002776 7750526002769 7750526002073 7750526002257 7750526002059 7750526002998 7750526003001 7750526003018 7750526002295 7750526001724 7750526000130 7750526002691 7750526003469 7750526002707 7750526002721'],
  pringles: ['🥔', 'Pringles original', 536, 4.5, 51, 35, 30, '1 porción (30 g)', '7896004009582 7896004009612 0038000184888 0037000312833'],
  stax: ['🥔', "Lay's Stax queso cheddar", 516, 6, 60, 28, 25, '1 porción (25 g)', '7501011178854', 'lacteos'],
  karinto_mani: ['🥜', 'Maní crocante Karinto', 531, 18, 45, 31, 30, '1 porción (30 g)', '7752025006484', 'mani,gluten'],
  karinto_habas: ['🫘', 'Habas saladas Karinto', 453, 25, 50, 17, 40, '1 bolsa (40 g)'],
  canchita: ['🌽', 'Canchita salada', 445, 8, 65, 17, 30, '1 puñado (30 g)'],
};

// ── Cereales y desayuno (por 100 g) ──
const CEREALS: Record<string, Row> = {
  angel_flakes: ['🥣', 'Cereal Ángel Flakes', 364, 4.5, 86.4, 1.4, 30, '1 taza (30 g)', '7759826001670 7759826000017 7759826003308', 'gluten'],
  angel_zuck: ['🥣', 'Cereal Ángel Zuck', 364, 4.5, 90.9, 0.9, 30, '1 taza (30 g)', '7758071002074 7759826001687 7759826000024', 'gluten'],
  angel_chock: ['🥣', 'Cereal Ángel Chock', 364, 4.5, 90.9, 1.8, 30, '1 taza (30 g)', '7759826001694 7759826000031', 'gluten'],
  angel_frutt: ['🥣', 'Cereal Ángel Frutt (aros de colores)', 380, 5, 88, 1.5, 30, '1 taza (30 g)', '7759826000369 7759826001717', 'gluten'],
  angel_meli: ['🥣', 'Cereal Ángel Meli', 400, 5, 90, 1.5, 30, '1 taza (30 g)', '7759826006149 7759826000048 7759826001700 7759826006125', 'gluten'],
  angel_copix: ['🥣', 'Cereal Ángel Copix con marshmallows', 380, 4.5, 87, 1.5, 30, '1 taza (30 g)', '7759826000635 7759826002882 7759826002837', 'gluten'],
  angel_almohada_choc: ['🥣', 'Almohaditas Ángel de chocolate', 440, 6, 75, 13, 30, '1 taza (30 g)', '7759826003353 7759826001335', 'gluten,lacteos'],
  angel_almohada_fresa: ['🥣', 'Almohaditas Ángel de fresa', 430, 5.5, 77, 11, 30, '1 taza (30 g)', '7759826001281 7759826003339', 'gluten,lacteos'],
  angel_life_fibra: ['🥣', 'Ángel Life Fibra', 350, 9, 74, 2, 30, '1 taza (30 g)', '7759826004916 7759826004589', 'gluten'],
  angel_life_protein: ['🥣', 'Ángel Life Protein', 364, 18.2, 69, 1.4, 30, '1 taza (30 g)', '7759826004602 7759826004923', 'gluten,soya'],
  angel_life_cero: ['🥣', 'Ángel Life Cero azúcar', 364, 9, 78, 1.5, 30, '1 taza (30 g)', '7759826004626', 'gluten'],
  angel_copos: ['🥣', 'Ángel copos de avena', 375, 9, 76, 4, 30, '1 taza (30 g)', '7750243082792', 'gluten'],
  angel_semillitas: ['🥣', 'Ángel Natura Semillitas', 400, 10, 85, 2, 30, '1 taza (30 g)', '7759826006477', 'gluten'],
  zucaritas: ['🥣', "Zucaritas (Kellogg's)", 367, 3.3, 88, 0.5, 30, '1 taza (30 g)', '7702103124784 7702103123848 7702103124692 7702103001153 7702103015020', 'gluten'],
  corn_flakes: ['🥣', "Corn Flakes (Kellogg's)", 367, 6.7, 83.3, 0.5, 30, '1 taza (30 g)', '7702103124579 7702103124487 7702103133595 7501058617453 7501008001073', 'gluten'],
  froot_loops: ['🥣', "Froot Loops (Kellogg's)", 380, 5.5, 85, 2.5, 30, '1 taza (30 g)', '7702103519580 7702103124708 7702103124791 7591057025229 7501008037676 7501008017050', 'gluten'],
  choco_krispis: ['🥣', "Choco Krispis (Kellogg's)", 380, 5, 86.7, 2, 30, '1 taza (30 g)', '7702103000118 7702103223692 7702103124739 7702103123916', 'gluten'],
  corn_flakes_nestle: ['🥣', 'Corn Flakes Nestlé sin gluten', 367, 6.7, 80, 2, 30, '1 taza (30 g)', '7506475117692 7501058617439 7501058612458'],
  chocapic: ['🥣', 'Chocapic (Nestlé)', 373, 8.3, 74.7, 4.7, 30, '¾ taza (30 g)', '7613287784186 7613035421493 8445291853980 7613287521507 7613287784193 8445291853997 7613034638243', 'gluten'],
  trix: ['🥣', 'Trix (Nestlé)', 380, 4.7, 78.3, 5.3, 30, '¾ taza (30 g)', '8445291383388 8445291855632 7613034155030 7613030979647 8445291855649 7613034155047', 'gluten'],
  fitness: ['🥣', 'Fitness original (Nestlé)', 347, 9, 70.7, 3.4, 30, '¾ taza (30 g)', '7501058614032 7501058652652 7613035652101 7613035651265 7613034913258 7613035651258', 'gluten'],
  fitness_miel: ['🥣', 'Fitness miel y almendras (Nestlé)', 337, 9.7, 62, 5.7, 30, '¾ taza (30 g)', '7613039529874 7613036245739', 'gluten,frutos'],
  cheerios_miel: ['🥣', 'Cheerios miel y almendras', 378, 8, 78, 4, 30, '1 taza (30 g)', '0065633132948', 'gluten,frutos'],
  bells_flakes: ['🥣', "Corn Flakes Bell's", 370, 7, 84, 0.5, 30, '1 taza (30 g)', undefined, 'gluten'],
  quaker: ['🥣', 'Avena Quaker tradicional', 375, 12.5, 62, 7.5, 40, '½ taza (40 g)', '7758574004605 7758574002816 7758574003462', 'gluten'],
  tres_ositos: ['🥣', 'Avena 3 Ositos clásica', 352, 11.7, 56, 8, 30, '3 cucharadas (30 g)', '7750885020473 7750885020008 7750885022460', 'gluten'],
  tres_ositos_quinua: ['🥣', 'Avena 3 Ositos con quinua', 373, 16.1, 63.3, 6.7, 30, '3 cucharadas (30 g)', '7750885020589 7750885006484 7750199000079 7750885019132', 'gluten'],
  milo: ['🍫', 'Milo en polvo', 388, 7.6, 76, 5.5, 17, '2 cucharadas (17 g)', '7702024224525 7613035863606 7702024016311 7613031336500 8445290241788 7613031592753', 'gluten,lacteos'],
  ecco: ['☕', 'Ecco (cebada instantánea)', 360, 5, 85, 0, 2, '1 cucharadita (2 g)', '7613287867148 7613038710181 8445292127240 8445291667556 8445291667549 8445290286239', 'gluten'],
};

// ── Lácteos (por 100 g o ml) ──
const DAIRY: Record<string, Row> = {
  leche_gloria: ['🥫', 'Leche Gloria azul (evaporada)', 133, 6.6, 10, 7.5, 50, '1 chorro para el café (50 ml)', '7751271034081 7751271032773 7751271032834', 'lacteos'],
  leche_gloria_zero: ['🥫', 'Leche Gloria Zero Lacto (evaporada)', 99, 6.5, 10, 3.7, 50, '1 chorro para el café (50 ml)', '7751271033657 7751271038263', 'lacteos'],
  leche_gloria_uht: ['🥛', 'Leche Gloria UHT entera', 60, 3.1, 4.7, 3.2, 240, '1 vaso (240 ml)', undefined, 'lacteos'],
  leche_choc_gloria: ['🥛', 'Leche chocolatada Gloria', 81, 3, 13.8, 1.5, 180, '1 caja chica (180 ml)', '7751271028394', 'lacteos'],
  leche_choc_laive: ['🥛', 'Leche chocolatada Laive', 63, 1, 12, 1.2, 200, '1 vaso (200 ml)', undefined, 'lacteos'],
  yogurt_gloria_vaso: ['🥛', 'Yogurt Gloria frutado (vaso)', 108, 3.8, 18.1, 2.3, 120, '1 vaso (120 g)', '7751271012348 7751271012355', 'lacteos'],
  batishake: ['🥛', 'Yogurt Gloria Batishake', 107, 4.2, 17, 2.5, 120, '1 vaso (120 g)', undefined, 'lacteos,gluten'],
  yogurt_slim: ['🥛', 'Yogurt Gloria Slim', 35, 3.5, 5.2, 0.1, 200, '1 vaso (200 g)', '7751271032544 7751271032506', 'lacteos'],
  yogurt_actibio: ['🥛', 'Yogurt Gloria ActiBio', 50, 3.4, 8, 0.5, 200, '1 vaso (200 g)', '7751271034470 7751271035415 7751271035422 7751271035439 7751271035583', 'lacteos'],
  yogurt_griego_gloria: ['🥛', 'Yogurt griego Gloria', 95, 5, 10, 3.9, 120, '1 vaso (120 g)', '7751271038133 7751271038140', 'lacteos'],
  yogurt_laive: ['🥛', 'Yogurt Laive bebible', 64, 2.7, 10, 1.5, 200, '1 vaso (200 g)', '7750151008440 7750151008358 7750151008327 7750151008372 7750151008334 7750151008471 7750151008341 7750151010146 7750151007672 7750151008433 7750151010160 7750151009386 7750151000369 7750151000581 7750151010177 7750151005647 7750151010153 7750151000628 7750151008464 7750151000376', 'lacteos'],
  yogurt_laive_bio: ['🥛', 'Yogurt Laive Bio', 80, 2.7, 13.2, 1.8, 340, '1 botella (340 g)', '7750151005548 7750151005562 7750151005555 7750151010429 7750151010436', 'lacteos'],
  yogurt_sbelt: ['🥛', 'Yogurt Laive Sbelt', 40, 3, 6.5, 0.2, 200, '1 vaso (200 g)', '7750151008495 7750151008518 7750151008488 7750151002424 7750151185950 7750151760478 7750151000253 7750151000611 7750151009393 7750151002417 7750151010191 7750151008259', 'lacteos'],
  yogurt_mix: ['🥛', 'Yogurt Laive Mix', 98, 3.2, 15.2, 2.8, 125, '1 vaso (125 g)', '7750151003773 7750151003766', 'lacteos,gluten'],
  yogurt_griego_laive: ['🥛', 'Yogurt griego Laive', 76, 5, 8, 2.7, 115, '1 vaso (115 g)', '7750151009287 7750151010696 7750151010054 7750151009355 7750151010061 7750151009249 7750151008617 7750151007528 7750151009225 7750151009201 7750151009508', 'lacteos'],
  manjar_bonle: ['🍮', 'Manjarblanco Bonlé', 260, 6, 50.3, 4, 20, '1 cucharada (20 g)', '7751271029964 7751271029940 7751271029957 7751271029971 7751271009317', 'lacteos'],
};

// ── Despensa: conservas, untables, cremas y embutidos (por 100 g) ──
const PANTRY: Record<string, Row> = {
  atun_florida: ['🥫', 'Atún Florida en aceite (filete)', 150, 26, 0, 5, 120, '1 lata escurrida (120 g)', '7751158011822 7751158011969 7751158011655 7751158009027', 'pescado'],
  atun_florida_agua: ['🥫', 'Atún Florida en agua', 110, 26, 0, 1, 120, '1 lata escurrida (120 g)', '7751158010337', 'pescado'],
  atun_grated: ['🥫', 'Grated de atún Florida en aceite', 230, 23, 1, 15, 140, '1 lata (140 g)', '7751158000000 7751158005890', 'pescado'],
  mermelada_fanny: ['🍓', 'Mermelada Fanny de fresa', 227, 0.7, 56, 0, 15, '1 cucharada (15 g)', '7750885022095 7750885021883 7750885008747 7750885005920 7750885016223'],
  nutella: ['🍫', 'Nutella', 539, 6.3, 57.5, 30.9, 15, '1 cucharada (15 g)', '80135463 7898024395232 7898024396529 8000500004388 8000500015476 7709857224968', 'frutos,lacteos'],
  pita_integral: ['🫓', 'Pan pita integral Bimbo', 215, 10, 40, 1.7, 60, '1 pan (60 g)', '7750727010761', 'gluten'],
  pan_artesano: ['🍞', 'Pan Artesano Bimbo', 244, 8.9, 47.8, 1.7, 45, '1 tajada (45 g)', '7750727005620', 'gluten'],
  mayonesa_alacena: ['🥫', 'Mayonesa Alacena', 660, 0.7, 3, 72, 15, '1 cucharada (15 g)', '7750243083805 7750243514521 7750243072366 7750243046114 7750243514569', 'huevo'],
  ketchup_alacena: ['🥫', 'Kétchup Alacena', 120, 1, 28, 0, 15, '1 cucharada (15 g)', '7750243073424 7750243071406 7750243003087 7750243003070 7750243043977'],
  tari: ['🌶️', 'Ají Tarí (Alacena)', 332, 1, 10, 32, 15, '1 cucharada (15 g)', undefined, 'huevo'],
  huancaina_alacena: ['🌶️', 'Huancaína Alacena', 302, 2.5, 10, 28, 30, '2 cucharadas (30 g)', '7750243086752 7750243028318 7750243028332 7750243043915', 'lacteos'],
  hot_dog_sf: ['🌭', 'Hot dog San Fernando', 225, 11, 7, 17, 45, '1 unidad (45 g)', '7750946006873 7750946002547 7750946002530 7750946005654 7750946005814 7750946006866 7750946002929 7750946002912', 'pollo,cerdo'],
  jamonada_sf: ['🥓', 'Jamonada San Fernando', 198, 12, 6, 14, 20, '1 tajada (20 g)', '7750946002325 7750946007504 7750946007559 7750946004022', 'cerdo'],
};

/** Categorías para explorar en Registrar; `kw` son palabras extra de búsqueda ("galleta" encuentra Oreo). */
const GROUPS = [
  { label: 'Gaseosas y bebidas', kw: 'gaseosa refresco bebida', rows: DRINKS },
  { label: 'Cereales', kw: 'cereal cereales desayuno hojuelas', rows: CEREALS },
  { label: 'Galletas', kw: 'galleta galletas', rows: COOKIES },
  { label: 'Golosinas', kw: 'golosina golosinas dulce', rows: SWEETS },
  { label: 'Snacks', kw: 'snack piqueo bocadito', rows: SNACKS },
  { label: 'Lácteos', kw: 'lacteo lacteos', rows: DAIRY },
  { label: 'Despensa', kw: 'conserva despensa', rows: PANTRY },
];
export const PRODUCT_GROUPS = GROUPS.map((g) => ({ label: g.label, kw: g.kw, ids: Object.keys(g.rows).map((k) => `pe_${k}`) }));

const ROWS = Object.fromEntries(
  GROUPS.flatMap((g) => Object.entries(g.rows).map(([k, r]) => [k, { r, kw: g.kw }])),
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
