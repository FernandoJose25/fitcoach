import type { MealFormat, RecipeGuide, StepAction } from './types';
import { GUIDES, type Row } from './data/guides';
import { MEAL_GUIDES } from './data/guides-meals';
import { VERSIONS } from './data/versions';
import { LIQUIDS } from './data/market';
import { MEASURES } from './data/measures';

/** Verbo de la frase → dibujo del paso (para recetas sin guía escrita). */
const ACTION_WORDS: [RegExp, StepAction][] = [
  [/lic[uú]a/i, 'licuar'],
  [/\bbate/i, 'batir'],
  [/sart[eé]n|saltea|sofr[ií]e|plancha|fr[ií]e|\bdora|sella|cuaja/i, 'sarten'],
  [/hierv|sancoch|cocina|guisa|calienta/i, 'hervir'],
  [/tuesta|hornea|horno|airfryer/i, 'tostar'],
  [/\bunta/i, 'untar'],
  [/corta|pica|deshilacha|ralla|pela/i, 'cortar'],
  [/mezcla|revuelve|aliña/i, 'mezclar'],
  [/reposa|refri|noche/i, 'reposar'],
];

const actionOf = (text: string): StepAction => ACTION_WORDS.find(([re]) => re.test(text))?.[1] ?? 'servir';

export const FORMATS: MealFormat[] = ['batido', 'panqueques', 'dulce', 'salado', 'airfryer'];
export const FORMAT_LABEL: Record<MealFormat, string> = {
  batido: 'Batido',
  panqueques: 'Panqueques',
  dulce: 'Dulce',
  salado: 'Salado',
  airfryer: 'Airfryer',
};

/** Guías escritas de todas las recetas: desayunos y snacks + almuerzos y cenas. */
const ALL: Record<string, Row> = { ...GUIDES, ...MEAL_GUIDES };
const toGuide = (name: string, [format, min, level, tools, steps, tips]: Row): RecipeGuide => ({
  name,
  format,
  min,
  level: level === 2 ? 'Media' : 'Fácil',
  tools: tools.split(','),
  steps: steps.map(([action, text, sec]) => ({ action, text, sec })),
  tips,
});

/**
 * Formas de preparar la receta con los mismos ingredientes: la principal primero y luego sus alternativas
 * (batido, panqueques, airfryer…). Una receta sin guía escrita (p. ej. una nueva del catálogo) da una sola
 * forma, armada con su preparación de una línea, una frase por paso.
 */
export function recipeVersions(recipeId: string | null, name: string, how: string): RecipeGuide[] {
  const g = recipeId ? ALL[recipeId] : undefined;
  if (g) return [toGuide(name, g), ...(VERSIONS[recipeId!] ?? []).map(([f, n, ...rest]) => toGuide(n, [f, ...rest]))];
  const steps = how
    .split(/[.;]\s+/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter(Boolean)
    .map((s) => ({ action: actionOf(s), text: `${s[0].toUpperCase()}${s.slice(1)}.` }));
  return [{ name, level: 'Fácil', tools: [], steps, tips: [] }];
}

/** Tipos en los que se puede preparar la receta (su forma principal y sus alternativas). */
export function recipeFormats(recipeId: string): MealFormat[] {
  const g = ALL[recipeId];
  return g ? [...new Set([g[0], ...(VERSIONS[recipeId] ?? []).map((v) => v[0])])] : [];
}

/**
 * Forma de preparar que se muestra: la que eligió la persona en la receta (`chosen`); si no, la primera del
 * tipo elegido con los botones del Menú (`format`); si no, la principal.
 */
export function versionIndex(versions: RecipeGuide[], format?: MealFormat | null, chosen?: number): number {
  if (chosen !== undefined && chosen < versions.length) return chosen;
  return Math.max(
    0,
    versions.findIndex((v) => v.format === format),
  );
}

const FRACTIONS: [number, string][] = [
  [0, ''],
  [1 / 4, '¼'],
  [1 / 3, '⅓'],
  [1 / 2, '½'],
  [2 / 3, '⅔'],
  [3 / 4, '¾'],
  [1, ''],
];

/** Medida casera aproximada ("1¼ tazas", "5 cdas", "2 huevos") para seguir la receta sin balanza; null si no aplica. */
export function householdMeasure(foodId: string, grams: number): string | null {
  const m = MEASURES[foodId];
  if (!m) return null;
  const [per, one, many, whole] = m;
  const v = grams / per;
  if (whole) {
    const n = Math.max(1, Math.round(v));
    return `${n} ${n === 1 ? one : many}`;
  }
  if (v < 0.2) return null;
  const n = Math.floor(v);
  const [f, ch] = FRACTIONS.reduce((a, b) => (Math.abs(n + b[0] - v) < Math.abs(n + a[0] - v) ? b : a));
  const int = n + (f === 1 ? 1 : 0);
  return `${int || ''}${ch} ${n + f > 1 ? many : one}`;
}

/** Cantidad de la porción: ml o L para líquidos, g o kg para lo demás. */
export function portionAmount(foodId: string, grams: number): string {
  const liquid = LIQUIDS.has(foodId);
  if (grams >= 1000) return `${(grams / 1000).toFixed(1)} ${liquid ? 'L' : 'kg'}`;
  return `${Math.round(grams)} ${liquid ? 'ml' : 'g'}`;
}
