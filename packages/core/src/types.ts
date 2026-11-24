export type Sex = 'male' | 'female';
export type Goal = 'gain' | 'lose' | 'maintain';
export type Pace = 'slow' | 'moderate' | 'fast';
export type Activity = 'low' | 'active' | 'very_active';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Where = 'gym' | 'home';
export type SlotType = 'D' | 'S' | 'A' | 'C'; // desayuno, snack, almuerzo, cena
/** Zona del cuerpo que el usuario quiere priorizar en el entreno. */
export type Focus = 'pecho' | 'espalda' | 'hombro' | 'brazos' | 'core' | 'pierna';

export interface Profile {
  name: string;
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  goal: Goal;
  pace: Pace;
  activity: Activity;
  level: Level;
  where: Where;
  daysPerWeek: 3 | 4 | 5 | 6;
  mealsPerDay: 3 | 4 | 5;
  allergies: string[];
  avoid: string[];
  /** Zonas a priorizar (máx. 2). Vacío = equilibrado; sin dato = aún no lo eligió (perfiles anteriores). */
  focus?: Focus[];
}

export interface Targets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  tdee: number;
  weeklyKg: number;
}

/** Valores por 100 g. */
export interface Food {
  id: string;
  name: string;
  emoji: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  /** P proteína · C carbohidrato · V verdura/fruta · F grasa · M plato preparado (solo registro, no entra en recetas). */
  role: 'P' | 'C' | 'V' | 'F' | 'M';
  /** Etiquetas de alérgeno o preferencia, separadas por coma (p. ej. "res,cebolla"). */
  tag?: string;
  /** Porción de la etiqueta del producto (Open Food Facts o la que escribió el usuario). */
  serving?: { g: number; label: string };
  /** De dónde salen los valores: catálogo (sin campo), producto de marca, creado por el usuario o estimado por IA. */
  src?: 'off' | 'user' | 'ai';
  /** Palabras extra para la búsqueda (categoría de un producto envasado: "galleta", "gaseosa"…). */
  kw?: string;
  /** Otros nombres separados por `|` ("puré|papa majada"): búsqueda y emparejado de lo que detecta la IA. */
  aka?: string;
}

export interface Item {
  foodId: string;
  grams: number;
}

export interface Recipe {
  id: string;
  name: string;
  slots: string;
  items: Item[];
  how: string;
  /** Plato de otra cocina o con ingredientes difíciles de conseguir en el Perú: el menú lo elige menos. */
  foreign?: boolean;
}

/** Acción de un paso de receta: elige el dibujo animado del modo cocinar. */
export type StepAction = 'cortar' | 'licuar' | 'batir' | 'sarten' | 'hervir' | 'tostar' | 'mezclar' | 'untar' | 'reposar' | 'servir';

export interface RecipeStep {
  action: StepAction;
  text: string;
  /** Temporizador del paso, en segundos. */
  sec?: number;
}

/** Tipo de preparación, para elegir cómo quieres tu desayuno o snack (botones del Menú). */
export type MealFormat = 'batido' | 'panqueques' | 'dulce' | 'salado' | 'airfryer';

/** Una forma de preparar una receta: tiempo, utensilios, pasos y consejos (sustituciones, trucos). */
export interface RecipeGuide {
  name: string;
  /** Sin dato en las recetas que aún no tienen guía escrita. */
  format?: MealFormat;
  /** Minutos de preparación; sin dato en las recetas que aún no tienen guía escrita. */
  min?: number;
  level: 'Fácil' | 'Media';
  tools: string[];
  steps: RecipeStep[];
  tips: string[];
}

export interface Meal {
  slot: SlotType;
  label: string;
  share: number;
  recipeId: string | null;
  recipeName: string;
  how: string;
  items: Item[];
  /** kcal recortadas para compensar un exceso del día (ver `compensate`). */
  cut?: number;
}
