import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import { FOODS, SESSION_NAMES, TRAIN_DAYS, adaptiveAdjust, coachMessage, weightTrend } from '@fitcoach/core';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { LineChart } from '@/components/LineChart';
import { MacroBar } from '@/components/MacroBar';
import { MuscleMap } from '@/components/MuscleMap';
import { Ring } from '@/components/Ring';
import { Tap } from '@/components/Tap';
import { BigButton, Card, Eyebrow, H, Num, Pill, Screen, Small, T } from '@/components/ui';
import { WEEKDAYS, currentWeek, fmt, weekdayIndex } from '@/lib/format';
import { bestProtein, sum, usePlan } from '@/lib/usePlan';
import { useProgram } from '@/lib/useProgram';
import { askExactAlarmsOnce } from '@/lib/notify';
import { fmtKg, fmtRate, weightPoints } from '@/lib/weight';
import { todayKey, useApp, type LogItem } from '@/store/useApp';
import { useUi } from '@/store/useUi';
import { alpha, fonts, radius, useTheme } from '@/theme';

const NO_LOGS: LogItem[] = [];
const LONG = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' });

/**
 * Hoy = tablero del día: cómo vas (calorías y macros), qué entrenas, tu peso y el agua.
 * Las comidas se registran en Menú. Tocar otro día de la semana muestra su resumen.
 */
export default function Hoy() {
  const { c } = useTheme();
  const router = useRouter();
  const profile = useApp((s) => s.profile)!;
  const t = useApp((s) => s.targets)!;
  const allLogs = useApp((s) => s.logs);
  const allWater = useApp((s) => s.water);
  const workoutDays = useApp((s) => s.workoutDays);
  const allSets = useApp((s) => s.sets);
  const weights = useApp((s) => s.weights);
  const adjustedAt = useApp((s) => s.adjustedAt);
  const { setWater, addLogs } = useApp.getState();
  const plan = usePlan();
  const { days, week, next, doneToday, trainedToday } = useProgram();
  const { showToast, confetti } = useUi.getState();
  const [focus, setFocus] = useState(0);
  useFocusEffect(useCallback(() => setFocus((n) => n + 1), []));

  const today = todayKey();
  const weekDates = currentWeek();
  const [sel, setSel] = useState(today);
  const isToday = sel === today;
  const logs = allLogs[sel] ?? NO_LOGS;
  const water = allWater[sel] ?? 0;
  const eaten = sum(logs);
  const left = Math.round(t.kcal - eaten.kcal);
  const tip = coachMessage({ ...eaten, logs: logs.length }, t, bestProtein(profile));
  const trainDays = TRAIN_DAYS[profile.daysPerWeek] as readonly number[];
  const selWeekday = weekdayIndex(new Date(`${sel}T12:00:00`));
  const nextMeal = plan.findIndex((_, i) => !logs.some((l) => l.slot === i));

  const trend = weightTrend(weights, today);
  const lastWeigh = Object.keys(weights).sort().pop();
  const adjust = !adjustedAt || daysBetween(adjustedAt, today) >= 7 ? adaptiveAdjust(weights, t, profile.goal, today) : null;

  return (
    <Screen header={<Header subtitle="Tu día de hoy" />} animKey={focus}>
      {/* Semana: toca un día para ver su resumen. */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
        {weekDates.map((d, i) => {
          const key = todayKey(d);
          const on = key === sel;
          const future = key > today;
          const trained = workoutDays.includes(key);
          return (
            <Tap
              key={i}
              haptic={false}
              disabled={future}
              onPress={() => setSel(key)}
              accessibilityLabel={`${LONG.format(d)}${trained ? ', entrenaste' : ''}`}
              style={{ width: 42, paddingVertical: 8, borderRadius: 8, alignItems: 'center', gap: 3, backgroundColor: on ? c.ink : 'transparent', borderWidth: 1, borderColor: key === today && !on ? c.line : on ? c.ink : 'transparent', opacity: future ? 0.4 : 1 }}
            >
              <Eyebrow style={{ fontSize: 9.5, letterSpacing: 1, color: on ? alpha(c.bg, 0.7) : c.mut }}>{WEEKDAYS[i]}</Eyebrow>
              <Text style={{ fontFamily: fonts.title, fontSize: 18, color: on ? c.bg : c.ink }}>{d.getDate()}</Text>
              {trained ? (
                <Icon name="check" size={10} stroke={2.5} color={on ? c.bg : c.acc} />
              ) : (
                <View style={{ width: 10, height: 2, marginVertical: 4, backgroundColor: trainDays.includes(i) ? (on ? c.bg : c.acc) : 'transparent' }} />
              )}
            </Tap>
          );
        })}
      </View>

      {!isToday && (
        <Animated.View entering={FadeIn.duration(200)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Eyebrow>Resumen del {LONG.format(new Date(`${sel}T12:00:00`))}</Eyebrow>
          <Tap haptic={false} onPress={() => setSel(today)}>
            <Small style={{ color: c.ink, fontFamily: fonts.bold }}>Volver a hoy</Small>
          </Tap>
        </Animated.View>
      )}

      {/* 1 · Cómo vas: balance de calorías del día elegido. */}
      <Card hero>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Ring pct={eaten.kcal / t.kcal}>
            <Text style={{ fontFamily: fonts.titleX, fontSize: 34, color: c.ink }}>{fmt(Math.abs(left))}</Text>
            <Eyebrow style={{ fontSize: 9 }}>{left < 0 ? 'kcal de más' : 'kcal restantes'}</Eyebrow>
          </Ring>
          <View style={{ flex: 1, gap: 9 }}>
            {[
              ['Meta', t.kcal],
              ['Consumidas', eaten.kcal],
              ['Mantenimiento', t.tdee],
            ].map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 7, borderBottomWidth: 1, borderBottomColor: alpha(c.ink, 0.08) }}>
                <Eyebrow style={{ fontSize: 9.5 }}>{k}</Eyebrow>
                <Num>{fmt(v as number)}</Num>
              </View>
            ))}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 18 }}>
          <MacroBar label="Proteína" value={eaten.p} target={t.protein} color={c.p} />
          <MacroBar label="Carbos" value={eaten.c} target={t.carbs} color={c.c} />
          <MacroBar label="Grasas" value={eaten.f} target={t.fat} color={c.f} />
        </View>
        {isToday && (
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: alpha(c.ink, 0.08) }}>
            <View style={{ flex: 1 }}>
              <Eyebrow color={c.acc}>Coach</Eyebrow>
              <T style={{ marginTop: 3, lineHeight: 20, fontSize: 14 }}>{tip.text}</T>
            </View>
            {tip.action ? (
              <Pill
                label="Añadir"
                ghost
                onPress={() => {
                  const slot = nextMeal >= 0 ? nextMeal : plan.length - 1;
                  addLogs([{ ...tip.action!, slot, via: 'manual' }]);
                  confetti();
                  showToast(`${tip.action!.grams} g de ${FOODS[tip.action!.foodId].name.toLowerCase()} ✓`);
                }}
              />
            ) : (
              <Pill label="Menú" ghost onPress={() => router.push('/plan')} />
            )}
          </View>
        )}
      </Card>

      {/* 2 · Entreno del día elegido. */}
      <Card>
        <Eyebrow style={{ marginBottom: 8 }}>{isToday ? 'Entreno de hoy' : 'Entreno'}</Eyebrow>
        {!isToday ? (
          workoutDays.includes(sel) ? (
            <PastWorkout sets={allSets[sel] ?? []} />
          ) : (
            <T style={{ fontSize: 14, color: c.mut }}>{trainDays.includes(selWeekday) ? 'Ese día tocaba entrenar y no se registró sesión.' : 'Día de descanso.'}</T>
          )
        ) : trainedToday ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: c.acc, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={22} stroke={2.25} color={c.on} />
            </View>
            <View style={{ flex: 1 }}>
              <H size={17}>{doneToday !== null && days[doneToday] ? `${SESSION_NAMES[days[doneToday].kind]} completado` : 'Entreno completado'}</H>
              <Small>{next !== null ? `Lo próximo: Día ${next + 1} · ${SESSION_NAMES[days[next].kind]}.` : 'Semana completa. Buen trabajo.'}</Small>
            </View>
            <Pill label="Progreso" ghost onPress={() => router.push('/entreno')} />
          </View>
        ) : next === null ? (
          <T style={{ fontSize: 14 }}>Semana completa. Descansa: la semana {String(week + 1).padStart(2, '0')} empieza el lunes.</T>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Small style={{ fontFamily: fonts.num, fontSize: 10.5, letterSpacing: 1.4, color: trainDays.includes(selWeekday) ? c.acc : c.mut }}>
                  {trainDays.includes(selWeekday) ? `DÍA ${next + 1} · TE TOCA HOY` : `HOY DESCANSAS · PRÓXIMO: DÍA ${next + 1}`}
                </Small>
                <H size={22} style={{ marginTop: 2 }}>
                  {SESSION_NAMES[days[next].kind]}
                </H>
                <Small>
                  {days[next].exercises.length} ejercicios · {days[next].exercises.reduce((n, e) => n + e.sets, 0)} series · ~{days[next].minutes} min
                </Small>
              </View>
              <MuscleMap groups={days[next].exercises.map((e) => e.muscle)} height={84} />
            </View>
            {trainDays.includes(selWeekday) ? (
              <BigButton
                label="Iniciar entreno"
                onPress={async () => {
                  await askExactAlarmsOnce();
                  router.push({ pathname: '/workout', params: { day: String(next) } });
                }}
                style={{ marginTop: 14 }}
              />
            ) : (
              <Small style={{ marginTop: 10 }}>Descansar también es parte del plan. Si quieres adelantar, entra a Entreno.</Small>
            )}
          </>
        )}
      </Card>

      {/* 3 · Ajuste adaptativo: una propuesta por semana como máximo. */}
      {isToday && adjust && (
        <Card style={{ borderLeftWidth: 2, borderLeftColor: c.acc }}>
          <Eyebrow color={c.acc}>Ajuste de calorías sugerido</Eyebrow>
          <T style={{ marginTop: 4, fontSize: 14, lineHeight: 20 }}>{adjust.reason}</T>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Pill
              label={`Aplicar ${adjust.delta > 0 ? '+' : '−'}${Math.abs(adjust.delta)} kcal`}
              onPress={() => {
                useApp.getState().applyAdjust(adjust.delta);
                showToast(`Meta: ${fmt(t.kcal + adjust.delta)} kcal`);
              }}
              style={{ flex: 1, paddingVertical: 12 }}
            />
            <Pill label="Ahora no" ghost onPress={() => useApp.getState().applyAdjust(0)} style={{ paddingVertical: 12 }} />
          </View>
        </Card>
      )}

      {/* 4 · Peso: último registro, tendencia y registro rápido. */}
      <WeightCard trend={trend?.kgPerWeek ?? null} plan={t.weeklyKg} lastDay={lastWeigh} />

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Eyebrow>Agua</Eyebrow>
          <Num style={{ fontSize: 12 }}>
            {water * 250}
            <Num style={{ fontSize: 12, color: c.mut }}> / 2000 ml</Num>
          </Num>
        </View>
        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'flex-end' }}>
          {Array.from({ length: 8 }, (_, i) => (
            <Tap
              key={i}
              onPress={() => setWater(water === i + 1 ? i : i + 1, sel)}
              accessibilityLabel={`${(i + 1) * 250} ml de agua`}
              accessibilityState={{ selected: i < water }}
              style={{ flex: 1, height: 44, borderRadius: 4, backgroundColor: i < water ? c.water : c.bg, borderWidth: 1, borderColor: i < water ? c.water : c.line }}
            />
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

/** Resumen de un entreno pasado: series y volumen. */
function PastWorkout({ sets }: { sets: { exercise: string; reps: number; weightKg: number }[] }) {
  const { c } = useTheme();
  const names = [...new Set(sets.map((s) => s.exercise))];
  const volume = sets.reduce((v, s) => v + s.weightKg * s.reps, 0);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: c.acc, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="check" size={22} stroke={2.25} color={c.on} />
      </View>
      <View style={{ flex: 1 }}>
        <H size={16}>
          {sets.length} series · {names.length} ejercicios
        </H>
        <Small numberOfLines={2}>{volume > 0 ? `Volumen ${fmt(volume)} kg · ` : ''}{names.join(', ')}</Small>
      </View>
    </View>
  );
}

/** Peso: último valor, tendencia frente al plan, minigráfico y registro con ± 0,1 kg. */
function WeightCard({ trend, plan, lastDay }: { trend: number | null; plan: number; lastDay?: string }) {
  const { c } = useTheme();
  const router = useRouter();
  const weights = useApp((s) => s.weights);
  const profileKg = useApp((s) => s.profile?.weightKg ?? 70);
  const last = lastDay ? weights[lastDay] : profileKg;
  const [edit, setEdit] = useState<number | null>(null);
  const today = todayKey();
  const stale = !lastDay || Date.parse(`${today}T00:00:00Z`) - Date.parse(`${lastDay}T00:00:00Z`) >= 6 * 86_400_000;
  const pts = weightPoints(weights, 8);
  const step = (d: number) => setEdit((v) => Math.round(((v ?? last) + d) * 10) / 10);
  const btn = { width: 44, height: 44, borderRadius: radius.btn, backgroundColor: c.bg, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' } as const;
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Eyebrow>Peso</Eyebrow>
        <Tap haptic={false} onPress={() => router.push('/progreso')} accessibilityLabel="Ver progreso">
          <Small style={{ color: c.ink, fontFamily: fonts.bold }}>Progreso ›</Small>
        </Tap>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 4 }}>
        <Text style={{ color: c.ink, fontFamily: fonts.titleX, fontSize: 34 }}>{fmtKg(edit ?? last)}</Text>
        <Small style={{ marginBottom: 7 }}>kg</Small>
        <View style={{ flex: 1 }} />
        {trend !== null && (
          <View style={{ alignItems: 'flex-end', marginBottom: 4 }}>
            <Num style={{ fontSize: 13 }}>{fmtRate(trend)}</Num>
            <Small style={{ fontSize: 11 }}>plan {fmtRate(plan)}</Small>
          </View>
        )}
      </View>
      {pts.length >= 2 && edit === null && <LineChart points={pts} height={96} unit="kg" />}
      {edit !== null ? (
        <Animated.View entering={FadeIn.duration(200)} style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <Tap onPress={() => step(-0.1)} style={btn} accessibilityLabel="Restar 100 gramos">
            <Text style={{ color: c.ink, fontFamily: fonts.bold, fontSize: 18 }}>−</Text>
          </Tap>
          <Tap onPress={() => step(0.1)} style={btn} accessibilityLabel="Sumar 100 gramos">
            <Text style={{ color: c.ink, fontFamily: fonts.bold, fontSize: 18 }}>＋</Text>
          </Tap>
          <Pill
            label="Guardar"
            onPress={() => {
              useApp.getState().logWeight(edit);
              setEdit(null);
            }}
            style={{ flex: 1, paddingVertical: 13 }}
          />
          <Pill label="✕" a11y="Cancelar" ghost onPress={() => setEdit(null)} style={{ paddingVertical: 13, paddingHorizontal: 14 }} />
        </Animated.View>
      ) : (
        <Pill label={stale ? 'Registrar el peso de esta semana' : 'Actualizar peso'} ghost={!stale} onPress={() => setEdit(last)} style={{ marginTop: 10, paddingVertical: 12 }} />
      )}
    </Card>
  );
}
