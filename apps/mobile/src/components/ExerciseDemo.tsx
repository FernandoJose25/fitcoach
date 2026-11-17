import { useEffect, useState } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { exerciseImages } from '@fitcoach/core';
import { EXERCISE_ANIM } from '@/lib/anim';
import { MUSCLE_ICON } from '@/lib/muscles';
import { useApp } from '@/store/useApp';
import { palette } from '@/theme';

const HOLD = 900;
const FADE = 450;

/**
 * Demostración del ejercicio: animación 3D si existe y el usuario la prefiere (Perfil → Guía de
 * ejercicios); si no, funde la foto de inicio y la de final (free-exercise-db).
 * Con `size` es una miniatura de proporción fija; sin `size` ocupa el contenedor (modo héroe).
 */
export function ExerciseDemo({
  name,
  muscle,
  size,
  animate = true,
  style,
}: {
  name: string;
  muscle: string;
  size?: number;
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const anim = useApp((s) => (s.guide === '3d' ? EXERCISE_ANIM[name] : undefined));
  const imgs = exerciseImages(name);
  const [failed, setFailed] = useState(false);
  const top = useSharedValue(0);

  useEffect(() => {
    setFailed(false);
    cancelAnimation(top);
    top.value = 0;
    if (!animate || imgs.length < 2) return;
    top.value = withRepeat(withSequence(withDelay(HOLD, withTiming(1, { duration: FADE })), withDelay(HOLD, withTiming(0, { duration: FADE }))), -1);
  }, [name, animate, imgs.length, top]);

  const topStyle = useAnimatedStyle(() => ({ opacity: top.value }));

  const box: StyleProp<ViewStyle> = [
    size
      ? { width: size * 1.3, height: size, borderRadius: Math.min(16, size / 4) }
      : { width: '100%', height: '100%' },
    { overflow: 'hidden', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    style,
  ];

  if (anim)
    return (
      // Escenario de un solo color, casi negro en ambos temas: la figura clara se lee igual de bien.
      <View style={[box, { backgroundColor: palette.dark.card }]}>
        <Image source={anim} autoplay={animate} contentFit="cover" style={{ position: 'absolute', inset: 0 }} />
      </View>
    );

  if (!imgs.length || failed)
    return (
      <View style={box}>
        <Text style={{ fontSize: (size ?? 160) * 0.45 }}>{MUSCLE_ICON[muscle] ?? '🏋️'}</Text>
      </View>
    );

  const img = (uri: string) => (
    <Image source={{ uri }} cachePolicy="disk" contentFit="cover" transition={200} onError={() => setFailed(true)} style={{ position: 'absolute', inset: 0 }} />
  );

  return (
    <View style={box}>
      {img(imgs[0])}
      {imgs[1] && <Animated.View style={[{ position: 'absolute', inset: 0 }, topStyle]}>{img(imgs[1])}</Animated.View>}
    </View>
  );
}
