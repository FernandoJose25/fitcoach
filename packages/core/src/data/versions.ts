import type { MealFormat } from '../types';
import { HUEVO_DURO, QUINUA, SIN_ACEITE, type Step } from './guides';

/**
 * Otras formas de preparar una receta con los mismos ingredientes y cantidades (mismos macros):
 * [tipo, nombre, minutos, nivel (1 fácil · 2 media), utensilios, pasos, consejos]. Solo se agregan
 * sal, especias, hielo o agua.
 */
type Version = [MealFormat, string, number, 1 | 2, string, Step[], string[]];

const PANQ = 'Licuadora,Sartén antiadherente,Espátula';
const SIN_HUEVO = 'Sin huevo se sostienen mejor si son pequeños, del tamaño de la palma.';
const MOLDE = 'Pasa el molde por agua tibia unos segundos para desmoldar.';

/** Panqueques sin huevo: el plátano y la avena licuados con poco líquido hacen de liga. */
const panqueques = (base: string, liquid: string, end: string): Step[] => [
  ['licuar', `Licúa ${base} con solo un chorrito de ${liquid}: la mezcla debe quedar espesa.`, 30],
  ['reposar', 'Déjala reposar para que la avena se hidrate y espese.', 180],
  ['sarten', 'Cocina panqueques pequeños a fuego medio-bajo; voltéalos cuando salgan burbujas arriba.', 120],
  ['servir', end],
];

const paletas = (what: string, extra?: string): Step[] => [
  ['licuar', `Licúa ${what}.`, 30],
  ['servir', `Vierte en moldes de paleta${extra ? ` y ${extra}` : ''}.`],
  ['reposar', 'Congela mínimo 4 horas.'],
];

const muffins = (mix: Step[], end: string): Step[] => [
  ...mix,
  ['servir', 'Reparte la mezcla en moldes de silicona, sin llenarlos hasta arriba.'],
  ['tostar', 'Cocínalos en la airfryer a 160 °C hasta que cuajen.', 600],
  ['servir', end],
];

export const VERSIONS: Record<string, Version[]> = {
  // ── Batidos ──
  'batido-avena-platano-yogur': [
    [
      'panqueques',
      'Panqueques de avena, plátano y yogur',
      15,
      2,
      PANQ,
      panqueques('la avena, el plátano y el yogur', 'la leche', 'Sírvelos con el resto de la leche en un vaso.'),
      [SIN_HUEVO, SIN_ACEITE],
    ],
    [
      'dulce',
      'Avena remojada con yogur y plátano',
      5,
      1,
      'Frasco o táper',
      [
        ['mezclar', 'Mezcla la avena con la leche y el yogur en un frasco.'],
        ['reposar', 'Tápalo y déjalo en la refri toda la noche.'],
        ['cortar', 'En la mañana, corta el plátano encima.'],
      ],
      ['Dura 3 días en la refri: prepara varios frascos de una vez.'],
    ],
  ],
  'batido-platano-pbut': [
    [
      'dulce',
      'Helado de plátano y maní',
      10,
      1,
      'Licuadora o procesador',
      [
        ['cortar', 'Corta el plátano en rodajas y congélalo al menos 3 horas.'],
        [
          'licuar',
          'Licúa el plátano congelado con la mantequilla de maní y un chorrito de la leche hasta que quede cremoso.',
          60,
        ],
        ['servir', 'Sírvelo como helado y toma el resto de la leche aparte.'],
      ],
      ['Si la licuadora se traba, detenla, mueve con una cuchara y sigue.'],
    ],
  ],
  'batido-whey-avena': [
    [
      'panqueques',
      'Panqueques proteicos de avena y plátano',
      15,
      2,
      PANQ,
      panqueques('la avena, el plátano y la proteína', 'la leche', 'Sírvelos con el resto de la leche.'),
      ['La proteína en polvo se quema rápido: fuego bajo.', SIN_ACEITE],
    ],
    [
      'dulce',
      'Avena proteica con plátano',
      10,
      1,
      'Olla pequeña',
      [
        ['hervir', 'Cocina la avena en la leche a fuego medio, removiendo.', 300],
        ['mezclar', 'Apaga el fuego y recién ahí mezcla la proteína: con el fuego prendido se hace grumos.'],
        ['servir', 'Sirve con el plátano en rodajas.'],
      ],
      [],
    ],
  ],
  'batido-verde-proteina': [
    [
      'dulce',
      'Bowl verde de piña',
      5,
      1,
      'Licuadora,Bowl',
      [
        [
          'licuar',
          'Licúa la espinaca, la proteína y la mitad de la piña con poca bebida de almendras: debe quedar espeso.',
          45,
        ],
        ['servir', 'Sírvelo en un bowl y cúbrelo con el resto de la piña picada.'],
        ['servir', 'Toma el resto de la bebida aparte.'],
      ],
      ['Con piña congelada queda como helado.'],
    ],
  ],
  'batido-fresa-yogur': [
    [
      'dulce',
      'Bowl de yogur con fresas',
      5,
      1,
      'Bowl,Cuchillo',
      [
        ['cortar', 'Lava las fresas y córtalas en láminas.'],
        ['servir', 'Sirve el yogur y cúbrelo con las fresas.'],
        ['servir', 'Acompáñalo con la leche en un vaso.'],
      ],
      [],
    ],
    [
      'dulce',
      'Paletas heladas de fresa y yogur',
      10,
      1,
      'Licuadora,Moldes de paleta',
      paletas('las fresas con el yogur y la leche'),
      [MOLDE],
    ],
  ],
  'avena-leche-bebida': [
    [
      'dulce',
      'Avena cocida con plátano',
      10,
      1,
      'Olla pequeña',
      [
        ['hervir', 'Cocina la avena en la leche a fuego bajo, removiendo.', 300],
        ['cortar', 'Corta el plátano en rodajas.'],
        ['servir', 'Sirve la avena en plato con el plátano encima y canela.'],
      ],
      [],
    ],
    [
      'panqueques',
      'Panqueques de avena y plátano sin huevo',
      15,
      2,
      PANQ,
      panqueques('la avena y el plátano', 'la leche', 'Sírvelos con el resto de la leche.'),
      [SIN_HUEVO, SIN_ACEITE],
    ],
  ],

  // ── Avenas, quinuas y bowls ──
  'avena-cocida-pbut': [
    [
      'batido',
      'Batido de avena, plátano y maní',
      5,
      1,
      'Licuadora',
      [
        ['licuar', 'Licúa la leche, la avena, el plátano y la mantequilla de maní con hielo.', 60],
        ['servir', 'Tómalo al momento.'],
      ],
      [],
    ],
    [
      'panqueques',
      'Panqueques de avena y plátano con maní',
      15,
      2,
      PANQ,
      panqueques(
        'la avena y el plátano',
        'la leche',
        'Úntalos con la mantequilla de maní y toma el resto de la leche aparte.',
      ),
      [SIN_HUEVO, SIN_ACEITE],
    ],
  ],
  'avena-claras-fresas': [
    [
      'panqueques',
      'Panqueques de avena y claras con fresas',
      15,
      2,
      PANQ,
      [
        ['licuar', 'Licúa la avena con las claras y un chorrito de la leche.', 30],
        ['sarten', 'Cocina panqueques a fuego medio-bajo; voltéalos cuando salgan burbujas arriba.', 120],
        ['cortar', 'Corta las fresas en láminas.'],
        ['servir', 'Cúbrelos con las fresas y toma el resto de la leche aparte.'],
      ],
      ['Las claras los dejan esponjosos y altos en proteína.', SIN_ACEITE],
    ],
  ],
  'avena-soya-linaza': [
    [
      'panqueques',
      'Panqueques veganos de avena, plátano y linaza',
      15,
      2,
      PANQ,
      [
        [
          'mezclar',
          'Mezcla la linaza molida con 3 cucharadas de agua y espera a que se ponga gelatinosa: reemplaza al huevo.',
          300,
        ],
        ['licuar', 'Licúa la avena, el plátano, la linaza y un chorrito de la bebida de soya.', 30],
        ['sarten', 'Cocina panqueques pequeños a fuego bajo; voltéalos cuando salgan burbujas.', 120],
        ['servir', 'Sírvelos con el resto de la bebida de soya.'],
      ],
      ['Si la linaza está entera, muélela antes en la licuadora.', SIN_ACEITE],
    ],
    [
      'batido',
      'Batido de avena, plátano y linaza',
      5,
      1,
      'Licuadora',
      [
        ['licuar', 'Licúa la bebida de soya con la avena, el plátano, la linaza y hielo.', 60],
        ['servir', 'Tómalo al momento.'],
      ],
      [],
    ],
  ],
  'avena-fria-almendras': [
    [
      'airfryer',
      'Galletas de avena y plátano en airfryer',
      20,
      1,
      'Airfryer,Bowl,Tenedor',
      [
        ['mezclar', 'Aplasta el plátano con un tenedor y mézclalo con la avena hasta formar una masa.'],
        ['cortar', 'Pica las almendras e intégralas a la masa.'],
        ['servir', 'Forma galletas planas del tamaño de una cuchara y ponlas sobre papel de hornear en la canasta.'],
        ['tostar', 'Cocínalas en la airfryer a 170 °C hasta que estén doradas.', 600],
        ['reposar', 'Déjalas enfriar: se ponen firmes al enfriarse.', 300],
      ],
      ['Duran 4 días en un táper.', 'Una pizca de canela les da sabor de galleta de casa.'],
    ],
  ],
  'pudin-chia-mango': [
    [
      'batido',
      'Batido de mango con chía',
      5,
      1,
      'Licuadora',
      [
        ['licuar', 'Licúa la leche con el mango y hielo.', 45],
        ['mezclar', 'Agrega la chía, mezcla y espera a que se hidrate.', 300],
        ['servir', 'Tómalo removiendo.'],
      ],
      [],
    ],
  ],
  'bowl-yogur-avena': [
    [
      'batido',
      'Batido de yogur, avena y plátano',
      5,
      1,
      'Licuadora',
      [
        ['licuar', 'Licúa el yogur, la avena, el plátano y las almendras con hielo y un chorrito de agua.', 60],
        ['servir', 'Tómalo al momento.'],
      ],
      [],
    ],
    [
      'panqueques',
      'Panqueques de yogur y avena',
      15,
      2,
      PANQ,
      panqueques('la avena, el plátano y el yogur', 'agua', 'Sírvelos con las almendras picadas encima.'),
      ['Una pizca de polvo de hornear los hace más esponjosos.', SIN_ACEITE],
    ],
  ],
  'yogur-platano-almendras': [
    [
      'batido',
      'Batido de plátano, yogur y almendras',
      5,
      1,
      'Licuadora',
      [
        ['licuar', 'Licúa el yogur con el plátano, las almendras, hielo y un chorrito de agua.', 60],
        ['servir', 'Tómalo al momento.'],
      ],
      [],
    ],
    [
      'dulce',
      'Paletas heladas de yogur y plátano',
      10,
      1,
      'Licuadora,Moldes de paleta',
      paletas('el yogur con el plátano', 'agrega las almendras picadas'),
      [MOLDE],
    ],
  ],
  'yogur-granola-arandanos': [
    [
      'dulce',
      'Parfait en vaso para llevar',
      5,
      1,
      'Vaso o frasco',
      [
        ['servir', 'En un vaso, pon una capa de yogur y una de arándanos, y repite.'],
        ['servir', 'Lleva la granola aparte y agrégala al momento de comer.'],
      ],
      ['Así la granola sigue crocante hasta la hora de comer.'],
    ],
    [
      'batido',
      'Batido de arándanos y yogur con granola',
      5,
      1,
      'Licuadora',
      [
        ['licuar', 'Licúa el yogur con los arándanos, hielo y un chorrito de agua.', 45],
        ['servir', 'Sírvelo y espolvorea la granola encima.'],
      ],
      [],
    ],
  ],
  'papaya-yogur-kiwicha': [
    [
      'batido',
      'Batido de papaya y yogur con kiwicha',
      5,
      1,
      'Licuadora,Vaso',
      [
        ['cortar', 'Pela la papaya, quítale las pepas y córtala en trozos.'],
        ['licuar', 'Licúa la papaya con el yogur, hielo y un chorrito de agua.', 45],
        ['servir', 'Sírvelo y pon la kiwicha pop encima, o mézclala para que espese.'],
      ],
      ['Unas gotas de limón realzan el sabor de la papaya.'],
    ],
    [
      'dulce',
      'Parfait de papaya en vaso',
      5,
      1,
      'Vaso o frasco,Cuchillo',
      [
        ['cortar', 'Corta la papaya en cubitos.'],
        ['servir', 'En un vaso, alterna capas de yogur, papaya y kiwicha.'],
        ['servir', 'Termina con kiwicha arriba.'],
      ],
      ['Si lo llevas, pon la kiwicha aparte para que no se ablande.'],
    ],
    [
      'dulce',
      'Paletas heladas de papaya y yogur',
      10,
      1,
      'Licuadora,Moldes de paleta',
      paletas('la papaya con el yogur', 'espolvorea la kiwicha'),
      [MOLDE],
    ],
  ],
  'quinua-leche-manzana': [
    [
      'batido',
      'Jugo de quinua con manzana',
      15,
      1,
      'Olla,Licuadora',
      [
        ['cortar', 'Pica la manzana en trozos.'],
        ['hervir', 'Hierve la manzana con un poco de agua y canela hasta que esté suave.', 480],
        ['licuar', 'Licúa la quinua cocida con la manzana y la leche.', 45],
        ['servir', 'Sírvelo tibio o frío.'],
      ],
      ['Es el clásico jugo de quinua de los mercados, sin azúcar.', QUINUA],
    ],
  ],
  'quinua-soya-manzana': [
    [
      'batido',
      'Jugo de quinua con manzana y chía',
      15,
      1,
      'Olla,Licuadora',
      [
        ['cortar', 'Pica la manzana en trozos.'],
        ['hervir', 'Hierve la manzana con un poco de agua y canela hasta que esté suave.', 480],
        ['licuar', 'Licúa la quinua cocida con la manzana y la bebida de soya.', 45],
        ['servir', 'Agrega la chía, mezcla y sírvelo.'],
      ],
      [QUINUA],
    ],
  ],
  'quinua-yogur-mango': [
    [
      'batido',
      'Batido de mango, yogur y quinua',
      5,
      1,
      'Licuadora',
      [
        ['cortar', 'Pela el mango y córtalo en trozos.'],
        ['licuar', 'Licúa el mango con el yogur, la quinua cocida, hielo y un chorrito de agua.', 60],
        ['servir', 'Sírvelo con la chía encima.'],
      ],
      [QUINUA],
    ],
  ],
  'cottage-pina': [
    [
      'batido',
      'Batido de piña y cottage',
      5,
      1,
      'Licuadora',
      [
        ['licuar', 'Licúa el cottage con la piña, hielo y un chorrito de agua hasta que quede liso.', 60],
        ['servir', 'Tómalo al momento.'],
      ],
      ['El cottage licuado queda cremoso como yogur.'],
    ],
    [
      'airfryer',
      'Piña asada con cottage',
      15,
      1,
      'Airfryer,Cuchillo',
      [
        ['cortar', 'Corta la piña en rodajas o bastones.'],
        ['tostar', 'Ásala en la airfryer a 200 °C hasta que se dore.', 600],
        ['servir', 'Sírvela tibia con el cottage y canela.'],
      ],
      [],
    ],
  ],
  'fruta-nueces': [
    [
      'airfryer',
      'Piña asada con papaya y nueces',
      15,
      1,
      'Airfryer,Cuchillo',
      [
        ['cortar', 'Corta la piña en bastones y la papaya en cubos.'],
        ['tostar', 'Asa la piña en la airfryer a 200 °C hasta que se dore.', 600],
        ['servir', 'Sírvela con la papaya y las nueces troceadas.'],
      ],
      [],
    ],
    [
      'batido',
      'Batido de papaya y piña con nueces',
      5,
      1,
      'Licuadora',
      [
        ['licuar', 'Licúa la papaya y la piña con hielo y un chorrito de agua.', 45],
        ['servir', 'Sírvelo con las nueces troceadas encima.'],
      ],
      [],
    ],
  ],
  'manzana-pbut': [
    [
      'airfryer',
      'Chips de manzana con dip de maní',
      20,
      1,
      'Airfryer,Cuchillo',
      [
        ['cortar', 'Corta la manzana en rodajas muy finas, sin el centro.'],
        ['tostar', 'Cocínalas en la airfryer a 160 °C, volteándolas a la mitad.', 900],
        ['reposar', 'Déjalas enfriar: ahí se ponen crocantes.', 300],
        ['servir', 'Úsalas para untar la mantequilla de maní.'],
      ],
      ['Espolvorea canela antes de cocinarlas.'],
    ],
  ],
  'pan-pbut-platano': [
    [
      'airfryer',
      'Tostada de plátano caramelizado',
      10,
      1,
      'Airfryer,Cuchillo',
      [
        ['untar', 'Unta la mantequilla de maní en el pan.'],
        ['cortar', 'Corta el plátano en rodajas y colócalo encima.'],
        ['tostar', 'Cocínalo en la airfryer a 190 °C hasta que el plátano se dore.', 360],
        ['servir', 'Sírvelo con canela.'],
      ],
      [],
    ],
  ],

  // ── Huevos ──
  'panqueques-avena-platano': [
    [
      'airfryer',
      'Muffins de avena y plátano en airfryer',
      20,
      1,
      'Licuadora,Airfryer,Moldes de silicona',
      muffins(
        [['licuar', 'Licúa la avena, los huevos y el plátano hasta tener una mezcla lisa.', 30]],
        'Desmóldalos y termínalos con la miel.',
      ),
      ['Duran 3 días en un táper: ideales para llevar.'],
    ],
  ],
  'tortilla-pan-jamon': [
    [
      'airfryer',
      'Muffins de huevo y jamón',
      15,
      1,
      'Airfryer,Moldes de silicona,Bowl',
      muffins(
        [
          ['cortar', 'Pica el jamón y el tomate en cubitos.'],
          ['batir', 'Bate los huevos con sal y mézclalos con el jamón y el tomate.'],
        ],
        'Sírvelos con el pan.',
      ),
      ['Haz varios: duran 3 días en la refri y se calientan en un minuto.'],
    ],
    [
      'salado',
      'Sándwich de tortilla de huevo',
      10,
      1,
      'Sartén antiadherente,Bowl',
      [
        ['batir', 'Bate los huevos con sal y pica el jamón.'],
        ['sarten', 'Cocina una tortilla delgada con el jamón, volteándola a la mitad.', 120],
        ['servir', 'Ponla dentro del pan con el tomate en rodajas.'],
      ],
      [SIN_ACEITE],
    ],
  ],
  'pan-palta-huevos': [
    [
      'airfryer',
      'Huevo en canasta de pan con palta',
      12,
      1,
      'Airfryer,Vaso',
      [
        ['cortar', 'Con un vaso, haz un hueco en el centro de cada tajada de pan.'],
        ['servir', 'Pon el pan en la canasta y rompe un huevo dentro de cada hueco.'],
        ['tostar', 'Cocínalos en la airfryer a 180 °C hasta que la clara cuaje.', 420],
        ['untar', 'Sírvelos con la palta aplastada con sal y limón.'],
      ],
      ['Pon papel de hornear debajo para que el huevo no se escurra.'],
    ],
    [
      'salado',
      'Huevos pochados sobre pan con palta',
      10,
      2,
      'Olla,Cuchara',
      [
        ['tostar', 'Tuesta el pan y unta la palta aplastada con sal.', 120],
        ['hervir', 'Hierve agua, baja el fuego a que apenas burbujee y haz un remolino con una cuchara.'],
        ['hervir', 'Deja caer cada huevo al centro del remolino y cocínalo.', 180],
        ['servir', 'Sácalo con una espumadera y ponlo sobre el pan.'],
      ],
      ['Un chorrito de vinagre en el agua ayuda a que la clara no se desarme.'],
    ],
  ],
  'omelette-espinaca-queso': [
    [
      'airfryer',
      'Muffins de huevo, espinaca y queso',
      15,
      1,
      'Airfryer,Moldes de silicona,Bowl',
      muffins(
        [
          ['batir', 'Bate los huevos con sal.'],
          ['cortar', 'Pica la espinaca, desmenuza el queso y mézclalos con el huevo.'],
        ],
        'Sírvelos con el pan.',
      ),
      [],
    ],
  ],
  'wrap-huevo-jamon': [
    [
      'airfryer',
      'Wrap crocante en airfryer',
      12,
      1,
      'Sartén antiadherente,Airfryer',
      [
        ['sarten', 'Revuelve los huevos con el jamón en la sartén hasta que cuajen.', 120],
        ['servir', 'Rellena la tortilla con el huevo y el queso y ciérrala doblando los lados.'],
        ['tostar', 'Dórala en la airfryer a 190 °C, con la unión hacia abajo.', 240],
        ['servir', 'Córtala en diagonal.'],
      ],
      [],
    ],
  ],
  'camote-huevos-revueltos': [
    [
      'airfryer',
      'Bastones de camote con huevos revueltos',
      25,
      1,
      'Airfryer,Sartén antiadherente',
      [
        ['cortar', 'Pela el camote y córtalo en bastones.'],
        ['tostar', 'Cocínalos en la airfryer a 200 °C, moviendo la canasta a la mitad.', 1080],
        ['sarten', 'Mientras tanto, revuelve los huevos con el tomate picado hasta que cuajen.', 120],
        ['servir', 'Sirve los bastones con los huevos.'],
      ],
      ['Sécalos bien con papel antes de la airfryer: quedan más crocantes.'],
    ],
  ],
  'huevos-rancheros': [
    [
      'airfryer',
      'Totopos caseros con frijoles y huevo',
      20,
      1,
      'Airfryer,Sartén antiadherente',
      [
        ['cortar', 'Corta las tortillas en triángulos.'],
        ['tostar', 'Tuéstalos en la airfryer a 180 °C hasta que estén crocantes.', 360],
        ['hervir', 'Calienta los frijoles y fríe los huevos con unas gotas de aceite.', 180],
        ['servir', 'Sirve los totopos con los frijoles, los huevos y el tomate picado.'],
      ],
      [],
    ],
  ],
  'quinua-huevo-verduras': [
    [
      'airfryer',
      'Tortitas de quinua y verduras',
      20,
      2,
      'Bowl,Airfryer',
      [
        ['mezclar', 'Mezcla la quinua cocida con los huevos batidos, las verduras picadas y sal.'],
        ['servir', 'Forma tortitas con las manos o con una cuchara.'],
        ['untar', 'Píntalas con el aceite.'],
        ['tostar', 'Cocínalas en la airfryer a 190 °C, volteándolas a la mitad.', 720],
        ['servir', 'Sírvelas con ensalada o salsa criolla.'],
      ],
      [QUINUA],
    ],
  ],
  'huevos-duros-manzana': [
    [
      'airfryer',
      'Huevos "duros" en airfryer',
      15,
      1,
      'Airfryer',
      [
        ['tostar', 'Pon los huevos crudos en la canasta y cocínalos a 140 °C.', 840],
        ['reposar', 'Pásalos a agua fría y pélalos.', 120],
        ['servir', 'Sírvelos con la manzana en gajos.'],
      ],
      ['Sin olla ni agua: la airfryer los deja igual que sancochados.'],
    ],
  ],
  'pan-frances-huevo-palta': [
    [
      'salado',
      'Pan con ensalada de huevo y palta',
      15,
      1,
      'Olla pequeña,Bowl,Tenedor',
      [
        ...HUEVO_DURO,
        ['mezclar', 'Aplasta los huevos con la palta, sal y unas gotas de limón.'],
        ['servir', 'Rellena el pan con la mezcla.'],
      ],
      [],
    ],
  ],
  'yuca-queso-huevo': [
    [
      'airfryer',
      'Yuca dorada con queso',
      35,
      1,
      'Olla,Airfryer',
      [
        ['hervir', 'Sancocha la yuca pelada en trozos hasta que esté suave.', 1200],
        ['hervir', 'En otra olla, sancocha el huevo 10 minutos desde que hierve.', 600],
        ['tostar', 'Escurre la yuca y dórala en la airfryer a 200 °C.', 600],
        ['servir', 'Sírvela con el queso y el huevo.'],
      ],
      ['Como yuca frita, sin una gota de aceite.'],
    ],
  ],
  'codorniz-tomate': [
    [
      'salado',
      'Brochetas de codorniz y tomate',
      10,
      1,
      'Olla pequeña,Palitos de brocheta',
      [
        ['hervir', 'Sancocha los huevos y pélalos.', 240],
        ['servir', 'Ensarta los huevos alternándolos con los tomates.'],
        ['servir', 'Sírvelas con sal y orégano.'],
      ],
      [],
    ],
  ],
  'sandwich-huevo': [
    [
      'salado',
      'Sándwich de ensalada de huevo',
      15,
      1,
      'Olla pequeña,Tenedor',
      [
        ...HUEVO_DURO,
        ['mezclar', 'Aplasta los huevos con sal, pimienta y mostaza.'],
        ['servir', 'Arma el sándwich con la lechuga.'],
      ],
      [],
    ],
  ],

  // ── Panes y sándwiches ──
  'sandwich-queso-jamon': [
    [
      'airfryer',
      'Sándwich tostado en airfryer',
      8,
      1,
      'Airfryer',
      [
        ['servir', 'Arma el sándwich con el queso y el jamón.'],
        ['tostar', 'Tuéstalo en la airfryer a 190 °C, volteándolo a la mitad.', 300],
        ['servir', 'Acompáñalo con la leche.'],
      ],
      [],
    ],
  ],
  'pan-queso-tomate-leche': [
    [
      'airfryer',
      'Pan con queso y tomate gratinado',
      8,
      1,
      'Airfryer,Cuchillo',
      [
        ['cortar', 'Abre el pan y corta el queso y el tomate en tajadas.'],
        ['servir', 'Pon el tomate y el queso sobre cada mitad, con orégano.'],
        ['tostar', 'Gratínalo en la airfryer a 190 °C hasta que el queso se ablande.', 300],
        ['servir', 'Acompáñalo con la leche.'],
      ],
      [],
    ],
  ],
  'pan-pollo-lechuga': [
    [
      'airfryer',
      'Pan con pollo tostado',
      10,
      1,
      'Airfryer,Bowl,Tenedor',
      [
        ['cortar', 'Deshilacha el pollo cocido.'],
        ['mezclar', 'Mézclalo con la mayonesa, sal y pimienta.'],
        ['tostar', 'Rellena el pan y tuéstalo en la airfryer a 190 °C.', 240],
        ['servir', 'Agrega la lechuga al servir para que siga crocante.'],
      ],
      [],
    ],
  ],
  'sandwich-atun': [
    [
      'salado',
      'Palta rellena de atún',
      5,
      1,
      'Cuchillo,Bowl',
      [
        ['cortar', 'Corta la palta por la mitad y quítale la pepa.'],
        ['mezclar', 'Mezcla el atún escurrido con el tomate picado, sal y limón.'],
        ['servir', 'Rellena las mitades de palta y acompaña con el pan.'],
      ],
      ['Un clásico peruano: queda mejor con un poco de culantro.'],
    ],
  ],
  'sandwich-pavo-palta': [
    [
      'airfryer',
      'Sándwich de pavo hecho en airfryer',
      20,
      1,
      'Airfryer,Cuchillo',
      [
        ['cortar', 'Corta el pavo en filetes delgados y sazónalos con sal, pimienta y orégano.'],
        ['tostar', 'Cocínalos en la airfryer a 190 °C, volteándolos a la mitad.', 600],
        ['untar', 'Unta la palta en el pan y corta el tomate.'],
        ['servir', 'Arma el sándwich con el pavo.'],
      ],
      ['El pavo queda jugoso si no lo pasas de tiempo: debe estar blanco por dentro.'],
    ],
  ],
  'tofu-pan-palta': [
    [
      'airfryer',
      'Tofu crocante sobre pan con palta',
      20,
      1,
      'Airfryer,Cuchillo',
      [
        ['cortar', 'Seca el tofu y córtalo en cubos.'],
        ['mezclar', 'Sazónalo con sal, pimienta y pimentón.'],
        ['tostar', 'Cocínalo en la airfryer a 200 °C, moviendo la canasta a la mitad.', 900],
        ['untar', 'Unta la palta en el pan tostado y pon el tofu encima.'],
      ],
      [],
    ],
  ],
  'tofu-revuelto-tortilla': [
    [
      'airfryer',
      'Tacos de tofu crocante',
      20,
      1,
      'Airfryer,Sartén',
      [
        ['cortar', 'Seca el tofu, córtalo en cubos y mézclalo con el aceite, sal y comino.'],
        ['tostar', 'Cocínalo en la airfryer a 200 °C, moviendo a la mitad.', 900],
        ['sarten', 'Saltea la espinaca un minuto y calienta las tortillas.', 60],
        ['servir', 'Arma los tacos con la espinaca y el tofu.'],
      ],
      [],
    ],
  ],
  'tostadas-palta-edamame': [
    [
      'airfryer',
      'Tostadas de palta con edamame crocante',
      15,
      1,
      'Airfryer,Tenedor',
      [
        ['mezclar', 'Seca el edamame pelado y sazónalo con sal y ajo en polvo.'],
        ['tostar', 'Tuéstalo en la airfryer a 200 °C.', 600],
        ['untar', 'Unta la palta en las tostadas y pon el tomate.'],
        ['servir', 'Pon el edamame crocante encima.'],
      ],
      [],
    ],
  ],

  // ── Tubérculos y snacks ──
  'mote-queso': [
    [
      'airfryer',
      'Mote crocante con queso',
      15,
      1,
      'Airfryer',
      [
        ['mezclar', 'Seca el mote sancochado con papel y sazónalo con sal.'],
        ['tostar', 'Tuéstalo en la airfryer a 200 °C, moviendo la canasta a la mitad.', 720],
        ['servir', 'Sírvelo con el queso en cubos.'],
      ],
      ['Queda tipo cancha, para picar.'],
    ],
  ],
  'choclo-queso': [
    [
      'airfryer',
      'Choclo asado en airfryer',
      20,
      1,
      'Airfryer',
      [
        ['cortar', 'Corta el choclo en dos o tres trozos.'],
        ['tostar', 'Ásalo en la airfryer a 200 °C, girándolo a la mitad.', 900],
        ['servir', 'Sírvelo con el queso.'],
      ],
      [],
    ],
  ],
  'edamame-limon': [
    [
      'airfryer',
      'Edamame crocante al limón',
      15,
      1,
      'Airfryer',
      [
        ['mezclar', 'Pela el edamame, sécalo y sazónalo con sal.'],
        ['tostar', 'Tuéstalo en la airfryer a 200 °C, moviendo la canasta a la mitad.', 600],
        ['servir', 'Rocíalo con el limón al servir.'],
      ],
      [],
    ],
  ],
  // ── Almuerzos y cenas ──
  'pollo-horno-papas': [
    [
      'airfryer',
      'Pollo y papas en airfryer',
      30,
      1,
      'Airfryer',
      [
        ['cortar', 'Corta las papas en gajos y sazona las papas y el pollo con sal, ajo, comino y el aceite.'],
        ['tostar', 'Cocínalos en la airfryer a 190 °C, moviendo la canasta a la mitad.', 1500],
        ['servir', 'Sirve con la ensalada.'],
      ],
      ['El pollo está listo cuando su jugo sale transparente.'],
    ],
  ],
  'lomo-saltado-casero': [
    [
      'airfryer',
      'Lomo saltado con papas en airfryer',
      35,
      2,
      'Airfryer,Sartén grande o wok',
      [
        ['cortar', 'Corta la papa en bastones, sécala y sazónala con sal.'],
        ['tostar', 'Cocínala en la airfryer a 200 °C, moviendo la canasta a la mitad.', 1080],
        [
          'sarten',
          'Saltea la res en el aceite a fuego muy alto y agrega la cebolla y el tomate en gajos con un chorrito de sillao.',
          240,
        ],
        ['servir', 'Mezcla con las papas y sirve con el arroz.'],
      ],
      ['Papas doradas como fritas, sin una gota de aceite.'],
    ],
  ],
  'hamburguesa-plato-camote': [
    [
      'airfryer',
      'Hamburguesa con camote en airfryer',
      30,
      1,
      'Airfryer',
      [
        ['cortar', 'Corta el camote en bastones y sazónalo con sal.'],
        ['tostar', 'Cocínalo en la airfryer a 200 °C, moviendo la canasta a la mitad.', 900],
        ['mezclar', 'Sazona la carne molida con sal, pimienta y ajo y forma la hamburguesa.'],
        ['tostar', 'Cocínala en la airfryer a 180 °C, volteándola a la mitad.', 600],
        ['servir', 'Sírvela con el camote y la ensalada.'],
      ],
      [],
    ],
  ],

  'hummus-bastones': [
    [
      'airfryer',
      'Garbanzos crocantes con bastones',
      20,
      1,
      'Airfryer,Cuchillo',
      [
        ['mezclar', 'Seca bien los garbanzos cocidos y mézclalos con el aceite, sal, comino y pimentón.'],
        ['tostar', 'Tuéstalos en la airfryer a 200 °C, moviendo a la mitad.', 900],
        ['cortar', 'Corta la zanahoria y el pepino en bastones, con limón y sal.'],
        ['servir', 'Sírvelos juntos para picar.'],
      ],
      ['Se ponen más crocantes al enfriarse.'],
    ],
  ],
};
