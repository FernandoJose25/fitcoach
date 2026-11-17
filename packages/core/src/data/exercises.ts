/** Catálogo corto v1 (sección 11.3). Fase posterior: free-exercise-db con imágenes. */
export const EXERCISES: Record<string, { gym: string[]; home: string[] }> = {
  pecho: {
    gym: ['Press banca', 'Press inclinado con mancuernas', 'Aperturas en polea'],
    home: ['Flexiones', 'Flexiones con pies elevados', 'Flexiones diamante'],
  },
  espalda: {
    gym: ['Jalón al pecho', 'Remo con barra', 'Remo en polea baja'],
    home: ['Remo invertido en mesa', 'Remo con mochila', 'Superman'],
  },
  pierna: {
    gym: ['Sentadilla con barra', 'Prensa de piernas', 'Peso muerto rumano', 'Zancadas con mancuernas'],
    home: ['Sentadilla búlgara', 'Zancadas', 'Puente de glúteo', 'Sentadilla con mochila'],
  },
  hombro: {
    gym: ['Press militar', 'Elevaciones laterales', 'Face pull'],
    home: ['Pike push-ups', 'Elevaciones con botellas', 'Flexiones en pica'],
  },
  triceps: {
    gym: ['Extensión en polea', 'Press francés', 'Fondos en paralelas'],
    home: ['Fondos en silla', 'Flexiones cerradas', 'Extensión con mochila'],
  },
  biceps: {
    gym: ['Curl con barra', 'Curl martillo', 'Curl en polea'],
    home: ['Curl con mochila', 'Curl con toalla', 'Curl con botellas'],
  },
  core: {
    gym: ['Plancha', 'Elevación de piernas', 'Crunch en polea'],
    home: ['Plancha', 'Bicicleta abdominal', 'Elevación de piernas'],
  },
};
