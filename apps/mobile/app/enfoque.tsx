import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { focusLabel, type Focus } from '@fitcoach/core';
import { FocusPicker } from '@/components/FocusPicker';
import { Tap } from '@/components/Tap';
import { BigButton, H, Screen, Small } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { useUi } from '@/store/useUi';
import { useTheme } from '@/theme';

/** Cambiar la zona prioritaria desde Entreno sin rehacer el onboarding (no toca calorías ni ajustes). */
export default function Enfoque() {
  const { c } = useTheme();
  const router = useRouter();
  const profile = useApp((s) => s.profile)!;
  const [value, setValue] = useState<Focus[]>(profile.focus ?? []);

  const save = () => {
    useApp.getState().setFocus(value);
    useUi.getState().showToast(value.length ? `Programa ajustado: más ${focusLabel(value).toLowerCase()}` : 'Programa equilibrado');
    router.back();
  };

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 }}>
      <Tap
        onPress={() => router.back()}
        accessibilityLabel="Volver"
        style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: c.ink, fontSize: 18 }}>‹</Text>
      </Tap>
      <View style={{ flex: 1 }}>
        <H size={20}>Zona prioritaria</H>
        <Small>Más ejercicios y series donde más lo necesitas</Small>
      </View>
    </View>
  );

  return (
    <Screen header={header}>
      <FocusPicker value={value} onChange={setValue} sex={profile.sex} />
      <BigButton label="Guardar" onPress={save} style={{ marginTop: 16 }} />
      <Small style={{ textAlign: 'center', marginTop: 8, marginBottom: 12 }}>Tus días de entreno se rearman con esta zona. Los cambios de ejercicio que hiciste vuelven al recomendado.</Small>
    </Screen>
  );
}
