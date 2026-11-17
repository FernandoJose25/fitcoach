import type { ReactNode } from 'react';
import { ScrollView, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { Easing, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tap } from './Tap';
import { alpha, ease, fonts, radius, useTheme } from '@/theme';

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
  return <Text {...rest} style={[{ color: c.ink, fontFamily: fonts.title, fontSize: size }, style]} />;
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
          borderColor: hero ? alpha(c.acc, 0.25) : c.line,
        },
        style,
      ]}
    >
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
}: {
  label: string;
  onPress?: () => void;
  ghost?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const { c } = useTheme();
  return (
    <Tap
      onPress={onPress}
      style={[
        {
          paddingVertical: 9,
          paddingHorizontal: 14,
          borderRadius: 14,
          backgroundColor: ghost ? c.bg : c.acc,
          borderWidth: ghost ? 1 : 0,
          borderColor: c.line,
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Text style={[{ color: ghost ? c.ink : c.on, fontFamily: fonts.bold, fontSize: 13 }, textStyle]}>{label}</Text>
    </Tap>
  );
}

export function BigButton({ label, onPress, disabled, style }: { label: string; onPress?: () => void; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      style={[{ padding: 15, borderRadius: radius.btn, backgroundColor: c.acc, alignItems: 'center', opacity: disabled ? 0.45 : 1 }, style]}
    >
      <Text style={{ color: c.on, fontFamily: fonts.bold, fontSize: 16 }}>{label}</Text>
    </Tap>
  );
}

export function KV({ k, v, first }: { k: string; v: string; first?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderTopWidth: first ? 0 : 1, borderTopColor: c.line }}>
      <T>{k}</T>
      <T kind="bold">{v}</T>
    </View>
  );
}

/** Emoji en cuadro redondeado (ingredientes y comidas). */
export function Em({ children, size = 44 }: { children: string; size?: number }) {
  const { c } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.34, backgroundColor: alpha(c.acc, 0.12), alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.52 }}>{children}</Text>
    </View>
  );
}
