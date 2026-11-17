import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { alpha, useTheme } from '@/theme';
import { Small, T, easeOut } from './ui';

/** Barra de macro: 1 s con ease.out, parte del valor anterior. */
export function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const { c } = useTheme();
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withTiming(Math.min(100, Math.max(0, (value / Math.max(1, target)) * 100)), { duration: 1000, easing: easeOut });
  }, [value, target, w]);
  const a = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return (
    <View style={{ flex: 1 }}>
      <T kind="bold" style={{ fontSize: 12 }}>
        {label}
      </T>
      <View style={{ height: 7, borderRadius: 7, backgroundColor: alpha(c.ink, 0.12), marginTop: 5, marginBottom: 3, overflow: 'hidden' }}>
        <Animated.View style={[{ height: '100%', borderRadius: 7, backgroundColor: color }, a]} />
      </View>
      <Small style={{ fontSize: 11 }}>
        {Math.round(value)} / {target} g
      </Small>
    </View>
  );
}
