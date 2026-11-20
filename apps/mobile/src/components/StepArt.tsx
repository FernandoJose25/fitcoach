import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import type { StepAction } from '@fitcoach/core';
import { useTheme } from '@/theme';

type Motion = 'spin' | 'whisk' | 'tilt' | 'rise' | 'chop' | 'stir' | 'pop' | 'spread' | 'float';

/** Duración de un ciclo y si va y vuelve (vaivén) o reinicia (giro, vapor). */
const MOTION: Record<Motion, { ms: number; back: boolean }> = {
  spin: { ms: 700, back: false },
  whisk: { ms: 320, back: true },
  tilt: { ms: 520, back: true },
  rise: { ms: 1400, back: false },
  chop: { ms: 260, back: true },
  stir: { ms: 480, back: true },
  pop: { ms: 700, back: true },
  spread: { ms: 650, back: true },
  float: { ms: 1300, back: true },
};

/** Dibujo de cada acción (64×64): parte fija, parte que se mueve en el color de acento, movimiento y punto de giro. */
function parts(
  a: StepAction,
  ink: string,
  acc: string,
): { base: ReactNode; move: ReactNode; motion: Motion; origin?: string } {
  const p = {
    stroke: ink,
    strokeWidth: 2.5,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  const q = { ...p, stroke: acc };
  const bowl = <Path d="M8 32 H56 C56 46 46 54 32 54 C18 54 8 46 8 32 Z" {...p} />;
  switch (a) {
    case 'licuar':
      return {
        base: (
          <>
            <Path d="M18 10 H46 L42 44 H22 Z M15 10 H49 M20 44 H44 V54 H20 Z" {...p} />
            <Circle cx={32} cy={49} r={1.6} fill={ink} />
          </>
        ),
        move: <Path d="M24 27 C28 22 31 32 32 27 C33 22 36 32 40 27 M32 21 V33" {...q} />,
        motion: 'spin',
        origin: '50% 42%',
      };
    case 'batir':
      return {
        base: bowl,
        move: <Path d="M44 6 L35 28 M35 28 C27 30 26 42 31 44 C36 46 41 34 35 28 M35 28 C32 33 31 39 31 44" {...q} />,
        motion: 'whisk',
        origin: '52% 64%',
      };
    case 'sarten':
      return {
        base: <Path d="M22 60 C19 56 25 54 22 49 M32 60 C29 56 35 54 32 49 M42 60 C39 56 45 54 42 49" {...q} />,
        move: <Path d="M6 34 C6 42 12 44 29 44 C46 44 52 42 52 34 Z M52 36 H62 M20 34 C20 28 34 28 34 34" {...p} />,
        motion: 'tilt',
        origin: '97% 56%',
      };
    case 'hervir':
      return {
        base: (
          <Path d="M10 28 H54 M12 28 V48 C12 52 14 54 18 54 H46 C50 54 52 52 52 48 V28 M6 33 H12 M52 33 H58" {...p} />
        ),
        move: (
          <>
            <Circle cx={24} cy={20} r={3} {...q} />
            <Circle cx={33} cy={13} r={2.5} {...q} />
            <Circle cx={41} cy={21} r={2} {...q} />
          </>
        ),
        motion: 'rise',
      };
    case 'cortar':
      return {
        base: <Path d="M4 50 H60 V56 H4 Z M8 50 V44 H14 V50 M16 50 V44 H22 V50" {...p} />,
        move: <Path d="M26 44 H52 V36 C44 32 34 35 26 44 Z M52 40 H62" {...q} />,
        motion: 'chop',
      };
    case 'mezclar':
      return {
        base: bowl,
        move: <Path d="M42 6 L31 36 M31 36 C26 37 26 44 30 45 C34 46 36 40 31 36" {...q} />,
        motion: 'stir',
        origin: '48% 66%',
      };
    case 'tostar':
      return {
        base: (
          <>
            <Path d="M8 34 C8 31 10 30 13 30 H51 C54 30 56 31 56 34 V54 H8 Z M56 40 H61" {...p} />
            <Circle cx={15} cy={46} r={2} {...p} />
          </>
        ),
        move: <Path d="M20 30 V16 C20 10 24 8 28 10 C30 6 36 6 38 10 C42 8 46 10 44 16 V30" {...q} />,
        motion: 'pop',
      };
    case 'untar':
      return {
        base: <Path d="M14 54 V26 C10 24 10 14 18 12 C22 8 42 8 46 12 C54 14 54 24 50 26 V54 Z" {...p} />,
        move: <Path d="M18 40 L44 31 M44 31 L57 27" {...q} strokeWidth={3.5} />,
        motion: 'spread',
      };
    case 'reposar':
      return {
        base: (
          <Path d="M18 20 H46 V50 C46 54 44 56 40 56 H24 C20 56 18 54 18 50 Z M16 14 H48 V20 H16 Z M18 34 H46" {...p} />
        ),
        move: <Path d="M50 3 C44 6 42 14 46 19 C50 23 57 22 60 17 C54 18 49 13 50 3 Z" {...q} />,
        motion: 'float',
      };
    case 'servir':
      return {
        base: <Path d="M6 44 H58 M10 44 C14 52 50 52 54 44 M18 44 C18 34 46 34 46 44" {...p} />,
        move: <Path d="M24 28 C21 24 27 20 24 14 M32 26 C29 22 35 18 32 12 M40 28 C37 24 43 20 40 14" {...q} />,
        motion: 'rise',
      };
  }
}

/**
 * Dibujo de la acción de un paso de receta (licuar, batir, sartén…). Animado en bucle en el modo cocinar;
 * `still` lo deja quieto (listas). Respeta "reducir movimiento" del sistema.
 */
export function StepArt({ action, size = 120, still }: { action: StepAction; size?: number; still?: boolean }) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const { base, move, motion, origin } = parts(action, c.ink, c.acc);
  const animate = !still && !reduced;
  const t = useSharedValue(0);
  const k = size / 64;

  useEffect(() => {
    if (!animate) return;
    const m = MOTION[motion];
    t.value = 0;
    t.value = withRepeat(
      withTiming(1, { duration: m.ms, easing: m.back ? Easing.inOut(Easing.quad) : Easing.linear }),
      -1,
      m.back,
    );
    return () => cancelAnimation(t);
  }, [animate, motion, t]);

  const style = useAnimatedStyle(() => {
    const v = t.value;
    switch (motion) {
      case 'spin':
        return { transform: [{ rotate: `${v * 360}deg` }] };
      case 'whisk':
        return { transform: [{ rotate: `${-18 + 36 * v}deg` }] };
      case 'tilt':
        return { transform: [{ rotate: `${-7 + 14 * v}deg` }] };
      case 'rise':
        return { opacity: 1 - v, transform: [{ translateY: -12 * k * v }] };
      case 'chop':
        return { transform: [{ translateY: -10 * k * v }] };
      case 'stir':
        return { transform: [{ translateX: (-5 + 10 * v) * k }, { rotate: `${-10 + 20 * v}deg` }] };
      case 'pop':
        return { transform: [{ translateY: (8 - 16 * v) * k }] };
      case 'spread':
        return { transform: [{ translateX: (-7 + 14 * v) * k }] };
      case 'float':
        return { opacity: 0.45 + 0.55 * v, transform: [{ translateY: (3 - 6 * v) * k }] };
    }
  });

  return (
    <View style={{ width: size, height: size }} accessible={false}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        {base}
      </Svg>
      <Animated.View
        style={[StyleSheet.absoluteFill, origin ? { transformOrigin: origin } : null, animate ? style : null]}
      >
        <Svg width={size} height={size} viewBox="0 0 64 64">
          {move}
        </Svg>
      </Animated.View>
    </View>
  );
}
