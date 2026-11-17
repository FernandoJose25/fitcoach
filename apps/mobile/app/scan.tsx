import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Tap } from '@/components/Tap';
import { BigButton, H, T } from '@/components/ui';
import { useTheme } from '@/theme';

/** Placeholder: el registro manual (F3) y el escáner con IA (F4) viven aquí. */
export default function Scan() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { slot } = useLocalSearchParams<{ slot?: string }>();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, padding: 22, paddingTop: insets.top + 18, paddingBottom: insets.bottom + 22 }}>
      <Tap onPress={() => router.back()} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: c.ink, fontSize: 18 }}>✕</Text>
      </Tap>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 56 }}>📷</Text>
        <H size={22}>Escáner y registro</H>
        <T kind="mut" style={{ textAlign: 'center' }}>
          Búsqueda, código de barras y foto del plato llegan en las fases F3 y F4.{slot !== undefined ? ` (comida ${Number(slot) + 1})` : ''}
        </T>
      </View>
      <BigButton label="Volver" onPress={() => router.back()} />
    </View>
  );
}
