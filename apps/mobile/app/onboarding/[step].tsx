import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ACTIVITIES,
  ALLERGIES,
  AVOIDS,
  DAYS_OPTIONS,
  LEVELS,
  MEALS_OPTIONS,
  MINOR_NOTICE,
  PLACES,
  STEPS,
  computeTargets,
  goalOptions,
  isMinor,
  paceOptions,
  validateBasics,
  type Profile,
} from '@fitcoach/core';
import { Chip, OptionCard } from '@/components/Chip';
import { Tap } from '@/components/Tap';
import { BigButton, Card, H, Small, T, easeOut, flipIn } from '@/components/ui';
import { fmt } from '@/lib/format';
import { useApp } from '@/store/useApp';
import { alpha, fonts, radius, useTheme } from '@/theme';

const LAST = STEPS.length - 1; // resumen

function Stepper({ label, unit, value, min, max, step = 1, onChange }: { label: string; unit: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  const { c } = useTheme();
  const btn = { width: 34, height: 34, borderRadius: 11, backgroundColor: c.bg, borderWidth: 1, borderColor: c.line, alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, paddingHorizontal: 14, borderRadius: radius.btn, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, marginBottom: 10 }}>
      <T kind="bold">{label}</T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Tap style={btn} onPress={() => onChange(Math.max(min, value - step))}>
          <Text style={{ color: c.ink, fontFamily: fonts.bold, fontSize: 18 }}>−</Text>
        </Tap>
        <T kind="bold" style={{ minWidth: 70, textAlign: 'center' }}>
          {value} {unit}
        </T>
        <Tap style={btn} onPress={() => onChange(Math.min(max, value + step))}>
          <Text style={{ color: c.ink, fontFamily: fonts.bold, fontSize: 18 }}>+</Text>
        </Tap>
      </View>
    </View>
  );
}

const Label = ({ children }: { children: string }) => <Small style={{ fontSize: 14, marginTop: 16, marginBottom: 8 }}>{children}</Small>;

export default function OnboardingStep() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { step: raw } = useLocalSearchParams<{ step: string }>();
  const step = Math.min(LAST, Math.max(0, Number(raw) || 0));
  const draft = useApp((s) => s.draft);
  const setDraft = useApp((s) => s.setDraft);
  const commitProfile = useApp((s) => s.commitProfile);
  const [touched, setTouched] = useState(false);

  const meta = STEPS[step];
  const minor = isMinor(draft.age ?? 25);
  const errors = useMemo(
    () => validateBasics({ name: draft.name ?? '', age: draft.age ?? 0, weightKg: draft.weightKg ?? 0, heightCm: draft.heightCm ?? 0 }),
    [draft.name, draft.age, draft.weightKg, draft.heightCm],
  );

  // Menores: sin déficit ni ritmo rápido.
  useEffect(() => {
    if (minor && draft.goal === 'lose') setDraft({ goal: 'gain' });
    if (minor && draft.pace === 'fast') setDraft({ pace: 'moderate' });
  }, [minor, draft.goal, draft.pace, setDraft]);

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(((step + 1) / STEPS.length) * 100, { duration: 600, easing: easeOut });
  }, [step, progress]);
  const bar = useAnimatedStyle(() => ({ width: `${progress.value}%` }));

  const canContinue = meta.id !== 'basics' || Object.keys(errors).length === 0;

  // Pasos de una sola elección: avanzan solos 300 ms después de elegir (un toque menos por pantalla).
  const AUTO = new Set<string>(['goal', 'pace', 'level', 'activity', 'meals']);
  const advancing = useRef(false);
  const pick = (patch: Partial<Profile>) => {
    setDraft(patch);
    if (!AUTO.has(meta.id) || advancing.current) return;
    advancing.current = true;
    setTimeout(() => {
      advancing.current = false;
      router.push(`/onboarding/${step + 1}`);
    }, 300);
  };
  const toggle = (key: 'allergies' | 'avoid', v: string) => {
    const cur = draft[key] ?? [];
    setDraft({ [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] });
  };

  const next = () => {
    if (meta.id === 'basics' && !canContinue) {
      setTouched(true);
      return;
    }
    if (step < LAST) router.push(`/onboarding/${step + 1}`);
    else {
      commitProfile(draft as Profile);
      router.replace('/(tabs)');
    }
  };

  const summary = step === LAST ? computeTargets(draft as Profile) : null;
  const exclusions = [...(draft.allergies ?? []), ...(draft.avoid ?? [])];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + 14, paddingBottom: insets.bottom + 16, paddingHorizontal: 22 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Tap
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: c.ink, fontSize: 18 }}>‹</Text>
        </Tap>
        <View style={{ flex: 1, height: 6, borderRadius: 6, backgroundColor: c.line, overflow: 'hidden' }}>
          <Animated.View style={[{ height: '100%', backgroundColor: c.acc, borderRadius: 6 }, bar]} />
        </View>
      </View>

      <Animated.View key={step} entering={flipIn} style={{ flex: 1 }}>
        <H size={26} style={{ lineHeight: 30, marginTop: 10 }}>
          {meta.title}
        </H>
        {!!meta.subtitle && <T kind="mut" style={{ marginTop: 6 }}>{meta.subtitle}</T>}

        <ScrollView style={{ flex: 1, marginVertical: 16 }} contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {meta.id === 'basics' && (
            <>
              <TextInput
                value={draft.name}
                onChangeText={(name) => setDraft({ name })}
                placeholder="¿Cómo te llamas?"
                placeholderTextColor={c.mut}
                maxLength={18}
                style={{ padding: 13, paddingHorizontal: 14, borderRadius: 14, backgroundColor: c.card, color: c.ink, borderWidth: 1, borderColor: touched && errors.name ? c.f : c.line, fontFamily: fonts.med, fontSize: 15, marginBottom: 8 }}
              />
              {touched && errors.name && <Small style={{ color: c.f, marginBottom: 8 }}>{errors.name}</Small>}
              <Label>Sexo biológico</Label>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                <Chip label="Hombre" on={draft.sex === 'male'} onPress={() => setDraft({ sex: 'male' })} />
                <Chip label="Mujer" on={draft.sex === 'female'} onPress={() => setDraft({ sex: 'female' })} />
              </View>
              <Label>Tu cuerpo</Label>
              <Stepper label="Edad" unit="años" value={draft.age ?? 25} min={14} max={80} onChange={(age) => setDraft({ age })} />
              <Stepper label="Peso actual" unit="kg" value={draft.weightKg ?? 70} min={35} max={250} onChange={(weightKg) => setDraft({ weightKg })} />
              <Stepper label="Altura" unit="cm" value={draft.heightCm ?? 175} min={130} max={220} onChange={(heightCm) => setDraft({ heightCm })} />
              {minor && (
                <Card style={{ backgroundColor: alpha(c.c, 0.12), borderColor: alpha(c.c, 0.4) }}>
                  <T style={{ fontSize: 13 }}>{MINOR_NOTICE}</T>
                </Card>
              )}
            </>
          )}

          {meta.id === 'goal' && goalOptions(draft.age ?? 25).map((o) => <OptionCard key={o.value} title={o.label} desc={o.desc} on={draft.goal === o.value} onPress={() => pick({ goal: o.value })} />)}
          {meta.id === 'pace' && paceOptions(draft.age ?? 25).map((o) => <OptionCard key={o.value} title={o.label} desc={o.desc} on={draft.pace === o.value} onPress={() => pick({ pace: o.value })} />)}
          {meta.id === 'level' && LEVELS.map((o) => <OptionCard key={o.value} title={o.label} desc={o.desc} on={draft.level === o.value} onPress={() => pick({ level: o.value })} />)}
          {meta.id === 'where' && (
            <>
              {PLACES.map((o) => (
                <OptionCard key={o.value} title={(o.value === 'gym' ? '🏋️ ' : '🏠 ') + o.label} desc={o.desc} on={draft.where === o.value} onPress={() => setDraft({ where: o.value })} />
              ))}
              <Label>Días de entrenamiento por semana</Label>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {DAYS_OPTIONS.map((d) => (
                  <Chip key={d} label={`${d} días`} on={draft.daysPerWeek === d} onPress={() => setDraft({ daysPerWeek: d })} />
                ))}
              </View>
            </>
          )}
          {meta.id === 'activity' && ACTIVITIES.map((o) => <OptionCard key={o.value} title={o.label} desc={o.desc} on={draft.activity === o.value} onPress={() => pick({ activity: o.value })} />)}
          {meta.id === 'allergies' && (
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {ALLERGIES.map((a) => (
                <Chip key={a} label={a} on={(draft.allergies ?? []).includes(a)} onPress={() => toggle('allergies', a)} />
              ))}
            </View>
          )}
          {meta.id === 'avoid' && (
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {AVOIDS.map((a) => (
                <Chip key={a} label={a} on={(draft.avoid ?? []).includes(a)} onPress={() => toggle('avoid', a)} />
              ))}
            </View>
          )}
          {meta.id === 'meals' &&
            MEALS_OPTIONS.map((o) => (
              <OptionCard key={o.value} title={`${o.label} comidas`} desc={o.desc} on={draft.mealsPerDay === Number(o.value)} onPress={() => pick({ mealsPerDay: Number(o.value) as 3 | 4 | 5 })} />
            ))}

          {summary && (
            <>
              <Card hero>
                <Text style={{ fontFamily: fonts.titleX, fontSize: 36, color: c.acc }}>{fmt(summary.kcal)} kcal</Text>
                <Small>
                  Mantenimiento {fmt(summary.tdee)} kcal · {summary.weeklyKg > 0 ? '+' : ''}
                  {summary.weeklyKg} kg/sem
                </Small>
                <T style={{ marginTop: 8 }}>
                  Proteína {summary.protein} g · Carbos {summary.carbs} g · Grasas {summary.fat} g
                </T>
              </Card>
              <Card>
                <T>
                  📍 {PLACES.find((p) => p.value === draft.where)?.label} · {draft.daysPerWeek} días · {LEVELS.find((l) => l.value === draft.level)?.label}
                </T>
                <T style={{ marginTop: 8 }}>🍽️ {draft.mealsPerDay} comidas al día</T>
                <T style={{ marginTop: 8 }}>🚫 Sin: {exclusions.length ? exclusions.join(', ') : 'nada excluido'}</T>
              </Card>
              <Small style={{ textAlign: 'center' }}>Orientativo: no reemplaza a un nutricionista ni a un médico.</Small>
            </>
          )}
        </ScrollView>
      </Animated.View>

      <BigButton label={step === LAST ? 'Empezar' : step === LAST - 1 ? 'Calcular mi plan' : 'Continuar'} onPress={next} disabled={meta.id === 'basics' && touched && !canContinue} />
    </View>
  );
}
