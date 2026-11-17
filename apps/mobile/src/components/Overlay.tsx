import { useEffect, useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeInUp, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUi } from '@/store/useUi';
import { fonts, useTheme } from '@/theme';

const COLORS = ['#FF5A2E', '#D6B26E', '#8EA4B9', '#EDE9E1', '#6B675E'];

function Dot({ i, seed }: { i: number; seed: number }) {
  const t = useSharedValue(0);
  const { x, y, color } = useMemo(() => {
    const ang = (i / 18) * Math.PI * 2 + seed;
    const d = 90 + ((i * 37 + seed * 13) % 90);
    return { x: Math.cos(ang) * d, y: Math.sin(ang) * d - 60, color: COLORS[i % COLORS.length] };
  }, [i, seed]);
  useEffect(() => {
    t.value = 0;
    t.value = withTiming(1, { duration: 900, easing: Easing.bezier(0.2, 0.8, 0.3, 1) });
  }, [t, seed]);
  const a = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [{ translateX: x * t.value }, { translateY: y * t.value }, { scale: 1 - 0.7 * t.value }],
  }));
  return <Animated.View style={[{ position: 'absolute', width: 4, height: 11, borderRadius: 1, backgroundColor: color }, a]} />;
}

/** Toast + confeti globales (registro exitoso). Se monta una vez en el layout raíz. */
export function Overlay() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const toast = useUi((s) => s.toast);
  const burst = useUi((s) => s.burst);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
      {burst > 0 && (
        <View key={burst} style={{ position: 'absolute', left: width / 2, top: height * 0.6 }}>
          {Array.from({ length: 18 }, (_, i) => (
            <Dot key={i} i={i} seed={burst} />
          ))}
        </View>
      )}
      {toast && (
        <Animated.View
          entering={FadeInUp.duration(400)}
          exiting={FadeOut.duration(300)}
          style={{
            position: 'absolute',
            top: insets.top + 12,
            alignSelf: 'center',
            backgroundColor: c.ink,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: c.bg, fontFamily: fonts.bold }}>{toast}</Text>
        </Animated.View>
      )}
    </View>
  );
}
