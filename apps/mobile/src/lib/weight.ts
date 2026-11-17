import type { Point } from '@/components/LineChart';

const short = (d: string) => `${Number(d.slice(8))}/${Number(d.slice(5, 7))}`;

/** Últimos `n` pesajes en orden cronológico, listos para el gráfico. */
export function weightPoints(weights: Record<string, number>, n = 12): Point[] {
  return Object.keys(weights)
    .sort()
    .slice(-n)
    .map((d) => ({ label: short(d), value: weights[d] }));
}

/** Proyección semanal desde el último peso con el ritmo del plan (kg/semana). */
export function weightProjection(weights: Record<string, number>, weeklyKg: number, weeks = 4): Point[] {
  const days = Object.keys(weights).sort();
  if (!days.length) return [];
  const last = days[days.length - 1];
  const base = new Date(`${last}T12:00:00`);
  return Array.from({ length: weeks }, (_, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + 7 * (i + 1));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { label: short(key), value: weights[last] + weeklyKg * (i + 1) };
  });
}

export const fmtKg = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1)).replace('.', ',');
export const fmtRate = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${fmtKg(Math.abs(+v.toFixed(2)))} kg/sem`;
