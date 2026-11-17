import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, LinearTransition, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  LEVELS,
  PLACES,
  SESSION_NAMES,
  SPLIT,
  alternativeExercises,
  exerciseHistory,
  isTimed,
  muscleSets,
  personalRecords,
  setScore,
  setSeconds,
  volumeOf,
  type PlannedExercise,
  type SetLog,
  type Where,
} from '@fitcoach/core';
import { Header } from '@/components/Header';
import { BarList } from '@/components/LineChart';
import { Icon } from '@/components/Icon';
import { Tap } from '@/components/Tap';
import { BigButton, Card, Eyebrow, H, Num, Screen, Small, T, easeOut } from '@/components/ui';
import { currentWeek, fmt } from '@/lib/format';
import { askExactAlarmsOnce } from '@/lib/notify';
import { useProgram } from '@/lib/useProgram';
import { ExerciseDemo } from '@/components/ExerciseDemo';
import { MuscleMap } from '@/components/MuscleMap';
import { todayKey, useApp } from '@/store/useApp';
import { alpha, fonts, radius, useTheme } from '@/theme';

const MUSCLE_LABEL: Record<string, string> = { pecho: 'Pecho', espalda: 'Espalda', pierna: 'Pierna', hombro: 'Hombro', triceps: 'Tríceps', biceps: 'Bíceps', core: 'Core' };
const shortDay = (d: string) => `${Number(d.slice(8))}/${Number(d.slice(5, 7))}`;
const fmtSet = (s: SetLog) => (s.weightKg ? `${s.weightKg} kg × ${s.reps}` : `${s.reps} reps`);
// Código de sesión en lugar de emoji: lectura técnica tipo planilla de entrenamiento.
const SESSION_ICON: Record<string, string> = { full: 'FB', upper: 'TS', lower: 'TI', push: 'EMP', pull: 'TIR', legs: 'PIE' };

export default function Entreno() {
  const { c } = useTheme();
  const router = useRouter();
  const allSets = useApp((s) => s.sets);
  const { profile, week, days, doneDays, next, trainedToday } = useProgram();
  const [focus, setFocus] = useState(0);
  useFocusEffect(useCallback(() => setFocus((n) => n + 1), []));
  useEffect(() => useApp.getState().startProgram(), []);

  const [open, setOpen] = useState<number | null>(null);
  const expanded = open ?? next;
  const weekDays = currentWeek().map((d) => todayKey(d));
  const weekVolume = volumeOf(allSets, weekDays);
  const perMuscle = muscleSets(allSets, weekDays);
  const records = personalRecords(allSets).slice(0, 5);
  const split = [...new Set(SPLIT[profile.daysPerWeek] as readonly string[])].map((k) => SESSION_NAMES[k as keyof typeof SESSION_NAMES]).join(' · ');

  const start = async (d: number) => {
    await askExactAlarmsOnce();
    router.push({ pathname: '/workout', params: { day: String(d) } });
  };

  return (
    <Screen header={<Header subtitle="Tu programa" />} animKey={focus}>
      <Card hero style={{ paddingVertical: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View>
            <Small style={{ letterSpacing: 2, fontFamily: fonts.bold }}>SEMANA</Small>
            <Animated.Text entering={FadeInDown.duration(500)} style={{ color: c.ink, fontFamily: fonts.titleX, fontSize: 71, lineHeight: 72 }}>
              {String(week).padStart(2, '0')}
            </Animated.Text>
          </View>
          <View style={{ alignItems: 'flex-end', paddingBottom: 8 }}>
            <Text style={{ color: c.ink, fontFamily: fonts.titleX, fontSize: 27 }}>
              {doneDays.size}/{days.length}
            </Text>
            <Small>entrenos hechos</Small>
          </View>
        </View>
        <Small style={{ marginTop: 2 }}>
          {split} · {PLACES.find((x) => x.value === profile.where)?.label} · {LEVELS.find((x) => x.value === profile.level)?.label}
        </Small>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 14 }}>
          {days.map((x, i) => (
            <Segment key={x.d} on={doneDays.has(x.d)} current={x.d === next} delay={i * 80} />
          ))}
        </View>
        {next === null ? (
          <T style={{ marginTop: 12, fontSize: 14 }}>¡Semana completa! Descansa; la semana {String(week + 1).padStart(2, '0')} empieza el lunes.</T>
        ) : trainedToday ? (
          <T style={{ marginTop: 12, fontSize: 14 }}>Hoy ya entrenaste. Descansar también construye músculo; mañana toca el Día {next + 1}.</T>
        ) : null}
      </Card>

      {days.map((x, i) => (
        <DayCard
          key={x.d}
          index={i}
          day={x.d}
          kind={x.kind}
          exercises={x.exercises}
          recommended={x.recommended}
          where={profile.where}
          minutes={x.minutes}
          done={doneDays.has(x.d)}
          isNext={x.d === next}
          open={expanded === x.d}
          allSets={allSets}
          onToggle={() => setOpen(expanded === x.d ? -1 : x.d)}
          onStart={() => start(x.d)}
          onSwap={(ei, name) => useApp.getState().swapExercise(x.key, ei, name)}
        />
      ))}

      {/* Esta semana: qué músculos entrenaste y cuántas series a cada uno (10–20 por semana es el rango útil). */}
      <Card style={{ marginTop: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <H>Esta semana</H>
          <Num style={{ fontSize: 13 }}>{weekVolume > 0 ? `${fmt(weekVolume)} kg de volumen` : `${Object.values(perMuscle).reduce((a, b) => a + b, 0)} series`}</Num>
        </View>
        {Object.keys(perMuscle).length ? (
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', marginTop: 10 }}>
            <MuscleMap groups={Object.keys(perMuscle)} height={120} />
            <View style={{ flex: 1 }}>
              <BarList rows={Object.entries(perMuscle).sort((a, b) => b[1] - a[1]).map(([m, n]) => ({ label: MUSCLE_LABEL[m] ?? m, value: n }))} max={Math.max(12, ...Object.values(perMuscle))} />
            </View>
          </View>
        ) : (
          <Small style={{ marginTop: 4 }}>Al terminar tu primer entreno de la semana verás aquí los músculos trabajados y sus series.</Small>
        )}
        <Small style={{ marginTop: 10 }}>Series por músculo. Entre 10 y 20 a la semana es lo que más hace crecer.</Small>
      </Card>

      {records.length > 0 && (
        <Card>
          <Eyebrow style={{ marginBottom: 4 }}>Tus récords</Eyebrow>
          {records.map((r, i) => (
            <View key={r.exercise} style={{ flexDirection: 'row', alignItems: 'baseline', paddingVertical: 9, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
              <T style={{ flex: 1, fontSize: 14 }} numberOfLines={1}>
                {r.exercise}
              </T>
              <Num style={{ fontSize: 13, marginRight: 10 }}>{fmtSet(r.best)}</Num>
              <Small style={{ fontSize: 11 }}>{shortDay(r.day)}</Small>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

/** Tramo de la barra semanal: se rellena con curva de salida (sin rebote) al completar el día. */
function Segment({ on, current, delay }: { on: boolean; current: boolean; delay: number }) {
  const { c } = useTheme();
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(delay, withTiming(on ? 100 : current ? 18 : 0, { duration: 500, easing: easeOut }));
  }, [on, current, delay, w]);
  const a = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return (
    <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: alpha(c.ink, 0.12), overflow: 'hidden' }}>
      <Animated.View style={[{ height: '100%', borderRadius: 5, backgroundColor: c.acc }, a]} />
    </View>
  );
}

interface DayProps {
  index: number;
  day: number;
  kind: keyof typeof SESSION_NAMES;
  exercises: PlannedExercise[];
  /** Ejercicio recomendado por el plan en cada posición (antes de los cambios del usuario). */
  recommended: string[];
  where: Where;
  minutes: number;
  done: boolean;
  isNext: boolean;
  open: boolean;
  allSets: Record<string, SetLog[]>;
  onToggle: () => void;
  onStart: () => void;
  onSwap: (exerciseIndex: number, name: string | null) => void;
}

function DayCard({ index, day, kind, exercises, recommended, where, minutes, done, isNext, open, allSets, onToggle, onStart, onSwap }: DayProps) {
  const { c } = useTheme();
  const [hist, setHist] = useState<number | null>(null);
  const [picking, setPicking] = useState(false);
  const toggleRow = (i: number) => {
    setPicking(false);
    setHist(hist === i ? null : i);
  };
  const choose = (i: number, name: string | null) => {
    setPicking(false);
    onSwap(i, name);
  };
  const sets = exercises.reduce((n, e) => n + e.sets, 0);
  return (
    // Al abrir/cerrar un día las tarjetas se reacomodan sin rebote (curva de salida, 220 ms).
    <Animated.View entering={FadeInDown.delay(120 + index * 70).duration(400)} layout={LinearTransition.duration(220).easing(Easing.out(Easing.cubic))}>
      <View
        style={{
          backgroundColor: c.card,
          borderRadius: radius.card,
          marginBottom: 12,
          borderWidth: isNext ? 2 : 1,
          borderColor: isNext ? c.acc : c.line,
          overflow: 'hidden',
          opacity: done && !open ? 0.7 : 1,
        }}
      >
        <Tap haptic={false} onPress={onToggle} accessibilityState={{ expanded: open }} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
          <View style={{ width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? c.acc : c.bg, borderWidth: 1, borderColor: done ? c.acc : c.line }}>
            {done ? <Icon name="check" size={22} stroke={2.25} color={c.on} /> : <Text style={{ color: c.ink, fontFamily: fonts.numB, fontSize: 12, letterSpacing: 0.5 }}>{SESSION_ICON[kind]}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Small style={{ fontFamily: fonts.num, fontSize: 10.5, letterSpacing: 1.4, color: isNext ? c.acc : c.mut }}>
              DÍA {day + 1}
              {isNext ? ' · SIGUIENTE' : done ? ' · HECHO' : ''}
            </Small>
            <H size={17} style={{ marginTop: 1 }}>
              {SESSION_NAMES[kind]}
            </H>
            <Small>
              {exercises.length} ejercicios · {sets} series · ~{minutes} min
            </Small>
          </View>
          <Text style={{ color: c.mut, fontSize: 20, transform: [{ rotate: open ? '90deg' : '0deg' }] }}>›</Text>
        </Tap>

        {open && (
          <Animated.View entering={FadeIn.duration(300)} style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <MuscleMap groups={exercises.map((e) => e.muscle)} height={150} style={{ marginBottom: 10 }} />
            {exercises.map((e, i) => {
              const swapped = e.name !== recommended[i];
              const alts = hist === i ? alternativeExercises(e.muscle, where, exercises.map((y) => y.name)).filter((n) => n !== recommended[i]) : [];
              return (
                <View key={`${i}-${e.name}`} style={{ borderTopWidth: 1, borderTopColor: c.line }}>
                  <Tap haptic={false} onPress={() => toggleRow(i)} accessibilityState={{ expanded: hist === i }} accessibilityHint="Muestra tu progresión y equivalentes" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
                    <ExerciseDemo name={e.name} muscle={e.muscle} size={40} animate={hist === i} />
                    <View style={{ flex: 1 }}>
                      <T kind="bold" style={{ fontSize: 14 }}>
                        {e.name}
                      </T>
                      <Small>
                        {swapped && <Text style={{ color: c.acc, fontFamily: fonts.num, fontSize: 10.5, letterSpacing: 1 }}>CAMBIADO · </Text>}
                        {e.sets} × {isTimed(e.name) ? `${setSeconds(e)} s` : `${e.reps} reps`} · descanso {e.restSec} s
                      </Small>
                    </View>
                    <Text style={{ color: c.mut, fontSize: 18, transform: [{ rotate: hist === i ? '90deg' : '0deg' }] }}>›</Text>
                  </Tap>
                  {hist === i && (
                    <>
                      <History exercise={e.name} allSets={allSets} />
                      {picking ? (
                        <Animated.View entering={FadeIn.duration(250)} style={{ paddingBottom: 12, gap: 6 }}>
                          <Small style={{ fontFamily: fonts.num, fontSize: 10.5, letterSpacing: 1.4 }}>EQUIVALENTES · MISMO MÚSCULO, SERIES Y DESCANSOS</Small>
                          {swapped && <AltRow name={recommended[i]} muscle={e.muscle} tag="RECOMENDADO" onPress={() => choose(i, null)} />}
                          {alts.map((n) => (
                            <AltRow key={n} name={n} muscle={e.muscle} onPress={() => choose(i, n)} />
                          ))}
                          {!alts.length && !swapped && <Small>No hay otra alternativa para este músculo en tu lugar de entreno.</Small>}
                          <Tap haptic={false} onPress={() => setPicking(false)} style={{ alignSelf: 'center', paddingVertical: 6 }}>
                            <Small>Cancelar</Small>
                          </Tap>
                        </Animated.View>
                      ) : (
                        <Tap
                          onPress={() => setPicking(true)}
                          style={{ alignSelf: 'flex-start', marginBottom: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.btn, borderWidth: 1, borderColor: c.line }}
                        >
                          <Text style={{ color: c.ink, fontFamily: fonts.bold, fontSize: 13 }}>{swapped ? 'Cambiar o volver al recomendado' : 'Cambiar por equivalente'}</Text>
                        </Tap>
                      )}
                    </>
                  )}
                </View>
              );
            })}
            <BigButton label={done ? '↻  Repetir entreno' : '▶  Iniciar entreno'} onPress={onStart} style={{ marginTop: 10 }} />
            <Small style={{ textAlign: 'center', marginTop: 8 }}>Todo es automático: series, descansos y cambio de ejercicio, con voz.</Small>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

/** Opción del selector de equivalentes: miniatura + nombre (+ marca del recomendado). */
function AltRow({ name, muscle, tag, onPress }: { name: string; muscle: string; tag?: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Tap onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 6, borderRadius: radius.btn, backgroundColor: c.bg, borderWidth: 1, borderColor: tag ? c.acc : c.line }}>
      <ExerciseDemo name={name} muscle={muscle} size={30} animate={false} />
      <T style={{ flex: 1, fontSize: 13 }}>{name}</T>
      {tag && <Text style={{ color: c.acc, fontFamily: fonts.num, fontSize: 10, letterSpacing: 1 }}>{tag}</Text>}
    </Tap>
  );
}

/** Progresión del ejercicio: mejor serie por día (últimas 8 sesiones) y récord. */
function History({ exercise, allSets }: { exercise: string; allSets: Record<string, SetLog[]> }) {
  const { c } = useTheme();
  const hist = exerciseHistory(allSets, exercise).slice(-8);
  if (!hist.length) return <Small style={{ marginBottom: 10 }}>Aún no hay historial. Al entrenar verás aquí tu progresión.</Small>;
  const max = Math.max(...hist.map((h) => setScore(h.best)));
  const record = hist.reduce((a, b) => (setScore(b.best) > setScore(a.best) ? b : a));
  const last = hist[hist.length - 1];
  const first = setScore(hist[0].best);
  const change = hist.length > 1 && first ? Math.round(((setScore(last.best) - first) / first) * 100) : null;
  return (
    <Animated.View entering={FadeIn.duration(250)} style={{ paddingBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Small>
          Mejor serie: <Text style={{ color: c.ink, fontFamily: fonts.bold }}>{fmtSet(record.best)}</Text>
        </Small>
        {change !== null && (
          <Small style={{ color: change >= 0 ? c.acc : c.f, fontFamily: fonts.bold }}>
            {change >= 0 ? '+' : ''}
            {change} % desde {shortDay(hist[0].day)}
          </Small>
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 70 }}>
        {hist.map((h) => (
          <View key={h.day} style={{ flex: 1, maxWidth: 40, alignItems: 'center', gap: 4 }}>
            <View style={{ width: '100%', height: Math.max(6, (setScore(h.best) / max) * 50), borderRadius: 6, backgroundColor: h === last ? c.acc : alpha(c.acc, 0.4) }} />
            <Small style={{ fontSize: 10 }}>{shortDay(h.day)}</Small>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}
