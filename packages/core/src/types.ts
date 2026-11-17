export type Sex = 'male' | 'female';
export type Goal = 'gain' | 'lose' | 'maintain';
export type Pace = 'slow' | 'moderate' | 'fast';
export type Activity = 'low' | 'active' | 'very_active';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Where = 'gym' | 'home';
export type SlotType = 'D' | 'S' | 'A' | 'C'; // desayuno, snack, almuerzo, cena

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
}

export interface Meal {
  slot: SlotType;
  label: string;
  share: number;
  recipeId: string | null;
  recipeName: string;
  how: string;
  items: Item[];
}
