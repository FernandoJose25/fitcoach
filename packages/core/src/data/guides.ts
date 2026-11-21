import type { MealFormat, StepAction } from '../types';

/**
 * Guías de preparación por id de receta: [tipo, minutos, nivel (1 fácil · 2 media), utensilios, pasos, consejos].
 * Paso: [acción (dibujo animado), texto, segundos del temporizador]. Los textos nombran los ingredientes
 * sin cantidades: la porción depende de las metas de cada persona y se muestra en la lista de ingredientes.
 * Aquí: desayunos y snacks; almuerzos y cenas en `guides-meals.ts`.
 */
export type Step = [StepAction, string, number?];
export type Row = [MealFormat, number, 1 | 2, string, Step[], string[]];

export const QUINUA =
  'Si no tienes quinua cocida: lávala bien para quitarle el amargor, hiérvela con el doble de agua 15 minutos y guárdala en la refri hasta 4 días.';
export const HUEVO_DURO: Step[] = [
  ['hervir', 'Pon los huevos en una olla con agua fría que los cubra y llévala a hervir.'],
  ['hervir', 'Desde que hierve, cuenta 10 minutos.', 600],
  ['reposar', 'Pásalos a agua fría para que se pelen fácil, y pélalos.', 120],
];
export const SIN_ACEITE =
  'Sin aceite: la sartén antiadherente basta; si algo se pega, pásale un papel con unas gotas de aceite.';

export const GUIDES: Record<string, Row> = {
  // ── Batidos ──
  'batido-avena-platano-yogur': [
    'batido',
    5,
    1,
    'Licuadora,Vaso',
    [
      ['cortar', 'Pela el plátano y córtalo en trozos.'],
      ['licuar', 'Pon en la licuadora la leche, la avena, el plátano y el yogur, con 3 o 4 cubos de hielo.'],
      ['licuar', 'Licúa a velocidad alta hasta que no se vean grumos de avena.', 60],
      ['servir', 'Sírvelo y tómalo al momento: si reposa, la avena lo espesa.'],
    ],
    [
      'Con el plátano congelado en rodajas queda más espeso y frío, sin hielo.',
      'Sin yogur griego: usa yogur natural sin azúcar (tendrá un poco menos de proteína).',
    ],
  ],
  'batido-platano-pbut': [
    'batido',
    5,
    1,
    'Licuadora',
    [
      ['cortar', 'Pela el plátano y córtalo en trozos.'],
      ['licuar', 'Licúa la leche, el plátano y la mantequilla de maní con hielo.', 45],
      ['servir', 'Sírvelo al momento.'],
    ],
    [
      'Una pizca de canela o cacao en polvo sin azúcar le da sabor de postre.',
      'Con plátano congelado queda tipo milkshake.',
    ],
  ],
  'batido-whey-avena': [
    'batido',
    5,
    1,
    'Licuadora',
    [
      ['licuar', 'Pon primero la leche y luego la avena, el plátano y la proteína, con hielo.'],
      ['licuar', 'Licúa hasta que no queden grumos.', 60],
      ['servir', 'Tómalo al momento.'],
    ],
    ['Poner el líquido primero evita que la proteína se pegue al fondo.', 'Ideal después de entrenar.'],
  ],
  'batido-verde-proteina': [
    'batido',
    5,
    1,
    'Licuadora',
    [
      ['licuar', 'Licúa primero la bebida de almendras con la espinaca hasta que no queden hojas.', 30],
      ['licuar', 'Agrega la piña, la proteína y hielo, y licúa otra vez.', 45],
      ['servir', 'Tómalo al momento.'],
    ],
    ['La piña tapa el sabor de la espinaca: no se siente.', 'Con piña congelada no necesitas hielo.'],
  ],
  'batido-fresa-yogur': [
    'batido',
    5,
    1,
    'Licuadora',
    [
      ['cortar', 'Lava las fresas y quítales las hojas.'],
      ['licuar', 'Licúa el yogur, las fresas y la leche con hielo.', 45],
      ['servir', 'Sírvelo al momento.'],
    ],
    ['Con fresas congeladas queda espeso como helado.'],
  ],
  'batido-soya-mani': [
    'batido',
    5,
    1,
    'Licuadora',
    [
      ['cortar', 'Pela el plátano y córtalo en trozos.'],
      ['licuar', 'Licúa la bebida de soya, el plátano y el maní con hielo.', 60],
      ['servir', 'Sírvelo al momento.'],
    ],
    ['Si tu licuadora no tritura bien el maní, déjalo remojando en la bebida 10 minutos antes.'],
  ],
  'avena-leche-bebida': [
    'batido',
    10,
    1,
    'Olla,Licuadora',
    [
      ['hervir', 'Hierve la avena en la leche a fuego bajo, removiendo para que no se pegue.', 300],
      ['reposar', 'Deja que se entibie un poco.', 120],
      ['licuar', 'Licúala con el plátano.', 30],
      ['servir', 'Sírvela tibia, con canela si te gusta.'],
    ],
    [
      'Canela en rama y un clavo de olor durante el hervor: la avena clásica de desayuno.',
      'Licúa tibia, nunca hirviendo: el vapor puede botar la tapa.',
    ],
  ],

  // ── Avenas, quinuas y bowls ──
  'avena-cocida-pbut': [
    'dulce',
    10,
    1,
    'Olla pequeña,Cuchara',
    [
      ['hervir', 'Pon la leche y la avena en una olla a fuego medio.'],
      ['mezclar', 'Cuando hierva, baja el fuego y cocina removiendo para que no se pegue.', 300],
      ['cortar', 'Mientras tanto, corta el plátano en rodajas.'],
      ['servir', 'Sirve la avena, cubre con el plátano y pon la mantequilla de maní encima.'],
    ],
    [
      'Una pizca de canela realza el sabor sin sumar calorías.',
      'En microondas: 2 minutos en un bowl grande, removiendo a la mitad para que no se rebalse.',
    ],
  ],
  'avena-claras-fresas': [
    'dulce',
    10,
    2,
    'Olla pequeña,Batidor o tenedor',
    [
      ['hervir', 'Cocina la avena en la leche a fuego medio.', 180],
      ['batir', 'Baja el fuego y agrega las claras de a pocos, batiendo sin parar para que no formen grumos.', 120],
      ['cortar', 'Lava las fresas y córtalas en láminas.'],
      ['servir', 'Sirve la avena y cubre con las fresas.'],
    ],
    [
      'Las claras la dejan esponjosa y suman proteína sin cambiar el sabor.',
      'Si se forman grumos, bate fuerte fuera del fuego unos segundos.',
    ],
  ],
  'avena-soya-linaza': [
    'dulce',
    10,
    1,
    'Olla pequeña',
    [
      ['hervir', 'Cocina la avena en la bebida de soya a fuego medio, removiendo.', 300],
      ['cortar', 'Corta el plátano en rodajas.'],
      ['servir', 'Sirve, cubre con el plátano y espolvorea la linaza.'],
    ],
    ['La linaza molida se aprovecha mejor que entera.'],
  ],
  'avena-fria-almendras': [
    'dulce',
    5,
    1,
    'Frasco o táper,Cuchillo',
    [
      ['mezclar', 'En un frasco, mezcla la avena con agua hasta cubrirla (más o menos el doble de su volumen).'],
      ['reposar', 'Tápalo y déjalo en la refri toda la noche (mínimo 4 horas).'],
      ['cortar', 'En la mañana, corta el plátano y pica las almendras.'],
      ['servir', 'Cubre la avena con el plátano y las almendras.'],
    ],
    [
      'Con leche o yogur en lugar de agua queda más cremosa (suma calorías).',
      'Dura 3 días en la refri: prepara varios frascos de una vez.',
    ],
  ],
  'pudin-chia-mango': [
    'dulce',
    5,
    1,
    'Frasco o táper,Cuchara',
    [
      ['mezclar', 'Mezcla la chía con la leche en un frasco.'],
      ['reposar', 'Espera 5 minutos y vuelve a mezclar: así no se forman grumos.', 300],
      ['reposar', 'Tápalo y déjalo en la refri toda la noche (mínimo 4 horas).'],
      ['cortar', 'En la mañana, pica el mango y ponlo encima.'],
    ],
    ['Unas gotas de vainilla en la leche le dan sabor de postre.', 'Dura 3 días en la refri.'],
  ],
  'bowl-yogur-avena': [
    'dulce',
    5,
    1,
    'Bowl,Cuchillo',
    [
      ['mezclar', 'Mezcla el yogur con la avena en un bowl.'],
      ['cortar', 'Corta el plátano en rodajas y pica las almendras.'],
      ['servir', 'Cubre el yogur con el plátano y las almendras.'],
    ],
    [
      'Si lo preparas la noche anterior, la avena se ablanda y queda tipo "overnight oats".',
      'Cambia el plátano por fresas o papaya para variar.',
    ],
  ],
  'yogur-platano-almendras': [
    'dulce',
    3,
    1,
    'Bowl,Cuchillo',
    [
      ['servir', 'Sirve el yogur en un bowl.'],
      ['cortar', 'Corta el plátano en rodajas sobre el yogur.'],
      ['servir', 'Agrega las almendras enteras o picadas.'],
    ],
    ['Unas gotas de vainilla o canela le dan sabor de postre sin azúcar.'],
  ],
  'yogur-granola-arandanos': [
    'dulce',
    3,
    1,
    'Bowl',
    [
      ['servir', 'Sirve el yogur en un bowl.'],
      ['servir', 'Cubre con la granola y los arándanos justo antes de comer.'],
    ],
    ['La granola va al final para que siga crocante.', 'Sin arándanos: fresas o plátano funcionan igual.'],
  ],
  'papaya-yogur-kiwicha': [
    'dulce',
    5,
    1,
    'Cuchillo,Bowl',
    [
      ['cortar', 'Pela la papaya, quítale las pepas y córtala en cubos.'],
      ['servir', 'Pon la papaya en un bowl y cúbrela con el yogur.'],
      ['servir', 'Espolvorea la kiwicha pop justo antes de comer para que siga crocante.'],
    ],
    [
      'En batido: licúa la papaya con el yogur y un chorrito de agua, y pon la kiwicha encima.',
      'En vaso por capas (yogur, papaya, kiwicha) queda tipo parfait para llevar.',
      'Unas gotas de limón sobre la papaya realzan su sabor.',
    ],
  ],
  'quinua-leche-manzana': [
    'dulce',
    10,
    1,
    'Olla pequeña,Cuchillo',
    [
      ['cortar', 'Pica la manzana en cubitos (con cáscara tiene más fibra).'],
      ['hervir', 'Calienta la quinua cocida con la leche a fuego medio, removiendo.', 300],
      ['servir', 'Sirve con la manzana picada y una pizca de canela.'],
    ],
    [QUINUA, 'Si cocinas la manzana con la quinua 2 minutos, queda tipo compota.'],
  ],
  'quinua-soya-manzana': [
    'dulce',
    10,
    1,
    'Olla pequeña,Cuchillo',
    [
      ['cortar', 'Pica la manzana en cubitos.'],
      ['hervir', 'Calienta la quinua cocida con la bebida de soya, removiendo.', 300],
      ['servir', 'Sirve con la manzana y la chía encima.'],
    ],
    [QUINUA, 'Canela y clavo de olor le dan el sabor de la quinua de desayuno de siempre.'],
  ],
  'quinua-yogur-mango': [
    'dulce',
    5,
    1,
    'Bowl,Cuchillo',
    [
      ['mezclar', 'Mezcla la quinua cocida fría con el yogur.'],
      ['cortar', 'Pela el mango y pícalo en cubos.'],
      ['servir', 'Cubre con el mango y espolvorea la chía.'],
    ],
    [QUINUA],
  ],

  // ── Huevos ──
  'tortilla-pan-jamon': [
    'salado',
    10,
    1,
    'Sartén antiadherente,Bowl,Tenedor',
    [
      ['cortar', 'Pica el jamón en tiras y el tomate en rodajas.'],
      ['batir', 'Bate los huevos con una pizca de sal y pimienta hasta que se mezclen yema y clara.'],
      ['sarten', 'Calienta la sartén a fuego medio, dora el jamón y vierte los huevos encima.', 60],
      ['sarten', 'Cuando los bordes cuajen, dobla la tortilla por la mitad y cocínala un poco más.', 60],
      ['servir', 'Sírvela con el pan y el tomate.'],
    ],
    [SIN_ACEITE, 'Mete la tortilla dentro del pan y llévala como sándwich.'],
  ],
  'pan-palta-huevos': [
    'salado',
    10,
    1,
    'Sartén antiadherente,Tostadora (opcional),Tenedor',
    [
      ['tostar', 'Tuesta el pan en la tostadora o en la sartén seca, 2 minutos por lado.', 120],
      ['untar', 'Aplasta la palta con un tenedor, una pizca de sal y unas gotas de limón, y úntala en el pan.'],
      ['batir', 'Bate los huevos con una pizca de sal.'],
      ['sarten', 'Cocínalos a fuego medio-bajo moviendo con una espátula hasta que cuajen pero sigan cremosos.', 120],
      ['servir', 'Pon los huevos sobre el pan con palta.'],
    ],
    [
      'Retira los huevos un poco antes de que se vean listos: terminan de cocinarse con su propio calor.',
      'Tomate picado o ají encima le dan más sabor.',
    ],
  ],
  'omelette-espinaca-queso': [
    'salado',
    10,
    2,
    'Sartén antiadherente,Bowl,Espátula',
    [
      ['batir', 'Bate los huevos con una pizca de sal.'],
      ['sarten', 'Saltea la espinaca en la sartén a fuego medio hasta que se marchite.', 60],
      ['sarten', 'Vierte los huevos sobre la espinaca y cocina sin mover hasta que los bordes cuajen.', 120],
      ['sarten', 'Pon el queso desmenuzado en una mitad, dobla el omelette y cocina un minuto más.', 60],
      ['servir', 'Sírvelo con el pan.'],
    ],
    ['Tapa la sartén en el último minuto para que cuaje parejo sin quemarse.', SIN_ACEITE],
  ],
  'panqueques-avena-platano': [
    'panqueques',
    15,
    2,
    'Licuadora,Sartén antiadherente,Espátula',
    [
      ['licuar', 'Licúa la avena, los huevos y el plátano hasta tener una mezcla lisa.', 30],
      ['reposar', 'Deja reposar la mezcla para que la avena se hidrate y espese.', 180],
      ['sarten', 'Calienta la sartén a fuego medio-bajo y vierte 2 cucharadas de mezcla por panqueque.'],
      ['sarten', 'Cuando salgan burbujas arriba, voltéalo y cocina el otro lado.', 120],
      ['servir', 'Apílalos y termina con la miel.'],
    ],
    [
      'Fuego bajo: con fuego alto se queman por fuera y quedan crudos por dentro.',
      'Si la mezcla está muy líquida, agrega una cucharada más de avena.',
      SIN_ACEITE,
    ],
  ],
  'wrap-huevo-jamon': [
    'salado',
    10,
    1,
    'Sartén antiadherente,Bowl',
    [
      ['batir', 'Bate los huevos con una pizca de sal y pica el jamón.'],
      ['sarten', 'Revuelve los huevos con el jamón en la sartén a fuego medio hasta que cuajen.', 120],
      ['tostar', 'Calienta la tortilla en la sartén 30 segundos por lado.', 30],
      ['servir', 'Rellénala con el huevo y el queso, enróllala y córtala en diagonal.'],
    ],
    ['Para llevar: envuélvelo en papel aluminio y se mantiene tibio.'],
  ],
  'camote-huevos-revueltos': [
    'salado',
    25,
    1,
    'Olla,Sartén antiadherente',
    [
      ['cortar', 'Pela el camote y córtalo en rodajas gruesas.'],
      ['hervir', 'Sancóchalo en agua con sal hasta que el tenedor entre fácil.', 900],
      ['cortar', 'Mientras tanto, pica el tomate y bate los huevos con sal.'],
      ['sarten', 'Cocina el tomate un minuto, agrega los huevos y revuelve hasta que cuajen.', 120],
      ['servir', 'Sirve el camote con los huevos.'],
    ],
    [
      'Sancocha camote para varios días: dura 4 días en la refri.',
      'En airfryer: rodajas de camote 15 minutos a 200 °C, quedan tipo chips sin aceite.',
    ],
  ],
  'huevos-rancheros': [
    'salado',
    15,
    2,
    'Sartén antiadherente,Olla pequeña',
    [
      ['cortar', 'Pica el tomate en cubitos.'],
      ['hervir', 'Calienta los frijoles cocidos con un poco de su caldo y aplasta algunos.', 180],
      ['sarten', 'Fríe los huevos a fuego medio con unas gotas de aceite, tapados, hasta que la clara cuaje.', 180],
      ['tostar', 'Calienta las tortillas 30 segundos por lado.', 30],
      ['servir', 'Pon los frijoles sobre las tortillas, los huevos encima y el tomate.'],
    ],
    [
      'Un poco de ají o salsa picante va perfecto encima.',
      'Frijoles de lata: enjuágalos para quitarles el exceso de sal.',
    ],
  ],
  'quinua-huevo-verduras': [
    'salado',
    15,
    1,
    'Sartén grande',
    [
      ['sarten', 'Calienta el aceite y saltea las verduras a fuego alto.', 240],
      ['sarten', 'Agrega la quinua cocida y mezcla.', 120],
      ['batir', 'Haz un espacio al centro, rompe los huevos y revuélvelos hasta que cuajen.', 120],
      ['servir', 'Mezcla todo, prueba la sal y sirve.'],
    ],
    ['Un chorrito de sillao al final le da sabor de chaufa.', QUINUA],
  ],
  'huevos-duros-manzana': [
    'salado',
    15,
    1,
    'Olla pequeña,Cuchillo',
    [...HUEVO_DURO, ['servir', 'Acompáñalos con la manzana en gajos.']],
    ['Sancocha varios de una vez: con cáscara duran 5 días en la refri.', 'Para yema cremosa, 7 minutos en vez de 10.'],
  ],
  'pan-frances-huevo-palta': [
    'salado',
    15,
    1,
    'Olla pequeña,Cuchillo',
    [
      ...HUEVO_DURO,
      ['untar', 'Abre el pan y unta la palta aplastada con una pizca de sal.'],
      ['servir', 'Corta los huevos en rodajas y rellena el pan.'],
    ],
    ['Un toque de ají o sal de Maras y queda como el clásico pan con palta y huevo.'],
  ],
  'yuca-queso-huevo': [
    'salado',
    30,
    1,
    'Olla',
    [
      ['cortar', 'Pela la yuca, córtala en trozos y quítale la vena del centro.'],
      ['hervir', 'Sancóchala en agua con sal hasta que esté suave y se abra.', 1200],
      ['hervir', 'En otra olla, sancocha el huevo 10 minutos desde que hierve.', 600],
      ['servir', 'Sirve la yuca con el queso en tajadas y el huevo.'],
    ],
    ['En airfryer: la yuca ya sancochada, 10 minutos a 200 °C, queda dorada sin freír.'],
  ],
  'codorniz-tomate': [
    'salado',
    10,
    1,
    'Olla pequeña',
    [
      ['hervir', 'Pon los huevos con cuidado en agua hirviendo.'],
      ['hervir', 'Cocínalos.', 240],
      ['reposar', 'Pásalos a agua fría y pélalos.', 120],
      ['servir', 'Sírvelos con los tomates y una pizca de sal.'],
    ],
    ['Rueda el huevo sobre la mesa presionando un poco: la cáscara sale más fácil.'],
  ],
  'sandwich-huevo': [
    'salado',
    15,
    1,
    'Olla pequeña,Cuchillo',
    [
      ...HUEVO_DURO,
      ['cortar', 'Córtalos en rodajas.'],
      ['servir', 'Arma el sándwich con el huevo y la lechuga, con una pizca de sal.'],
    ],
    ['Aplasta el huevo con un poco de mostaza o yogur para una versión cremosa.'],
  ],

  // ── Panes, tostadas y sándwiches ──
  'sandwich-queso-jamon': [
    'salado',
    5,
    1,
    'Cuchillo,Sartén (opcional)',
    [
      ['cortar', 'Corta el queso fresco en tajadas.'],
      ['servir', 'Arma el sándwich con el queso y el jamón.'],
      [
        'sarten',
        'Si lo quieres caliente, dóralo en la sartén seca presionándolo con una espátula; voltéalo a la mitad.',
        120,
      ],
      ['servir', 'Acompáñalo con el vaso de leche.'],
    ],
    ['Tomate y lechuga suman volumen casi sin calorías.'],
  ],
  'pan-queso-tomate-leche': [
    'salado',
    5,
    1,
    'Cuchillo',
    [
      ['cortar', 'Corta el queso y el tomate en tajadas.'],
      ['servir', 'Arma el pan con el queso y el tomate, con una pizca de sal y orégano.'],
      ['servir', 'Acompáñalo con la leche, fría o caliente.'],
    ],
    ['Calienta el pan relleno en la sartén para que el queso se ablande.'],
  ],
  'pan-pollo-lechuga': [
    'salado',
    10,
    1,
    'Bowl,Tenedor',
    [
      ['cortar', 'Deshilacha el pollo cocido con dos tenedores.'],
      ['mezclar', 'Mézclalo con la mayonesa y una pizca de sal y pimienta.'],
      ['servir', 'Abre el pan, pon la lechuga y rellena con el pollo.'],
    ],
    [
      'Si no tienes pollo cocido: sancocha la pechuga 20 minutos en agua con sal y deja que se enfríe antes de deshilacharla.',
      'Cambia la mayonesa por yogur griego con limón para menos grasa.',
    ],
  ],
  'sandwich-atun': [
    'salado',
    5,
    1,
    'Bowl,Tenedor,Cuchillo',
    [
      ['mezclar', 'Escurre el atún y mézclalo con la palta aplastada, sal y unas gotas de limón.'],
      ['cortar', 'Corta el tomate en rodajas.'],
      ['servir', 'Rellena el pan con la mezcla y el tomate.'],
    ],
    [
      'La palta reemplaza a la mayonesa: misma cremosidad, grasa más saludable.',
      'Cebolla picada fina o culantro le dan sabor de ensalada de atún.',
    ],
  ],
  'sandwich-pavo-palta': [
    'salado',
    15,
    1,
    'Sartén antiadherente,Cuchillo',
    [
      ['cortar', 'Corta la pechuga de pavo en filetes delgados y sazónalos con sal y pimienta.'],
      ['sarten', 'Cocínalos a la plancha a fuego medio-alto; voltéalos a la mitad del tiempo.', 360],
      ['untar', 'Unta la palta en el pan y corta el tomate en rodajas.'],
      ['servir', 'Arma el sándwich con el pavo y el tomate.'],
    ],
    ['Filetes delgados se cocinan rápido y quedan jugosos.', 'Cocina pavo para 2 o 3 días y guárdalo en la refri.'],
  ],
  'tofu-pan-palta': [
    'salado',
    10,
    1,
    'Sartén antiadherente,Tenedor',
    [
      ['cortar', 'Seca el tofu con papel toalla y desmenúzalo con un tenedor.'],
      ['sarten', 'Saltéalo a fuego medio con sal, pimienta y una pizca de cúrcuma hasta que se dore un poco.', 300],
      ['tostar', 'Tuesta el pan y unta la palta aplastada.'],
      ['servir', 'Pon el tofu revuelto sobre el pan con palta.'],
    ],
    ['La cúrcuma le da el color amarillo del huevo revuelto.', 'Espinaca o tomate al final suman volumen.'],
  ],
  'tofu-revuelto-tortilla': [
    'salado',
    15,
    1,
    'Sartén antiadherente,Tenedor',
    [
      ['cortar', 'Seca el tofu con papel toalla y desmenúzalo con un tenedor.'],
      ['sarten', 'Calienta el aceite y saltea el tofu con sal, pimienta y una pizca de cúrcuma.', 240],
      ['sarten', 'Agrega la espinaca y cocina hasta que se marchite.', 60],
      ['tostar', 'Calienta las tortillas en otra sartén 30 segundos por lado.', 30],
      ['servir', 'Rellena las tortillas con el tofu.'],
    ],
    ['Un poco de comino o ají panca le da sabor de desayuno mexicano.'],
  ],
  'pan-pbut-platano': [
    'dulce',
    3,
    1,
    'Cuchillo,Tostadora (opcional)',
    [
      ['tostar', 'Tuesta el pan si lo prefieres crocante.', 120],
      ['untar', 'Unta la mantequilla de maní.'],
      ['cortar', 'Corta el plátano en rodajas y colócalo encima.'],
    ],
    ['Una pizca de canela encima combina muy bien.'],
  ],
  'tostadas-cottage-fresas': [
    'dulce',
    5,
    1,
    'Cuchillo',
    [
      ['cortar', 'Lava las fresas y córtalas en láminas.'],
      ['untar', 'Unta el queso cottage en las tostadas.'],
      ['servir', 'Cubre con las fresas.'],
    ],
    [
      'Unas gotas de miel o canela van muy bien con el cottage.',
      'Arma justo antes de comer para que las tostadas no se ablanden.',
    ],
  ],
  'tostadas-palta-edamame': [
    'salado',
    10,
    1,
    'Olla pequeña,Tenedor',
    [
      ['hervir', 'Hierve el edamame en agua con sal.', 300],
      ['untar', 'Aplasta la palta con sal y limón y úntala en las tostadas.'],
      ['cortar', 'Corta el tomate en rodajas y ponlo encima.'],
      ['servir', 'Acompaña con el edamame pelado.'],
    ],
    ['El edamame congelado ya viene precocido: solo necesita 3 a 5 minutos.'],
  ],
  'tostadas-atun': [
    'salado',
    5,
    1,
    'Bowl,Cuchillo',
    [
      ['cortar', 'Pica el tomate en cubitos.'],
      ['mezclar', 'Escurre el atún y mézclalo con el tomate, sal y unas gotas de limón.'],
      ['servir', 'Sírvelo sobre las tostadas justo antes de comer.'],
    ],
    ['Cebolla y culantro picados le dan un toque de ceviche.'],
  ],
  'galletas-arroz-palta-pavo': [
    'salado',
    10,
    1,
    'Sartén antiadherente,Tenedor',
    [
      [
        'sarten',
        'Cocina el pavo en filetes delgados a la plancha, volteándolo a la mitad (sáltate este paso si ya está cocido).',
        360,
      ],
      ['untar', 'Aplasta la palta con sal y limón y úntala en las galletas.'],
      ['servir', 'Coloca el pavo en tajadas encima.'],
    ],
    ['Arma justo antes de comer para que las galletas sigan crocantes.'],
  ],

  // ── Tubérculos y granos andinos ──
  'mote-queso': [
    'salado',
    5,
    1,
    'Olla o microondas,Cuchillo',
    [
      ['hervir', 'Calienta el mote sancochado en un poco de agua o en el microondas.', 120],
      ['cortar', 'Corta el queso en cubos.'],
      ['servir', 'Sirve el mote caliente con el queso.'],
    ],
    ['Con ají o huacatay queda como en la sierra.'],
  ],
  'choclo-queso': [
    'salado',
    20,
    1,
    'Olla',
    [
      ['hervir', 'Hierve agua con una cucharadita de azúcar (la sal endurece el choclo).'],
      ['hervir', 'Pon el choclo y cocínalo tapado.', 900],
      ['servir', 'Sírvelo con el queso en tajadas.'],
    ],
    ['Unas hojas de la panca en el agua le dan más sabor.'],
  ],

  // ── Snacks ──
  'manzana-pbut': [
    'dulce',
    3,
    1,
    'Cuchillo',
    [
      ['cortar', 'Lava la manzana y córtala en gajos, quitándole el centro.'],
      ['untar', 'Unta los gajos con la mantequilla de maní.'],
    ],
    ['Unas gotas de limón evitan que la manzana se oscurezca si la llevas.'],
  ],
  'mix-frutos-secos': [
    'dulce',
    2,
    1,
    'Táper o bolsita',
    [
      ['mezclar', 'Mezcla las almendras, las nueces y las pasas.'],
      ['servir', 'Guárdalo en un táper o bolsita para llevar.'],
    ],
    ['Arma las porciones de la semana de una vez: comiendo del paquete es fácil pasarse.'],
  ],
  'edamame-limon': [
    'salado',
    8,
    1,
    'Olla',
    [
      ['hervir', 'Hierve agua con sal y agrega el edamame.', 300],
      ['servir', 'Escúrrelo y rocíalo con el limón y una pizca de sal.'],
    ],
    [
      'Con una pizca de ají molido o ajo queda más sabroso.',
      'Se aprieta la vaina con los dientes para sacar los granos: la vaina no se come.',
    ],
  ],
  'hummus-bastones': [
    'salado',
    10,
    1,
    'Licuadora o procesador,Cuchillo',
    [
      ['licuar', 'Licúa los garbanzos cocidos con el aceite, el limón, sal y 3 o 4 cucharadas de agua fría.', 60],
      ['mezclar', 'Si queda espeso, agrega agua de a cucharada y vuelve a licuar hasta que esté cremoso.'],
      ['cortar', 'Pela la zanahoria y corta la zanahoria y el pepino en bastones.'],
      ['servir', 'Sirve el hummus con los bastones para untar.'],
    ],
    ['Un diente de ajo y comino le dan el sabor clásico.', 'Dura 4 días en la refri, tapado.'],
  ],
  'cottage-pina': [
    'dulce',
    3,
    1,
    'Cuchillo,Bowl',
    [
      ['cortar', 'Pela la piña y pícala en cubos.'],
      ['servir', 'Sirve el cottage y cúbrelo con la piña.'],
    ],
    ['Con canela o unas hojas de menta queda más fresco.'],
  ],
  'ceviche-chocho': [
    'salado',
    10,
    1,
    'Bowl,Cuchillo',
    [
      ['cortar', 'Pica la cebolla en pluma fina y el tomate en cubitos.'],
      ['mezclar', 'Mezcla el tarwi con la cebolla y el tomate.'],
      ['mezclar', 'Aliña con el jugo de limón, sal y, si te gusta, ají limo picado.'],
      ['reposar', 'Deja reposar unos minutos para que se mezclen los sabores.', 300],
      ['servir', 'Sirve con culantro picado encima.'],
    ],
    ['Lava la cebolla en agua con sal para quitarle lo fuerte.', 'Compra el chocho ya cocido y desamargado.'],
  ],
  'fruta-nueces': [
    'dulce',
    5,
    1,
    'Cuchillo,Bowl',
    [
      ['cortar', 'Pela y pica la papaya y la piña en cubos.'],
      ['cortar', 'Trocea las nueces con el cuchillo.'],
      ['servir', 'Mezcla la fruta y cúbrela con las nueces.'],
    ],
    ['Unas gotas de limón sobre la fruta realzan el sabor.'],
  ],
};
