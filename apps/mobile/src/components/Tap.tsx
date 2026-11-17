import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { spring } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
}

/** Botón con presión contenida (escala 0.96), háptico ligero y hitSlop de 8 px para llegar al área táctil mínima de 44–48 px. */
export function Tap({ style, haptic = true, hitSlop = 8, onPress, onPressIn, onPressOut, children, ...rest }: Props) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      {...rest}
      hitSlop={hitSlop}
      style={[a, style]}
      onPressIn={(e) => {
        s.value = withSpring(0.96, spring);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.value = withSpring(1, spring);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
