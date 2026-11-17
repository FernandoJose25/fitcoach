import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GOALS, LEVELS, PLACES } from '@fitcoach/core';
import { Chip } from '@/components/Chip';
import { Tap } from '@/components/Tap';
import { BigButton, Card, H, KV, Screen, Small } from '@/components/ui';
import { fmt } from '@/lib/format';
import { useApp, type SchemePref } from '@/store/useApp';
import { fonts, useTheme } from '@/theme';

const SCHEMES: { v: SchemePref; l: string }[] = [
  { v: 'auto', l: 'Automático' },
  { v: 'light', l: 'Claro' },
  { v: 'dark', l: 'Oscuro' },
];

export default function Perfil() {
  const { c } = useTheme();
  const router = useRouter();
  const p = useApp((s) => s.profile)!;
  const t = useApp((s) => s.targets)!;
  const scheme = useApp((s) => s.scheme);
  const { setScheme, resetDraft } = useApp.getState();
  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 }}>
      <Tap onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: c.ink, fontSize: 18 }}>‹</Text>
      </Tap>
      <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c.acc, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: c.on, fontFamily: fonts.titleX, fontSize: 18 }}>{(p.name[0] ?? 'F').toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <H size={19}>{p.name}</H>
        <Small>
          {p.age} años · {p.weightKg} kg · {p.heightCm} cm
        </Small>
      </View>
    </View>
  );
  return (
    <Screen header={header}>
      <Card>
        <H style={{ marginBottom: 6 }}>Tu plan</H>
        <KV first k="Objetivo" v={GOALS.find((g) => g.value === p.goal)?.label ?? ''} />
        <KV k="Calorías" v={`${fmt(t.kcal)} kcal`} />
        <KV k="Mantenimiento" v={`${fmt(t.tdee)} kcal`} />
        <KV k="Ritmo estimado" v={`${t.weeklyKg > 0 ? '+' : ''}${t.weeklyKg} kg/sem`} />
        <KV k="Proteína · Carbos · Grasas" v={`${t.protein} · ${t.carbs} · ${t.fat} g`} />
        <KV k="Entreno" v={`${PLACES.find((x) => x.value === p.where)?.label} · ${p.daysPerWeek} días · ${LEVELS.find((x) => x.value === p.level)?.label}`} />
        <KV k="Comidas al día" v={String(p.mealsPerDay)} />
      </Card>
      <Card>
        <H style={{ marginBottom: 10 }}>Tema</H>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {SCHEMES.map((s) => (
            <Chip key={s.v} small label={s.l} on={scheme === s.v} onPress={() => setScheme(s.v)} />
          ))}
        </View>
      </Card>
      <BigButton
        label="Editar mis datos"
        onPress={() => {
          resetDraft(p);
          router.push('/onboarding/0');
        }}
      />
      <Small style={{ textAlign: 'center', marginTop: 14 }}>Orientativo: no reemplaza a un nutricionista ni a un médico.</Small>
    </Screen>
  );
}
