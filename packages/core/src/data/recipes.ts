import type { Recipe } from '../types';

/** Porciones base en gramos (sección 11.2). slots: D desayuno · S snack · A almuerzo · C cena. */
type Row = [string, string, string, string, string];

const ROWS: Row[] = [
  ['batido-avena-platano-yogur', 'Batido de avena, plátano y yogur', 'DS', 'leche:300,avena:50,platano:100,yogur:120', 'Licúa todo con hielo 1 minuto y bébelo al momento.'],
  ['tortilla-pan-jamon', 'Tortilla de huevo con pan y jamón de pavo', 'D', 'huevo:150,jamon:40,pan:60,tomate:60', 'Bate los huevos, cocínalos con el jamón y sirve con el pan y el tomate.'],
  ['avena-cocida-pbut', 'Avena cocida con plátano y mantequilla de maní', 'D', 'avena:60,leche:250,platano:100,pbut:15', 'Cocina la avena en la leche 5 minutos y agrega el plátano en rodajas.'],
  ['pan-palta-huevos', 'Pan con palta y huevos revueltos', 'D', 'pan:80,palta:60,huevo:100', 'Tuesta el pan, unta la palta y coloca encima los huevos revueltos.'],
  ['bowl-yogur-avena', 'Bowl de yogur griego, avena y fruta', 'DS', 'yogur:200,avena:40,platano:100,almendra:15', 'Mezcla el yogur con la avena cruda y cubre con plátano y almendras.'],
  ['sandwich-queso-jamon', 'Sándwich de queso fresco y jamón de pavo con leche', 'DS', 'pan:80,queso:50,jamon:40,leche:250', 'Arma el sándwich y acompáñalo con un vaso de leche.'],
  ['quinua-leche-manzana', 'Quinua con leche y manzana', 'D', 'quinua:150,leche:250,manzana:100', 'Calienta la quinua cocida con la leche y agrega la manzana picada.'],
  ['tofu-pan-palta', 'Tofu revuelto con pan y palta', 'D', 'tofu:150,pan:70,palta:50', 'Sofríe el tofu desmenuzado y sírvelo sobre el pan con palta.'],
  ['avena-fria-almendras', 'Avena fría con plátano y almendras', 'D', 'avena:60,platano:120,almendra:20', 'Remoja la avena con agua toda la noche y agrega la fruta y las almendras.'],
  ['batido-platano-pbut', 'Batido de plátano y mantequilla de maní', 'S', 'leche:300,platano:100,pbut:20', 'Licúa la leche con el plátano y la mantequilla de maní.'],
  ['sandwich-atun', 'Sándwich de atún con tomate y palta', 'SA', 'pan:80,atun:80,tomate:60,palta:30', 'Mezcla el atún con la palta y arma el sándwich con el tomate.'],
  ['huevos-duros-manzana', 'Huevos duros con manzana', 'S', 'huevo:100,manzana:150', 'Hierve los huevos 10 minutos y acompáñalos con la fruta.'],
  ['yogur-platano-almendras', 'Yogur griego con plátano y almendras', 'S', 'yogur:170,platano:100,almendra:15', 'Corta el plátano sobre el yogur y agrega las almendras.'],
  ['pollo-arroz-ensalada', 'Pollo a la plancha con arroz y ensalada', 'AC', 'pollo:150,arroz:200,ensal:100,aceite:8', 'Sella el pollo con poca sal y sírvelo con el arroz y la ensalada.'],
  ['trucha-papa-ensalada', 'Trucha con papa sancochada y ensalada', 'AC', 'trucha:180,papa:250,ensal:100', 'Cocina la trucha a la plancha y acompáñala con la papa.'],
  ['lentejas-arroz-huevo', 'Lentejas con arroz y huevo frito', 'AC', 'lenteja:250,arroz:150,huevo:50', 'Sirve las lentejas guisadas sobre el arroz y coloca el huevo encima.'],
  ['atun-quinua-brocoli', 'Atún con quinua, brócoli y palta', 'AC', 'atun:140,quinua:200,broc:120,palta:40', 'Mezcla la quinua tibia con el atún y el brócoli al vapor.'],
  ['camarones-camote', 'Camarones salteados con camote', 'AC', 'camaron:150,camote:250,ensal:100,aceite:8', 'Saltea los camarones a fuego alto y sírvelos con el camote.'],
  ['lomo-res-papa-arroz', 'Lomo de res con papa, arroz y tomate', 'A', 'res:150,papa:200,arroz:100,tomate:80', 'Saltea la res en tiras y sírvela con la papa, el arroz y el tomate.'],
  ['fideos-pollo-brocoli', 'Fideos con pollo y brócoli', 'AC', 'pollo:150,fideo:180,broc:100,aceite:8', 'Mezcla los fideos con el pollo en trozos y el brócoli.'],
  ['tortilla-papa-ensalada', 'Tortilla de papa con ensalada', 'C', 'huevo:200,papa:150,ensal:100', 'Bate los huevos, agrega la papa cocida y cuaja la tortilla.'],
  ['arroz-tofu-brocoli', 'Arroz salteado con tofu y brócoli', 'AC', 'tofu:180,arroz:200,broc:100,aceite:8', 'Saltea el tofu, agrega el arroz y el brócoli.'],
  ['cerdo-camote-ensalada', 'Lomo de cerdo con camote y ensalada', 'AC', 'cerdo:150,camote:250,ensal:100', 'Cocina el cerdo a la plancha y sírvelo con el camote.'],
];

export const RECIPES: Recipe[] = ROWS.map(([id, name, slots, items, how]) => ({
  id,
  name,
  slots,
  how,
  items: items.split(',').map((s) => {
    const [foodId, g] = s.split(':');
    return { foodId, grams: Number(g) };
  }),
}));
