import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { alpha, useTheme } from '@/theme';
import { easeOut } from './ui';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const R = 54;
const C = 2 * Math.PI * R; // 339.3

/** Anillo de progreso: 1.1 s con ease.out, parte del valor anterior. */
export function Ring({ pct, size = 128, children }: { pct: number; size?: number; children?: React.ReactNode }) {
  const { c } = useTheme();
  const off = useSharedValue(C);
  useEffect(() => {
    off.value = withTiming(C * (1 - Math.min(1, Math.max(0, pct))), { duration: 1100, easing: easeOut });
  }, [pct, off]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: off.value }));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={60} cy={60} r={R} stroke={alpha(c.ink, 0.12)} strokeWidth={11} fill="none" />
        <AnimatedCircle
          cx={60}
          cy={60}
          r={R}
          stroke={c.acc}
          strokeWidth={11}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${C} ${C}`}
          animatedProps={props}
        />
      </Svg>
      <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}
