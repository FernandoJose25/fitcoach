import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { alpha, useTheme } from '@/theme';
import { easeOut } from './ui';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const R = 48;
const C = 2 * Math.PI * R;

// Escala graduada tipo instrumento: 60 marcas, mayores cada 25 %.
const TICKS = Array.from({ length: 60 }, (_, i) => {
  const major = i % 15 === 0;
  const a = (i / 60) * 2 * Math.PI;
  const r1 = major ? 54 : 55.5;
  const r2 = 59;
  return { major, x1: 60 + r1 * Math.cos(a), y1: 60 + r1 * Math.sin(a), x2: 60 + r2 * Math.cos(a), y2: 60 + r2 * Math.sin(a) };
});

/** Anillo de progreso con escala graduada: 1.1 s con ease.out, parte del valor anterior. */
export function Ring({ pct, size = 128, children }: { pct: number; size?: number; children?: React.ReactNode }) {
  const { c } = useTheme();
  const off = useSharedValue(C);
  useEffect(() => {
    off.value = withTiming(C * (1 - Math.min(1, Math.max(0, pct))), { duration: 1100, easing: easeOut });
  }, [pct, off]);
  // Al 0 % se oculta el arco para no dejar un punto visible.
  const props = useAnimatedProps(() => ({ strokeDashoffset: off.value, opacity: off.value > C - 1 ? 0 : 1 }));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: [{ rotate: '-90deg' }] }}>
        {TICKS.map((t, i) => (
          <Line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.major ? c.ink : alpha(c.ink, 0.28)} strokeWidth={t.major ? 1.4 : 0.8} />
        ))}
        <Circle cx={60} cy={60} r={R} stroke={alpha(c.ink, 0.09)} strokeWidth={7} fill="none" />
        <AnimatedCircle cx={60} cy={60} r={R} stroke={c.acc} strokeWidth={7} fill="none" strokeDasharray={`${C} ${C}`} animatedProps={props} />
      </Svg>
      <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}
