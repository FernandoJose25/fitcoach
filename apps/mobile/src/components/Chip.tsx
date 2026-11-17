import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Tap } from './Tap';
import { Em, Small, T, easeOut } from './ui';
import { fonts, radius, useTheme } from '@/theme';

// Selección sin rebote: escala corta con curva de salida.
const SELECT = { duration: 180, easing: easeOut };

/** Chip de selección: scale 1.02 al activarse. */
export function Chip({ label, on, onPress, small }: { label: string; on: boolean; onPress: () => void; small?: boolean }) {
  const { c } = useTheme();
  const s = useSharedValue(on ? 1.02 : 1);
  useEffect(() => {
    s.value = withTiming(on ? 1.02 : 1, SELECT);
  }, [on, s]);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={a}>
      <Tap
        onPress={onPress}
        accessibilityState={{ selected: on }}
        style={{
          paddingVertical: small ? 8 : 12,
          paddingHorizontal: small ? 12 : 15,
          borderRadius: radius.chip,
          backgroundColor: on ? c.ink : c.card,
          borderWidth: 1,
          borderColor: on ? c.ink : c.line,
        }}
      >
        <Text style={{ color: on ? c.bg : c.ink, fontFamily: fonts.bold, fontSize: small ? 13 : 14 }}>{label}</Text>
      </Tap>
    </Animated.View>
  );
}

/** Tarjeta de opción con título y descripción (onboarding). */
export function OptionCard({ title, desc, on, onPress }: { title: string; desc: string; on: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const s = useSharedValue(1);
  useEffect(() => {
    s.value = withTiming(on ? 1.02 : 1, SELECT);
  }, [on, s]);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={a}>
      <Tap
        onPress={onPress}
        accessibilityState={{ selected: on }}
        style={{
          padding: 14,
          paddingHorizontal: 16,
          borderRadius: radius.btn,
          backgroundColor: on ? c.hero : c.card,
          borderWidth: 1,
          borderColor: on ? c.acc : c.line,
          marginBottom: 10,
        }}
      >
        <T kind="bold">{title}</T>
        <Small style={{ marginTop: 2, fontSize: 13 }}>{desc}</Small>
      </Tap>
    </Animated.View>
  );
}

/** Chip de ingrediente con emoji y gramos. */
export function FoodChip({ emoji, name, grams }: { emoji: string; name: string; grams: number }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 5,
        paddingLeft: 5,
        paddingRight: 12,
        borderRadius: radius.chip,
        backgroundColor: c.bg,
      }}
    >
      <Em size={32}>{emoji}</Em>
      <T style={{ fontSize: 13 }}>
        {name} <T kind="bold" style={{ fontSize: 13 }}>{grams} g</T>
      </T>
    </View>
  );
}
