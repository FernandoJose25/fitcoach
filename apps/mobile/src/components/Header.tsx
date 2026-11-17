import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from './Icon';
import { Tap } from './Tap';
import { Eyebrow, H } from './ui';
import { useApp } from '@/store/useApp';
import { fonts, useTheme } from '@/theme';

const DAY = new Intl.DateTimeFormat('es', { weekday: 'short', day: '2-digit', month: 'short' });

/** Encabezado de pestañas: rótulo de fecha + sección, saludo condensado, racha y avatar (abre Perfil). */
export function Header({ subtitle }: { subtitle: string }) {
  const { c } = useTheme();
  const router = useRouter();
  const name = useApp((s) => s.profile?.name ?? '');
  const streak = useApp((s) => s.streak);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 }}>
      <View style={{ flex: 1 }}>
        <Eyebrow>
          {DAY.format(new Date()).replace(/\./g, '')} · {subtitle}
        </Eyebrow>
        <H size={20} numberOfLines={1} style={{ marginTop: 2 }}>
          Hola, {name}
        </H>
      </View>
      <View
        accessibilityLabel={`Racha de ${streak} días`}
        style={{ height: 44, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: c.line, flexDirection: 'row', alignItems: 'center', gap: 6 }}
      >
        <Icon name="streak" size={16} color={streak > 0 ? c.acc : c.mut} />
        <Text style={{ color: c.ink, fontFamily: fonts.numB, fontSize: 14 }}>{String(streak).padStart(2, '0')}</Text>
      </View>
      <Tap
        onPress={() => router.push('/perfil')}
        accessibilityLabel="Perfil"
        style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: c.bg, fontFamily: fonts.titleX, fontSize: 22 }}>{(name[0] ?? 'F').toUpperCase()}</Text>
      </Tap>
    </View>
  );
}
