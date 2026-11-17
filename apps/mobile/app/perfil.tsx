import { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { GOALS, LEVELS, PLACES, achievements } from '@fitcoach/core';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { Tap } from '@/components/Tap';
import { BigButton, Card, Eyebrow, H, KV, Num, Pill, Screen, Small, T } from '@/components/ui';
import { WEEKDAYS, fmt, weekdayIndex } from '@/lib/format';
import { CONTACT_EMAIL, PRIVACY_URL } from '@/lib/links';
import { syncReminders } from '@/lib/notify';
import { cloudEnabled, deleteAccount } from '@/lib/sync';
import { sum } from '@/lib/usePlan';
import { todayKey, useApp, type GuidePref, type Reminders, type SchemePref } from '@/store/useApp';
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
      <KcalWeek />
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
        style={{ marginBottom: 14 }}
      />
      <AccountCard />
      <AboutCard />
      <Small style={{ textAlign: 'center', marginTop: 4 }}>Orientativo: no reemplaza a un nutricionista ni a un médico.</Small>
    </Screen>
  );
}

/** Calorías consumidas en los últimos 7 días frente a la meta: columnas de una serie, valor solo en la seleccionada. */
function KcalWeek() {
  const { c } = useTheme();
  const t = useApp((s) => s.targets)!;
  const logs = useApp((s) => s.logs);
  const custom = useApp((s) => s.customFoods);
  const [sel, setSel] = useState(6);
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - 6 + i);
        return d;
      }),
    [],
  );
  const vals = useMemo(() => days.map((d) => Math.round(sum(logs[todayKey(d)] ?? []).kcal)), [days, logs, custom]);
  const logged = vals.filter((v) => v > 0);
  const H_ = 112;
  const max = Math.max(t.kcal * 1.2, ...vals);
  const y = (v: number) => (v / max) * H_;
  const avg = logged.length ? logged.reduce((a, v) => a + v, 0) / logged.length : 0;
  const near = logged.filter((v) => Math.abs(v - t.kcal) <= t.kcal * 0.1).length;
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <H>Calorías · 7 días</H>
        <Small>meta {fmt(t.kcal)} kcal</Small>
      </View>
      {logged.length === 0 ? (
        <Small style={{ marginTop: 8 }}>Aún no registras comidas esta semana. Hazlo desde Menú o con el botón + y aquí verás cómo vas frente a tu meta.</Small>
      ) : (
        <>
          <View
            accessible
            accessibilityLabel={`Calorías de los últimos 7 días: ${days.map((d, i) => `${WEEKDAYS[weekdayIndex(d)]} ${vals[i]}`).join(', ')}. Meta ${t.kcal}.`}
            style={{ height: H_ + 40, marginTop: 12 }}
          >
            {/* Línea de meta: filete fino en tinta, con su rótulo a la izquierda. */}
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 22 + y(t.kcal), height: 1, backgroundColor: alpha(c.ink, 0.28) }} />
            <Eyebrow style={{ position: 'absolute', left: 0, bottom: 26 + y(t.kcal), fontSize: 9 }}>meta</Eyebrow>
            <View style={{ flex: 1, flexDirection: 'row' }}>
              {days.map((d, i) => (
                <Pressable key={i} onPress={() => setSel(i)} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                  {sel === i && vals[i] > 0 && <Num style={{ fontSize: 11, marginBottom: 4 }}>{fmt(vals[i])}</Num>}
                  <View style={{ width: 18, height: vals[i] ? Math.max(3, y(vals[i])) : 0, backgroundColor: c.acc, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
                  <View style={{ alignSelf: 'stretch', height: 1, backgroundColor: c.line }} />
                  <Text style={{ height: 18, marginTop: 4, color: sel === i ? c.ink : c.mut, fontFamily: sel === i ? fonts.numB : fonts.num, fontSize: 10.5 }}>{WEEKDAYS[weekdayIndex(d)]}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Small style={{ marginTop: 6 }}>
            Promedio {fmt(avg)} kcal en {logged.length} {logged.length === 1 ? 'día' : 'días'} con registro · {near} cerca de tu meta (±10 %).
          </Small>
        </>
      )}
    </Card>
  );
}

/** Copia en la nube y borrado de cuenta (SPEC §14). */
function AccountCard() {
  const { c } = useTheme();
  const pending = useApp((s) => s.dirtyDays.length > 0 || s.profileDirty);
  const [busy, setBusy] = useState(false);
  const status = !cloudEnabled
    ? 'Tus datos se guardan solo en este teléfono.'
    : pending
      ? 'Hay cambios por subir; se suben solos cuando hay conexión.'
      : 'Copia en la nube al día.';
  const confirm = () =>
    Alert.alert(
      '¿Borrar tu cuenta?',
      'Se borran tu perfil, comidas, entrenos, peso, medidas y fotos de progreso, en este teléfono y en la nube. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await deleteAccount();
            } catch {
              setBusy(false);
              useUi.getState().showToast('No se pudo borrar: revisa tu conexión e inténtalo otra vez');
            }
          },
        },
      ],
    );
  return (
    <Card>
      <Eyebrow style={{ marginBottom: 6 }}>Cuenta y datos</Eyebrow>
      <T kind="bold" style={{ fontSize: 14 }}>
        {status}
      </T>
      <Small style={{ marginTop: 4 }}>
        Tu cuenta es anónima: si desinstalas la app o cambias de teléfono, tus datos no se pueden recuperar.
      </Small>
      <Pill
        ghost
        label={busy ? 'Borrando…' : 'Borrar cuenta y datos'}
        onPress={busy ? undefined : confirm}
        style={{ marginTop: 12, alignSelf: 'flex-start' }}
        textStyle={{ color: c.acc }}
      />
    </Card>
  );
}

const SOURCES: [string, string][] = [
  ['Alimentos', 'Tablas Peruanas de Composición de Alimentos (CENAN/INS) y USDA FoodData Central'],
  ['Productos envasados', 'Open Food Facts, base de datos abierta (licencia ODbL)'],
  ['Fotos de ejercicios', 'free-exercise-db (dominio público)'],
  ['Animaciones 3D', 'hechas con Blender y MPFB/MakeHuman (CC0)'],
];

function AboutCard() {
  const { c } = useTheme();
  const link = (label: string, url: string) => (
    <Tap onPress={() => Linking.openURL(url).catch(() => {})} accessibilityRole="link" style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.line }}>
      <T style={{ fontSize: 14 }}>{label}</T>
      <Text style={{ color: c.mut, fontSize: 18 }}>›</Text>
    </Tap>
  );
  return (
    <Card>
      <Eyebrow style={{ marginBottom: 4 }}>Acerca de</Eyebrow>
      <KV first k="Versión" v={Constants.expoConfig?.version ?? '—'} />
      {SOURCES.map(([k, v]) => (
        <View key={k} style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.line }}>
          <T kind="bold" style={{ fontSize: 13 }}>
            {k}
          </T>
          <Small>{v}</Small>
        </View>
      ))}
      {!!PRIVACY_URL && link('Política de privacidad', PRIVACY_URL)}
      {!!CONTACT_EMAIL && link('Contacto', `mailto:${CONTACT_EMAIL}`)}
    </Card>
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
