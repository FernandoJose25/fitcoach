import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MacroBar } from '@/components/MacroBar';
import { Ring } from '@/components/Ring';
import { BigButton, Eyebrow, Num, Small, T, easeOut } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { fonts, useTheme } from '@/theme';

const BENEFITS = [
  ['Plan de comidas', 'Respeta tus alergias y tu presupuesto.'],
  ['Rutina a medida', 'En casa o en el gimnasio, según tus días.'],
  ['Escaneo de platos', 'Consulta antes de comer, no después.'],
];

const enter = (i: number) => FadeInDown.delay(80 + i * 90).duration(520).easing(easeOut);

export default function Welcome() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const resetDraft = useApp((s) => s.resetDraft);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingHorizontal: 22, paddingTop: insets.top + 18, paddingBottom: insets.bottom + 18 }}>
      <Animated.View entering={enter(0)} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Eyebrow>Nutrición · Entrenamiento</Eyebrow>
        <Eyebrow>v1</Eyebrow>
      </Animated.View>

      <Animated.View entering={enter(1)} style={{ marginTop: 18 }}>
        <Text style={{ fontFamily: fonts.titleX, fontSize: 72, lineHeight: 70, color: c.ink, letterSpacing: -0.5, textTransform: 'uppercase' }} adjustsFontSizeToFit numberOfLines={1}>
          FitCoach<Text style={{ color: c.acc }}>.</Text>
        </Text>
        <T style={{ fontSize: 17, lineHeight: 24, marginTop: 10, maxWidth: 300 }}>Tu entrenador y nutricionista. Calculado con tus datos, sin costo.</T>
      </Animated.View>

      <View style={{ marginTop: 22, borderTopWidth: 1, borderTopColor: c.line }}>
        {BENEFITS.map(([t, d], i) => (
          <Animated.View key={t} entering={enter(2 + i)} style={{ flexDirection: 'row', gap: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: c.line }}>
            <Num style={{ color: c.acc, fontSize: 12, marginTop: 2 }}>{String(i + 1).padStart(2, '0')}</Num>
            <View style={{ flex: 1 }}>
              <T kind="bold">{t}</T>
              <Small style={{ fontSize: 13, marginTop: 1 }}>{d}</Small>
            </View>
          </Animated.View>
        ))}
      </View>

      {/* Vista previa del panel diario: el anillo y las barras se animan al entrar. */}
      <Animated.View
        entering={enter(5)}
        style={{ flex: 1, justifyContent: 'center', marginTop: 16, backgroundColor: c.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: c.line }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Ring pct={0.58} size={104}>
            <Text style={{ fontFamily: fonts.titleX, fontSize: 28, color: c.ink }}>1 260</Text>
            <Eyebrow style={{ fontSize: 8.5 }}>kcal rest.</Eyebrow>
          </Ring>
          <View style={{ flex: 1 }}>
            <Eyebrow>Vista previa</Eyebrow>
            <T kind="bold" style={{ marginTop: 3 }}>Así se ve tu día</T>
            <Small style={{ marginTop: 2, fontSize: 13 }}>Calorías y macros al día. Registras en un toque.</Small>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 16 }}>
          <MacroBar label="Proteína" value={84} target={140} color={c.p} />
          <MacroBar label="Carbos" value={230} target={467} color={c.c} />
          <MacroBar label="Grasas" value={61} target={67} color={c.f} />
        </View>
      </Animated.View>

      <BigButton
        label="Empezar"
        style={{ marginTop: 16 }}
        onPress={() => {
          resetDraft();
          router.push('/onboarding/0');
        }}
      />
    </View>
  );
}
