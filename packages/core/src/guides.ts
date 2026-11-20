import type { RecipeGuide, StepAction } from './types';
import { GUIDES } from './data/guides';
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

/**
 * Cómo preparar la receta. Las que aún no tienen guía escrita (almuerzos y cenas) se arman con su
 * preparación de una línea, una frase por paso.
 */
export function recipeGuide(recipeId: string | null, how: string): RecipeGuide {
  const g = recipeId ? GUIDES[recipeId] : undefined;
  if (g) {
    const [min, level, tools, steps, tips] = g;
    return {
      min,
      level: level === 2 ? 'Media' : 'Fácil',
      tools: tools.split(','),
      steps: steps.map(([action, text, sec]) => ({ action, text, sec })),
      tips,
    };
  }
  const steps = how
    .split(/[.;]\s+/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter(Boolean)
    .map((s) => ({ action: actionOf(s), text: `${s[0].toUpperCase()}${s.slice(1)}.` }));
  return { level: 'Fácil', tools: [], steps, tips: [] };
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
