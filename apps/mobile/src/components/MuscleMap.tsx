import { View, type StyleProp, type ViewStyle } from 'react-native';
import Body, { type ExtendedBodyPart, type Slug } from 'react-native-body-highlighter';
import { Small } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { alpha, useTheme } from '@/theme';

/** Grupo de la app (`e.muscle`) → músculos del mapa anatómico (react-native-body-highlighter, MIT). */
const SLUGS: Record<string, Slug[]> = {
  pecho: ['chest'],
  espalda: ['upper-back', 'lower-back', 'trapezius'],
  pierna: ['quadriceps', 'hamstring', 'gluteal', 'calves', 'adductors'],
  hombro: ['deltoids'],
  triceps: ['triceps'],
  biceps: ['biceps'],
  core: ['abs', 'obliques'],
};

/** Cuerpo anatómico de frente y de espaldas con los grupos musculares (`e.muscle`) resaltados. */
export function MuscleMap({ groups, height = 220, style }: { groups: string[]; height?: number; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const gender = useApp((s) => s.profile?.sex) ?? 'male';
  const data: ExtendedBodyPart[] = [...new Set(groups.flatMap((g) => SLUGS[g] ?? []))].map((slug) => ({ slug, color: c.acc }));
  return (
    <View style={[{ flexDirection: 'row', justifyContent: 'center', gap: 8 }, style]}>
      {(['front', 'back'] as const).map((side) => (
        <View key={side} style={{ alignItems: 'center' }}>
          <Body data={data} side={side} gender={gender} scale={height / 400} border="none" defaultFill={alpha(c.ink, 0.16)} />
          <Small style={{ fontSize: 11 }}>{side === 'front' ? 'Frente' : 'Espalda'}</Small>
        </View>
      ))}
    </View>
  );
}
