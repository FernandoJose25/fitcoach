import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Alert, AppState, BackHandler, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeOutLeft,
  ZoomIn,
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { ExerciseDemo } from '@/components/ExerciseDemo';
import { MuscleMap } from '@/components/MuscleMap';
import {
  SESSION_NAMES,
  applySwaps,
  buildSession,
  buildTimeline,
  isTimed,
  lastSet,
  newRecords,
  programWeek,
  repsLow,
  sessionForDay,
  setSeconds,
  suggestNext,
  type PlannedExercise,
  type SetLog,
  type Step,
} from '@fitcoach/core';
import { Icon } from '@/components/Icon';
import { Tap } from '@/components/Tap';
import { BigButton, Small } from '@/components/ui';
import { fmt } from '@/lib/format';
import { cue, prepareVoice, speak, stopVoice } from '@/lib/coachVoice';
import { allowNotifications, cancelAll, scheduleAll } from '@/lib/notify';
import { todayKey, useApp } from '@/store/useApp';
import { useUi } from '@/store/useUi';
import { alpha, fonts, useTheme } from '@/theme';

const NO_SETS: SetLog[] = [];
/** Vuelve a Entreno aunque no haya pantalla anterior (p. ej. tras abrir el entreno desde una notificación). */
const close = (router: ReturnType<typeof useRouter>) => (router.canGoBack() ? router.back() : router.replace('/entreno'));
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
const R = 46;
const CIRC = 2 * Math.PI * R;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Values {
  w: number;
  r: number;
}

/** Entreno guiado: preparación → serie → descanso → … todo automático, con voz, vibración y avisos en segundo plano. */
export default function Workout() {
  useKeepAwake();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ day: string }>();
  const dayIdx = Number(params.day ?? 0);

  // Se congela al empezar: cambios de perfil o de ejercicios no alteran un entreno en curso.
  const [{ exercises, timeline, week, title }] = useState(() => {
    const s = useApp.getState();
    const p = s.profile!;
    const ses = sessionForDay(dayIdx, p);
    const exs = applySwaps(buildSession(ses.kind, ses.occurrence, p), s.swaps[`${ses.kind}-${ses.occurrence}`] ?? {});
    return {
      exercises: exs,
      timeline: buildTimeline(exs),
      week: programWeek(s.programStart ?? todayKey(), todayKey()),
      title: `Día ${dayIdx + 1} · ${SESSION_NAMES[ses.kind]}`,
    };
  });

  // Valores por serie ("ej-serie"): peso y repeticiones, precargados con lo último registrado.
  const values = useRef<Record<string, Values>>({});
  // Por qué se propone ese objetivo (sobrecarga progresiva), por serie.
  const notes = useRef<Record<string, string>>({});
  const valueOf = useCallback(
    (ex: number, set: number): Values => {
      const k = `${ex}-${set}`;
      if (!values.current[k]) {
        const e = exercises[ex];
        const prevSame = set > 1 ? values.current[`${ex}-${set - 1}`] : undefined;
        const last = lastSet(useApp.getState().sets, e.name, set, todayKey());
        const reps = isTimed(e.name) ? setSeconds(e) : repsLow(e.reps);
        const sug = suggestNext(last, e.reps, isTimed(e.name));
        values.current[k] = { w: prevSame?.w ?? sug?.weightKg ?? 0, r: sug?.reps ?? prevSame?.r ?? reps };
        notes.current[k] = sug?.note ?? (set === 1 ? 'Primera vez: elige un peso con el que llegues al rango con buena técnica' : '');
      }
      return values.current[k];
    },
    [exercises],
  );

  // Motor: índice del paso, hora de fin y tiempo restante si está en pausa. En refs para el intervalo.
  // mid: ya se dio la indicación de mitad de serie / fin de descanso del paso actual.
  const st = useRef({ i: 0, endsAt: Date.now() + timeline[0].secs * 1000, paused: null as number | null, done: false, spoken: -1, mid: false, ver: 0 });
  const startedAt = useRef(Date.now());
  const [, render] = useReducer((x: number) => x + 1, 0);
  const [now, setNow] = useState(Date.now());
  const voice = useApp((s) => s.voice);
  const voiceRef = useRef(voice);
  voiceRef.current = voice;
  const firstName = useApp.getState().profile?.name.trim().split(/\s+/)[0] || undefined;

  const say = useCallback((text: string) => {
    if (voiceRef.current) speak(text);
  }, []);

  const announce = useCallback(
    (step: Step) => {
      const e = exercises[step.ex];
      const v = valueOf(step.ex, step.set);
      const target = isTimed(e.name) ? `${v.r} segundos` : `${v.r} repeticiones${v.w ? ` con ${fmtKg(v.w)} kilos` : ''}`;
      if (step.kind === 'work') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        say(cue.work(step.set, e.sets, target, firstName));
      } else if (step.kind === 'rest') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        // En el descanso, `ex`/`set` son de la serie que viene: set 1 = cambia de ejercicio.
        say(cue.rest(step.secs, step.set === 1 ? e.name : null, firstName));
      } else {
        say(cue.start(e.name, target, firstName));
      }
    },
    [exercises, firstName, say, valueOf],
  );

  const log = useCallback(
    (step: Step) => {
      if (step.kind !== 'work') return;
      const v = valueOf(step.ex, step.set);
      useApp.getState().logSet({ exercise: exercises[step.ex].name, setNo: step.set, reps: v.r, weightKg: v.w });
    },
    [exercises, valueOf],
  );

  const finish = useCallback(() => {
    const s = st.current;
    if (s.done) return;
    s.done = true;
    cancelAll();
    useApp.getState().finishWorkout(week, dayIdx);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    say(cue.done(firstName));
    useUi.getState().confetti();
    render();
  }, [dayIdx, firstName, say, week]);

  /** Cierra el paso actual (registra la serie si era de trabajo) y arranca el siguiente desde `base`. */
  const advance = useCallback(
    (base: number) => {
      const s = st.current;
      // Toques encolados tras terminar (o un "Saltar" en el último paso) no deben pasar del final.
      if (s.done || s.i >= timeline.length) return;
      log(timeline[s.i]);
      s.i++;
      s.spoken = -1;
      s.mid = false;
      if (s.i >= timeline.length) return finish();
      s.endsAt = base + timeline[s.i].secs * 1000;
      announce(timeline[s.i]);
      render();
    },
    [announce, finish, log, timeline],
  );

  // Arranque: permiso de avisos (antes de salir de la app) y primera indicación.
  useEffect(() => {
    allowNotifications();
    prepareVoice();
    announce(timeline[0]);
    return () => {
      stopVoice();
      cancelAll();
    };
  }, []);

  // Reloj: avanza solo; si la app estuvo en segundo plano, recupera todos los pasos que ya pasaron.
  useEffect(() => {
    const id = setInterval(() => {
      const s = st.current;
      const t = Date.now();
      if (s.done || s.paused !== null) return;
      let guard = 0;
      while (!s.done && t >= s.endsAt && guard++ < timeline.length) advance(s.endsAt);
      const left = Math.ceil((s.endsAt - t) / 1000);
      const step = timeline[s.i];
      const e = step && exercises[step.ex];
      const timedWork = step?.kind === 'work' && isTimed(e.name);
      if (!s.done && left <= 3 && left >= 1 && left !== s.spoken && step.secs > 5) {
        s.spoken = left;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        if (step.kind !== 'work' || timedWork) say(String(left));
      }
      // Indicaciones de instructor: técnica a mitad de serie y aviso a 10 s del final del descanso.
      if (!s.done && !s.mid && step.kind === 'work' && step.secs >= 20 && (step.secs * 1000 - (s.endsAt - t)) >= step.secs * 450) {
        s.mid = true;
        say(cue.midSet(e.muscle));
      } else if (!s.done && !s.mid && step.kind === 'rest' && step.secs >= 25 && left === 10) {
        s.mid = true;
        say(cue.restEnding(step.set, step.set === 1 ? e.name : null));
      }
      setNow(t);
    }, 200);
    return () => clearInterval(id);
  }, [advance, exercises, say, timeline]);

  // Segundo plano: se programan los avisos de lo que falta; al volver se cancelan.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const s = st.current;
      if (state === 'active') return cancelAll();
      if (state !== 'background' || s.done || s.paused !== null) return;
      const items: { at: number; title: string; body: string }[] = [];
      let at = s.endsAt;
      for (let k = s.i + 1; k < timeline.length && items.length < 60; k++) {
        const step = timeline[k];
        const e = exercises[step.ex];
        items.push(
          step.kind === 'work'
            ? { at, title: `Serie ${step.set} de ${e.sets}`, body: e.name }
            : { at, title: `⏱️ Descanso · ${step.secs} s`, body: `Sigue: ${e.name}` },
        );
        at += step.secs * 1000;
      }
      items.push({ at, title: '🎉 ¡Entreno completado!', body: 'Abre FitCoach para guardar tu sesión.' });
      scheduleAll(items);
    });
    return () => sub.remove();
  }, [exercises, timeline]);

  const exit = useCallback(() => {
    if (st.current.done) return close(router);
    Alert.alert('¿Salir del entreno?', 'Las series que hiciste quedan guardadas.', [
      { text: 'Seguir entrenando', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => close(router) },
    ]);
  }, [router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      exit();
      return true;
    });
    return () => sub.remove();
  }, [exit]);

  const s = st.current;
  if (s.done) return <Summary exercises={exercises} title={title} week={week} seconds={Math.round((Date.now() - startedAt.current) / 1000)} />;

  const step = timeline[s.i];
  const ex = exercises[step.ex];
  const remaining = s.paused !== null ? s.paused : Math.max(0, s.endsAt - now);
  const secsLeft = Math.ceil(remaining / 1000);
  const tint = step.kind === 'work' ? c.acc : step.kind === 'rest' ? c.rest : c.c;
  const doneSets = timeline.slice(0, s.i).filter((x) => x.kind === 'work').length;
  const totalSets = timeline.filter((x) => x.kind === 'work').length;
  // Panel editable: la serie en curso o, durante el descanso, la que acabas de hacer.
  const prevWork = [...timeline.slice(0, s.i)].reverse().find((x) => x.kind === 'work');
  const editing = step.kind === 'rest' ? prevWork : step;
  const label = step.kind === 'work' ? `SERIE ${step.set} DE ${ex.sets}` : step.kind === 'rest' ? 'DESCANSO' : 'PREPÁRATE';

  const togglePause = () => {
    if (s.paused !== null) {
      s.endsAt = Date.now() + s.paused;
      s.paused = null;
      say(cue.resume());
    } else {
      s.paused = Math.max(0, s.endsAt - Date.now());
      stopVoice();
    }
    s.ver++;
    render();
  };
  const skip = () => {
    if (s.paused !== null) {
      s.paused = null;
    }
    advance(Date.now());
  };
  const add15 = () => {
    if (s.paused !== null) s.paused += 15000;
    else s.endsAt += 15000;
    s.ver++;
    render();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }}>
      <View pointerEvents="none" style={{ position: 'absolute', inset: 0, backgroundColor: alpha(tint, 0.08) }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20 }}>
        <RoundBtn label="✕" onPress={exit} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.ink, fontFamily: fonts.title, fontSize: 20 }}>{title}</Text>
          <Small>
            Semana {String(week).padStart(2, '0')} · {doneSets}/{totalSets} series · {mmss(Math.round((now - startedAt.current) / 1000))}
          </Small>
        </View>
        <RoundBtn label={voice ? '🔊' : '🔇'} onPress={() => useApp.getState().setVoice(!voice)} />
      </View>

      <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 20, marginTop: 14 }}>
        {exercises.map((e, i) => {
          const done = timeline.slice(0, s.i).filter((x) => x.kind === 'work' && x.ex === i).length;
          return (
            <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: alpha(c.ink, 0.12), overflow: 'hidden' }}>
              <View style={{ width: `${(done / e.sets) * 100}%`, height: '100%', backgroundColor: i === step.ex ? tint : c.acc }} />
            </View>
          );
        })}
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 20, paddingTop: 14 }}>
        {/* Demostración a ancho completo: protagonista de la pantalla, como en las apps de referencia. */}
        <Animated.View
          key={`n-${step.ex}`}
          entering={FadeInRight.duration(400)}
          exiting={FadeOutLeft.duration(200)}
          style={{ width: '100%', aspectRatio: 4 / 3, flexShrink: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: c.line }}
        >
          <ExerciseDemo name={ex.name} muscle={ex.muscle} animate={s.paused === null} />
          {step.kind === 'rest' && <View pointerEvents="none" style={{ position: 'absolute', inset: 0, backgroundColor: alpha('#000000', 0.25) }} />}
          <View style={{ position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Animated.View key={`l-${s.i}-${s.paused !== null}`} entering={FadeInDown.duration(300)} style={{ backgroundColor: tint, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ color: c.on, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.5 }}>{s.paused !== null ? 'EN PAUSA' : step.kind === 'rest' ? `DESCANSO · SIGUE SERIE ${step.set}` : label}</Text>
            </Animated.View>
            <View style={{ backgroundColor: alpha('#000000', 0.55), borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 12 }}>{ex.muscle[0].toUpperCase() + ex.muscle.slice(1)}</Text>
            </View>
          </View>
        </Animated.View>

        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 14 }}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={2} style={{ color: c.ink, fontFamily: fonts.titleX, fontSize: 29 }}>
              {ex.name}
            </Text>
            <Small style={{ marginTop: 4, fontSize: 13 }}>
              {ex.sets} series × {isTimed(ex.name) ? `${setSeconds(ex)} s` : `${ex.reps} reps`}
            </Small>
          </View>
          <Countdown key={`c-${s.i}`} total={step.secs * 1000} remaining={remaining} paused={s.paused !== null} ver={s.ver} color={tint}>
            <Animated.Text key={secsLeft} entering={secsLeft <= 3 ? ZoomIn.duration(250) : undefined} style={{ color: c.ink, fontFamily: fonts.titleX, fontSize: 41, lineHeight: 45 }}>
              {secsLeft >= 60 ? mmss(secsLeft) : secsLeft}
            </Animated.Text>
            <Small style={{ fontSize: 10 }}>{step.kind === 'work' ? 'serie' : step.kind === 'rest' ? 'descanso' : 'empieza en'}</Small>
          </Countdown>
        </View>

        {editing && (
          <SetPanel
            key={`${editing.ex}-${editing.set}`}
            ex={exercises[editing.ex]}
            setNo={editing.set}
            value={valueOf(editing.ex, editing.set)}
            note={notes.current[`${editing.ex}-${editing.set}`]}
            logged={step.kind === 'rest'}
            tint={tint}
          />
        )}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 20 }}>
        <CtrlBtn label="+15 s" onPress={add15} disabled={step.kind === 'work'} />
        <Tap
          onPress={togglePause}
          style={{ width: 76, height: 76, borderRadius: 14, backgroundColor: tint, alignItems: 'center', justifyContent: 'center', shadowColor: tint, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 }}
        >
          <Text style={{ color: c.on, fontSize: 28, fontFamily: fonts.bold }}>{s.paused !== null ? '▶' : '❚❚'}</Text>
        </Tap>
        <CtrlBtn label={step.kind === 'work' ? '✓ Hecho' : 'Saltar ⏭'} onPress={skip} />
      </View>
    </View>
  );
}

const fmtKg = (w: number) => (Number.isInteger(w) ? String(w) : w.toFixed(1).replace('.', ','));

/** Anillo de cuenta atrás lineal. `ver` cambia al pausar, reanudar o sumar tiempo para reprogramar la animación. */
function Countdown({ total, remaining, paused, ver, color, children }: { total: number; remaining: number; paused: boolean; ver: number; color: string; children: React.ReactNode }) {
  const { c } = useTheme();
  const full = useRef(total);
  const p = useSharedValue(1);
  useEffect(() => {
    full.current = Math.max(full.current, remaining);
    cancelAnimation(p);
    p.value = remaining / full.current;
    if (!paused) p.value = withTiming(0, { duration: remaining, easing: Easing.linear });
  }, [ver]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: CIRC * (1 - p.value) }));
  return (
    <View style={{ width: 118, height: 118, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={118} height={118} viewBox="0 0 100 100" style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={50} cy={50} r={R} stroke={alpha(c.ink, 0.1)} strokeWidth={6} fill="none" />
        <AnimatedCircle cx={50} cy={50} r={R} stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray={`${CIRC} ${CIRC}`} animatedProps={props} />
      </Svg>
      {children}
    </View>
  );
}

/** Peso y repeticiones de la serie, con botones grandes para ajustar sin teclado. */
function SetPanel({ ex, setNo, value, note, logged, tint }: { ex: PlannedExercise; setNo: number; value: Values; note?: string; logged: boolean; tint: string }) {
  const { c } = useTheme();
  const [v, setV] = useState(value);
  const timed = isTimed(ex.name);
  const update = (patch: Partial<Values>) => {
    const next = { w: Math.max(0, Math.min(500, patch.w ?? v.w)), r: Math.max(1, Math.min(300, patch.r ?? v.r)) };
    Object.assign(value, next); // el motor lee este mismo objeto al registrar la serie
    setV(next);
    if (logged) useApp.getState().logSet({ exercise: ex.name, setNo, reps: next.r, weightKg: next.w });
  };
  return (
    <Animated.View entering={FadeIn.duration(300)} style={{ width: '100%', borderRadius: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, padding: 12 }}>
      <Small style={{ textAlign: 'center', marginBottom: note && !logged ? 2 : 8 }}>{logged ? `Serie ${setNo} registrada · ajústala si hiciste otra cosa` : `Objetivo de la serie ${setNo}`}</Small>
      {!logged && !!note && <Small style={{ textAlign: 'center', marginBottom: 8, fontSize: 11.5, color: c.ink }}>{note}</Small>}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Stepper label={v.w ? 'kg' : 'peso corporal'} value={v.w ? fmtKg(v.w) : '—'} onMinus={() => update({ w: v.w - 2.5 })} onPlus={() => update({ w: v.w + 2.5 })} tint={tint} />
        <Stepper label={timed ? 'segundos' : 'reps'} value={String(v.r)} onMinus={() => update({ r: v.r - (timed ? 5 : 1) })} onPlus={() => update({ r: v.r + (timed ? 5 : 1) })} tint={tint} />
      </View>
    </Animated.View>
  );
}

function Stepper({ label, value, onMinus, onPlus, tint }: { label: string; value: string; onMinus: () => void; onPlus: () => void; tint: string }) {
  const { c } = useTheme();
  const btn = { width: 38, height: 38, borderRadius: 10, backgroundColor: alpha(tint, 0.18), alignItems: 'center', justifyContent: 'center' } as const;
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.bg, borderRadius: 10, padding: 6 }}>
      <Tap onPress={onMinus} style={btn}>
        <Text style={{ color: c.ink, fontFamily: fonts.bold, fontSize: 18 }}>−</Text>
      </Tap>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: c.ink, fontFamily: fonts.titleX, fontSize: 24 }}>{value}</Text>
        <Small style={{ fontSize: 10 }}>{label}</Small>
      </View>
      <Tap onPress={onPlus} style={btn}>
        <Text style={{ color: c.ink, fontFamily: fonts.bold, fontSize: 18 }}>＋</Text>
      </Tap>
    </View>
  );
}

function RoundBtn({ label, onPress }: { label: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Tap onPress={onPress} style={{ width: 42, height: 42, borderRadius: 11, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: c.ink, fontSize: 16 }}>{label}</Text>
    </Tap>
  );
}

function CtrlBtn({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const { c } = useTheme();
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      style={{ flex: 1, height: 54, borderRadius: 10, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.35 : 1 }}
    >
      <Text style={{ color: c.ink, fontFamily: fonts.bold, fontSize: 15 }}>{label}</Text>
    </Tap>
  );
}

/** Resumen al terminar: tiempo, series, volumen y racha. */
function Summary({ exercises, title, week, seconds }: { exercises: PlannedExercise[]; title: string; week: number; seconds: number }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const sets = useApp((s) => s.sets[todayKey()] ?? NO_SETS);
  const streak = useApp((s) => s.streak);
  const allSets = useApp((s) => s.sets);
  const names = new Set(exercises.map((e) => e.name));
  const records = newRecords(allSets, todayKey()).filter((r) => names.has(r.exercise));
  const mine = sets.filter((x) => names.has(x.exercise));
  const volume = mine.reduce((v, x) => v + x.weightKg * x.reps, 0);
  const stats: [string, string][] = [
    ['Duración', mmss(seconds)],
    ['Series', String(mine.length)],
    volume > 0 ? ['Volumen', `${fmt(volume)} kg`] : ['Repeticiones', String(mine.reduce((n, x) => n + x.reps, 0))],
    ['Racha', `${streak} ${streak === 1 ? 'día' : 'días'}`],
  ];
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20, paddingHorizontal: 24 }}>
      <Animated.View entering={ZoomIn.duration(300)} style={{ alignSelf: 'center', width: 72, height: 72, borderRadius: 16, backgroundColor: c.acc, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="check" size={38} stroke={2.5} color={c.on} />
      </Animated.View>
      <Animated.Text entering={FadeInDown.delay(150)} style={{ color: c.ink, fontFamily: fonts.titleX, fontSize: 34, textAlign: 'center', marginTop: 10 }}>
        ¡Entreno completado!
      </Animated.Text>
      <Animated.View entering={FadeInDown.delay(250)}>
        <Small style={{ textAlign: 'center', marginTop: 4, fontSize: 14 }}>
          Semana {String(week).padStart(2, '0')} · {title}
        </Small>
      </Animated.View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 28 }}>
        {stats.map(([k, v], i) => (
          <Animated.View
            key={k}
            entering={FadeInDown.delay(350 + i * 90).duration(300)}
            style={{ width: '48%', flexGrow: 1, padding: 16, borderRadius: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.line }}
          >
            <Small>{k}</Small>
            <Text style={{ color: c.ink, fontFamily: fonts.titleX, fontSize: 29, marginTop: 4 }}>{v}</Text>
          </Animated.View>
        ))}
      </View>
      {records.length > 0 && (
        <Animated.View entering={FadeInDown.delay(700).duration(300)} style={{ marginTop: 12, padding: 14, borderRadius: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.acc }}>
          <Small style={{ color: c.acc, fontFamily: fonts.num, letterSpacing: 1.4, fontSize: 10.5 }}>{records.length === 1 ? 'NUEVO RÉCORD' : `${records.length} RÉCORDS NUEVOS`}</Small>
          {records.slice(0, 3).map((r) => (
            <Text key={r.exercise} style={{ color: c.ink, fontFamily: fonts.bold, fontSize: 14, marginTop: 4 }}>
              {r.exercise}: {r.best.weightKg ? `${fmtKg(r.best.weightKg)} kg × ${r.best.reps}` : `${r.best.reps} reps`}
              <Text style={{ color: c.mut, fontFamily: fonts.body }}> (antes {r.prev.weightKg ? `${fmtKg(r.prev.weightKg)} kg × ${r.prev.reps}` : `${r.prev.reps}`})</Text>
            </Text>
          ))}
        </Animated.View>
      )}
      <Animated.View entering={FadeIn.delay(800)} style={{ flex: 1, justifyContent: 'center' }}>
        <MuscleMap groups={exercises.map((e) => e.muscle)} height={records.length ? 150 : 200} />
      </Animated.View>
      <BigButton label="Listo" onPress={() => close(router)} />
    </View>
  );
}
