import { useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { alpha, fonts, useTheme } from '@/theme';

export interface Point {
  label: string; // eje X (p. ej. "12/11")
  value: number;
}

/**
 * Línea de una sola serie (sin leyenda: el título de la tarjeta la nombra). Línea de 2 px, rejilla
 * recesiva con mínimo y máximo, etiqueta directa solo en el último valor y toque para ver cada punto.
 * `projection` (opcional) dibuja en discontinua hacia dónde iría según el plan.
 */
export function LineChart({
  points,
  height = 140,
  unit = '',
  format = (v: number) => v.toFixed(1).replace('.', ','),
  projection,
}: {
  points: Point[];
  height?: number;
  unit?: string;
  format?: (v: number) => string;
  projection?: Point[];
}) {
  const { c } = useTheme();
  const [w, setW] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const all = [...points, ...(projection ?? [])];
  if (points.length < 2) return null;
  const vals = all.map((p) => p.value);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pad = Math.max(0.5, (hi - lo) * 0.15);
  const min = lo - pad;
  const max = hi + pad;
  const left = 34;
  const right = 40;
  const top = 10;
  const bottom = 20;
  const n = all.length;
  const x = (i: number) => left + (i / Math.max(1, n - 1)) * Math.max(1, w - left - right);
  const y = (v: number) => top + (1 - (v - min) / (max - min)) * (height - top - bottom);
  const path = (pts: Point[], offset: number) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(i + offset).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const last = points.length - 1;
  const shown = sel ?? last;

  const pick = (px: number) => {
    const i = Math.round(((px - left) / Math.max(1, w - left - right)) * (n - 1));
    setSel(Math.max(0, Math.min(last, i)));
  };

  return (
    <View onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} style={{ height }}>
      {w > 0 && (
        <Pressable
          onPressIn={(e) => pick(e.nativeEvent.locationX)}
          onPressOut={() => setSel(null)}
          accessibilityLabel={`Gráfico: ${points.map((p) => `${p.label} ${format(p.value)} ${unit}`).join(', ')}`}
          style={{ position: 'absolute', inset: 0 }}
        >
          <Svg width={w} height={height}>
            {[max - pad, min + pad].map((v, i) => (
              <Line key={i} x1={left} x2={w - right} y1={y(v)} y2={y(v)} stroke={alpha(c.ink, 0.08)} strokeWidth={1} />
            ))}
            {projection && projection.length > 0 && (
              <Path d={`M${x(last)},${y(points[last].value)} ` + path(projection, points.length).replace(/^M/, 'L')} stroke={c.mut} strokeWidth={2} strokeDasharray="4 5" fill="none" />
            )}
            <Path d={path(points, 0)} stroke={c.acc} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            {sel !== null && <Line x1={x(sel)} x2={x(sel)} y1={top} y2={height - bottom} stroke={alpha(c.ink, 0.25)} strokeWidth={1} />}
            <Circle cx={x(shown)} cy={y(points[shown].value)} r={4.5} fill={c.acc} stroke={c.card} strokeWidth={2} />
          </Svg>
          {/* Eje Y: solo máximo y mínimo de los datos, en tinta mutada. */}
          {[hi, lo].map((v, i) => (
            <Text key={i} style={{ position: 'absolute', left: 0, top: y(v) - 7, width: left - 4, textAlign: 'right', color: c.mut, fontFamily: fonts.num, fontSize: 10 }}>
              {format(v)}
            </Text>
          ))}
          <Text style={{ position: 'absolute', left, bottom: 0, color: c.mut, fontFamily: fonts.num, fontSize: 10 }}>{points[0].label}</Text>
          <Text style={{ position: 'absolute', right: right - 6, bottom: 0, color: c.mut, fontFamily: fonts.num, fontSize: 10 }}>{(projection?.length ? projection[projection.length - 1] : points[last]).label}</Text>
          {/* Etiqueta directa del punto mostrado (el último, o el que se toca). */}
          <View style={{ position: 'absolute', left: Math.min(w - 92, Math.max(0, x(shown) - 46)), top: Math.max(0, y(points[shown].value) - 30), width: 92, alignItems: 'center' }}>
            <Text style={{ color: c.ink, fontFamily: fonts.numB, fontSize: 12 }}>
              {format(points[shown].value)} {unit}
              {sel !== null && <Text style={{ color: c.mut, fontFamily: fonts.num, fontSize: 10 }}> · {points[sel].label}</Text>}
            </Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

/** Barras horizontales de una sola serie (magnitud): etiqueta, barra y valor en tinta de texto. */
export function BarList({ rows, max }: { rows: { label: string; value: number }[]; max?: number }) {
  const { c } = useTheme();
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <View style={{ gap: 8 }}>
      {rows.map((r) => (
        <View key={r.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ width: 70, color: c.ink, fontFamily: fonts.med, fontSize: 12.5 }}>{r.label}</Text>
          <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: alpha(c.ink, 0.08), overflow: 'hidden' }}>
            <View style={{ width: `${Math.min(100, (r.value / top) * 100)}%`, height: '100%', borderRadius: 4, backgroundColor: c.acc }} />
          </View>
          <Text style={{ width: 28, textAlign: 'right', color: c.ink, fontFamily: fonts.numB, fontSize: 12 }}>{r.value}</Text>
        </View>
      ))}
    </View>
  );
}
