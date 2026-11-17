import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MacroBar } from '@/components/MacroBar';
import { Ring } from '@/components/Ring';
import { BigButton, Small, T, enterScreen, flipIn } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { alpha, fonts, useTheme } from '@/theme';

const BENEFITS = ['🍱 Plan de comidas que respeta tus alergias', '🏋️ Rutina para casa o gimnasio', '📷 Escanea tu plato y consulta antes de comer'];

export default function Welcome() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const resetDraft = useApp((s) => s.resetDraft);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, padding: 22, paddingTop: insets.top + 22, paddingBottom: insets.bottom + 22 }}>
      <Animated.View
        entering={flipIn}
        style={{ gap: 12, backgroundColor: c.hero, borderRadius: 28, padding: 26, borderWidth: 1, borderColor: alpha(c.acc, 0.25) }}
      >
        <Text style={{ fontSize: 48 }}>💪</Text>
        <Text style={{ fontFamily: fonts.titleX, fontSize: 44, lineHeight: 46, color: c.ink }}>
          Fit<Text style={{ color: c.acc }}>Coach</Text>
        </Text>
        <T style={{ fontSize: 17 }}>Tu entrenador y nutricionista, gratis.</T>
        <View style={{ gap: 8, marginTop: 4 }}>
          {BENEFITS.map((b) => (
            <T key={b} kind="med">
              {b}
            </T>
          ))}
        </View>
      </Animated.View>

      {/* Vista previa de lo que verá cada día: el anillo y las barras se animan al entrar. */}
      <Animated.View
        entering={enterScreen}
        style={{ flex: 1, justifyContent: 'center', marginTop: 14, backgroundColor: c.card, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: c.line }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Ring pct={0.58} size={112}>
            <Text style={{ fontFamily: fonts.titleX, fontSize: 24, color: c.ink }}>1 260</Text>
            <Small style={{ fontSize: 10 }}>kcal restantes</Small>
          </Ring>
          <View style={{ flex: 1 }}>
            <T kind="bold">Así se ve tu día</T>
            <Small style={{ marginTop: 2 }}>Calorías y macros calculados con tus datos. Registras en un toque.</Small>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
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
