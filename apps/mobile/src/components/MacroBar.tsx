import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { alpha, useTheme } from '@/theme';
import { Eyebrow, Num, easeOut } from './ui';

/** Barra de macro: rótulo técnico, lectura tabular y barra fina; 1 s con ease.out. */
export function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const { c } = useTheme();
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withTiming(Math.min(100, Math.max(0, (value / Math.max(1, target)) * 100)), { duration: 1000, easing: easeOut });
  }, [value, target, w]);
  const a = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 6, height: 6, backgroundColor: color }} />
        <Eyebrow style={{ fontSize: 9.5 }}>{label}</Eyebrow>
      </View>
      <Num style={{ fontSize: 15, marginTop: 6 }}>
        {Math.round(value)}
        <Num style={{ fontSize: 11, color: c.mut }}> / {target} g</Num>
      </Num>
      <View style={{ height: 3, backgroundColor: alpha(c.ink, 0.1), marginTop: 6, overflow: 'hidden' }}>
        <Animated.View style={[{ height: '100%', backgroundColor: color }, a]} />
      </View>
    </View>
  );
}
