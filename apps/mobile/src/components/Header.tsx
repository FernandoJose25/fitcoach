import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Tap } from './Tap';
import { H, Small } from './ui';
import { useApp } from '@/store/useApp';
import { fonts, useTheme } from '@/theme';

/** Encabezado de pestañas: avatar (abre Perfil), saludo y racha. */
export function Header({ subtitle }: { subtitle: string }) {
  const { c } = useTheme();
  const router = useRouter();
  const name = useApp((s) => s.profile?.name ?? '');
  const streak = useApp((s) => s.streak);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 6 }}>
      <Tap onPress={() => router.push('/perfil')} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c.acc, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: c.on, fontFamily: fonts.titleX, fontSize: 18 }}>{(name[0] ?? 'F').toUpperCase()}</Text>
      </Tap>
      <View style={{ flex: 1 }}>
        <H size={19}>Hola, {name}</H>
        <Small>{subtitle}</Small>
      </View>
      <View style={{ height: 38, paddingHorizontal: 10, borderRadius: 13, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, justifyContent: 'center' }}>
        <Text style={{ color: c.ink, fontFamily: fonts.bold }}>🔥 {streak}</Text>
      </View>
    </View>
  );
}
