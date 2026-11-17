import type { ReactNode } from 'react';
import { ScrollView, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { Easing, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tap } from './Tap';
import { alpha, ease, fonts, radius, titleScale, useTheme } from '@/theme';

export const easeOut = Easing.bezier(...ease.out);

/** Entrada de pantalla: fade + 14 px hacia arriba, 350 ms. */
export const enterScreen = () => {
  'worklet';
  const cfg = { duration: 350, easing: easeOut };
  return {
    initialValues: { opacity: 0, transform: [{ translateY: 14 }] },
    animations: { opacity: withTiming(1, cfg), transform: [{ translateY: withTiming(0, cfg) }] },
  };
};

/** "Cambiar receta": giro en X de 60° a 0° con fade. */
export const flipIn = () => {
  'worklet';
  const cfg = { duration: 450, easing: easeOut };
  return {
    initialValues: { opacity: 0, transform: [{ perspective: 600 }, { rotateX: '60deg' }, { translateY: 10 }] },
    animations: {
      opacity: withTiming(1, cfg),
      transform: [{ perspective: 600 }, { rotateX: withTiming('0deg', cfg) }, { translateY: withTiming(0, cfg) }],
    },
  };
};

export function T({ style, kind = 'body', ...rest }: TextProps & { kind?: keyof typeof fonts | 'mut' }) {
  const { c } = useTheme();
  const font = kind === 'mut' ? fonts.body : fonts[kind];
  return <Text {...rest} style={[{ color: kind === 'mut' ? c.mut : c.ink, fontFamily: font, fontSize: 15 }, style]} />;
}

export function H({ style, size = 16, ...rest }: TextProps & { size?: number }) {
  const { c } = useTheme();
  return <Text {...rest} style={[{ color: c.ink, fontFamily: fonts.title, fontSize: Math.round(size * titleScale), letterSpacing: 0.2 }, style]} />;
}

/** Rótulo técnico: mayúsculas, monoespaciada, con tracking. Para etiquetas de sección y unidades. */
export function Eyebrow({ style, color, ...rest }: TextProps & { color?: string }) {
  const { c } = useTheme();
  return <Text {...rest} style={[{ color: color ?? c.mut, fontFamily: fonts.num, fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase' }, style]} />;
}

/** Cifra tabular (monoespaciada) para datos: kcal, gramos, series. */
export function Num({ style, ...rest }: TextProps) {
  const { c } = useTheme();
  return <Text {...rest} style={[{ color: c.ink, fontFamily: fonts.num, fontSize: 13, fontVariant: ['tabular-nums'] }, style]} />;
}

export function Small({ style, ...rest }: TextProps) {
  const { c } = useTheme();
  return <Text {...rest} style={[{ color: c.mut, fontFamily: fonts.body, fontSize: 12 }, style]} />;
}

export function Card({ children, style, hero }: { children: ReactNode; style?: StyleProp<ViewStyle>; hero?: boolean }) {
  const { c } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: hero ? c.hero : c.card,
          borderRadius: radius.card,
          padding: 16,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: hero ? alpha(c.acc, 0.28) : c.line,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {/* Filete de señal: única marca de color en la tarjeta principal. */}
      {hero && <View style={{ position: 'absolute', top: 0, left: 0, width: 36, height: 3, backgroundColor: c.acc }} />}
      {children}
    </View>
  );
}

export function Screen({ children, header, animKey }: { children: ReactNode; header?: ReactNode; animKey?: string | number }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      {header}
      <Animated.View key={animKey} entering={enterScreen} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

export function Pill({
  label,
  onPress,
  ghost,
  style,
  textStyle,
  a11y,
}: {
  label: string;
  onPress?: () => void;
  ghost?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  /** Etiqueta para el lector de pantalla cuando `label` es un símbolo (−, ＋, ↻, ✕). */
  a11y?: string;
}) {
  const { c } = useTheme();
  return (
    <Tap
      onPress={onPress}
      accessibilityLabel={a11y}
      style={[
        {
          paddingVertical: 9,
          paddingHorizontal: 13,
          borderRadius: radius.chip,
          backgroundColor: ghost ? c.bg : c.acc,
          borderWidth: ghost ? 1 : 0,
          borderColor: c.line,
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Text style={[{ color: ghost ? c.ink : c.on, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' }, textStyle]}>{label}</Text>
    </Tap>
  );
}

export function BigButton({ label, onPress, disabled, style }: { label: string; onPress?: () => void; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      accessibilityState={{ disabled: !!disabled }}
      style={[{ paddingVertical: 14, paddingHorizontal: 18, borderRadius: radius.btn, backgroundColor: c.acc, alignItems: 'center', opacity: disabled ? 0.4 : 1 }, style]}
    >
      <Text style={{ color: c.on, fontFamily: fonts.titleX, fontSize: 19, letterSpacing: 1.6, textTransform: 'uppercase' }}>{label}</Text>
    </Tap>
  );
}

export function KV({ k, v, first }: { k: string; v: string; first?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderTopWidth: first ? 0 : 1, borderTopColor: c.line }}>
      <T>{k}</T>
      <Num style={{ fontSize: 14 }}>{v}</Num>
    </View>
  );
}

/** Emoji en cuadro redondeado (ingredientes y comidas). */
export function Em({ children, size = 44 }: { children: string; size?: number }) {
  const { c } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.24, backgroundColor: c.bg, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.52 }}>{children}</Text>
    </View>
  );
}
