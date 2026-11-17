/** 2990 → "2 990" (separador de miles con espacio, estable en Hermes). */
export const fmt = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export const grams = (g: number) => (g >= 1000 ? `${(g / 1000).toFixed(1)} kg` : `${Math.round(g)} g`);

export const SLOT_ICON: Record<string, string> = { D: '🍳', S: '🍎', A: '🍽️', C: '🌙' };
export const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** Lunes = 0 … Domingo = 6. */
export const weekdayIndex = (d = new Date()) => (d.getDay() + 6) % 7;

/** Los 7 días de la semana actual (lunes a domingo). */
export function currentWeek(d = new Date()) {
  const monday = new Date(d);
  monday.setDate(d.getDate() - weekdayIndex(d));
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return x;
  });
}
