import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BigButton, T, flipIn } from '@/components/ui';
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
        style={{
          flex: 1,
          justifyContent: 'center',
          gap: 14,
          backgroundColor: c.hero,
          borderRadius: 28,
          padding: 26,
          paddingVertical: 34,
          borderWidth: 1,
          borderColor: alpha(c.acc, 0.25),
        }}
      >
        <Text style={{ fontSize: 56 }}>💪</Text>
        <Text style={{ fontFamily: fonts.titleX, fontSize: 44, lineHeight: 46, color: c.ink }}>
          Fit<Text style={{ color: c.acc }}>Coach</Text>
        </Text>
        <T style={{ fontSize: 17 }}>Tu entrenador y nutricionista, gratis.</T>
        <View style={{ gap: 8, marginTop: 6 }}>
          {BENEFITS.map((b) => (
            <T key={b} kind="med">
              {b}
            </T>
          ))}
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
