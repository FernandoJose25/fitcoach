import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { consequenceLines, type Consequence, type Goal } from '@fitcoach/core';
import { fmt } from '@/lib/format';
import { radius, useTheme } from '@/theme';
import { Eyebrow, H, T } from './ui';

/**
 * Qué pasa si te pasas: cuánto, cuánto se compensa en las comidas que faltan y el efecto del resto
 * (retraso de la meta o grasa extra, y su equivalente en caminata). Sin culpa: solo números.
 */
export function ConsequenceCard({ x, goal, title = 'Consecuencia', done }: { x: Consequence; goal: Goal; title?: string; done?: boolean }) {
  const { c } = useTheme();
  const lines = consequenceLines(x, goal);
  // `done`: el exceso ya está registrado (Menú) → "Te pasaste"; si no, es una previsión → "Te pasarías".
  const head = x.excess > 0 ? `${done ? 'Te pasaste' : 'Te pasarías'} ${fmt(x.excess)} kcal` : 'Macros por encima de tu meta';
  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      accessibilityRole="summary"
      style={{ backgroundColor: c.card, borderRadius: radius.card, borderWidth: 1, borderColor: c.line, borderLeftWidth: 3, borderLeftColor: c.acc, padding: 14, marginBottom: 14 }}
    >
      <Eyebrow color={c.acc}>{title}</Eyebrow>
      <H size={17} style={{ marginTop: 3 }}>
        {head}
      </H>
      <View style={{ marginTop: 6, gap: 5 }}>
        {lines.map((l) => (
          <View key={l} style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ width: 5, height: 5, marginTop: 8, backgroundColor: c.acc }} />
            <T style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>{l}</T>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}
