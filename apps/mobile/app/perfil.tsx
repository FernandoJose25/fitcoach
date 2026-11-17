import { Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GOALS, LEVELS, PLACES, achievements } from '@fitcoach/core';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { Tap } from '@/components/Tap';
import { BigButton, Card, Eyebrow, H, KV, Screen, Small, T } from '@/components/ui';
import { fmt } from '@/lib/format';
import { syncReminders } from '@/lib/notify';
import { useApp, type GuidePref, type Reminders, type SchemePref } from '@/store/useApp';
import { useUi } from '@/store/useUi';
import { alpha, fonts, radius, useTheme } from '@/theme';

const SCHEMES: { v: SchemePref; l: string }[] = [
  { v: 'auto', l: 'Automático' },
  { v: 'light', l: 'Claro' },
  { v: 'dark', l: 'Oscuro' },
];
const REMINDERS: { k: keyof Reminders; l: string; d: string }[] = [
  { k: 'meals', l: 'Comidas', d: 'A la hora de cada comida de tu menú' },
  { k: 'water', l: 'Agua', d: 'Cada 2 horas, de 10:00 a 18:00' },
  { k: 'workout', l: 'Entreno', d: 'Tus días de entreno a las 18:00' },
  { k: 'weigh', l: 'Pesaje', d: 'Los lunes a las 7:30' },
];
const GUIDES: { v: GuidePref; l: string }[] = [
  { v: '3d', l: 'Animación 3D' },
  { v: 'foto', l: 'Fotos' },
];

export default function Perfil() {
  const { c } = useTheme();
  const router = useRouter();
  const p = useApp((s) => s.profile)!;
  const t = useApp((s) => s.targets)!;
  const scheme = useApp((s) => s.scheme);
  const guide = useApp((s) => s.guide);
  const { setScheme, setGuide, resetDraft } = useApp.getState();
  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 }}>
      <Tap onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: c.ink, fontSize: 18 }}>‹</Text>
      </Tap>
      <View style={{ width: 42, height: 42, borderRadius: 11, backgroundColor: c.acc, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: c.on, fontFamily: fonts.titleX, fontSize: 22 }}>{(p.name[0] ?? 'F').toUpperCase()}</Text>
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
      <Card>
        <H style={{ marginBottom: 10 }}>Guía de ejercicios</H>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {GUIDES.map((g) => (
            <Chip key={g.v} small label={g.l} on={guide === g.v} onPress={() => setGuide(g.v)} />
          ))}
        </View>
        <Small style={{ marginTop: 8 }}>La animación 3D aparece en los ejercicios que ya la tienen; el resto se muestra con fotos.</Small>
      </Card>
      <Tap onPress={() => router.push('/progreso')} style={{ marginBottom: 12 }}>
        <Card style={{ marginBottom: 0, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <H>Progreso corporal</H>
            <Small>Peso, medidas y fotos con comparador</Small>
          </View>
          <Text style={{ color: c.mut, fontSize: 20 }}>›</Text>
        </Card>
      </Tap>
      <Achievements />
      <RemindersCard />
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

/** Logros: se calculan con tus datos (entrenos, récords, agua, pesajes); nada se marca a mano. */
function Achievements() {
  const { c } = useTheme();
  const st = useApp();
  const list = achievements({
    workoutDays: st.workoutDays,
    sessionsDone: st.sessionsDone,
    daysPerWeek: st.profile?.daysPerWeek ?? 3,
    streak: st.streak,
    sets: st.sets,
    mealDays: Object.values(st.logs).filter((l) => l.length).length,
    water: st.water,
    weights: st.weights,
  });
  const done = list.filter((a) => a.progress >= 1).length;
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <H>Logros</H>
        <Small>
          {done} de {list.length}
        </Small>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {list.map((a) => {
          const ok = a.progress >= 1;
          return (
            <View key={a.id} accessibilityLabel={`${a.title}: ${ok ? 'conseguido' : `${Math.round(a.progress * 100)} %`}. ${a.desc}`} style={{ width: '48%', flexGrow: 1, padding: 10, borderRadius: radius.btn, backgroundColor: c.bg, borderWidth: 1, borderColor: ok ? c.acc : c.line }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {ok && <Icon name="check" size={13} stroke={2.5} color={c.acc} />}
                <T kind="bold" style={{ fontSize: 13, flex: 1, opacity: ok ? 1 : 0.85 }} numberOfLines={1}>
                  {a.title}
                </T>
              </View>
              <Small style={{ fontSize: 11, marginTop: 2 }} numberOfLines={2}>
                {a.desc}
              </Small>
              {!ok && (
                <View style={{ height: 4, borderRadius: 2, backgroundColor: alpha(c.ink, 0.1), marginTop: 8, overflow: 'hidden' }}>
                  <View style={{ width: `${a.progress * 100}%`, height: '100%', backgroundColor: c.acc }} />
                </View>
              )}
            </View>
          );
        })}
      </View>
    </Card>
  );
}

/** Recordatorios locales (sin servidor): se reprograman al cambiar cualquier interruptor. */
function RemindersCard() {
  const { c } = useTheme();
  const reminders = useApp((s) => s.reminders);
  const profile = useApp((s) => s.profile)!;
  const toggle = async (k: keyof Reminders, on: boolean) => {
    const next = { ...reminders, [k]: on };
    useApp.getState().setReminders({ [k]: on });
    const ok = await syncReminders(next, profile.daysPerWeek, profile.mealsPerDay);
    if (!ok) {
      useApp.getState().setReminders({ [k]: false });
      useUi.getState().showToast('Activa las notificaciones de FitCoach en Ajustes');
    }
  };
  return (
    <Card>
      <Eyebrow style={{ marginBottom: 4 }}>Recordatorios</Eyebrow>
      {REMINDERS.map((r, i) => (
        <View key={r.k} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
          <View style={{ flex: 1 }}>
            <T kind="bold" style={{ fontSize: 14 }}>
              {r.l}
            </T>
            <Small>{r.d}</Small>
          </View>
          <Switch
            value={reminders[r.k]}
            onValueChange={(v) => toggle(r.k, v)}
            accessibilityLabel={`Recordatorio de ${r.l.toLowerCase()}`}
            trackColor={{ false: alpha(c.ink, 0.15), true: alpha(c.acc, 0.55) }}
            thumbColor={reminders[r.k] ? c.acc : c.mut}
          />
        </View>
      ))}
    </Card>
  );
}
