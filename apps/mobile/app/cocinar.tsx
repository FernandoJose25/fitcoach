import { useEffect, useState } from 'react';
import { ScrollView, Text, Vibration, View } from 'react-native';
import Animated, { Easing, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { householdMeasure, portionAmount, recipeGuide, type RecipeStep } from '@fitcoach/core';
import { Icon } from '@/components/Icon';
import { StepArt } from '@/components/StepArt';
import { Tap } from '@/components/Tap';
import { BigButton, Eyebrow, H, Pill, Small } from '@/components/ui';
import { prepareVoice, speak, stopVoice } from '@/lib/coachVoice';
import { fmt } from '@/lib/format';
import { foodOf, registerPlanned, sum, useDayPlan, useTodayLogs } from '@/lib/usePlan';
import { useApp } from '@/store/useApp';
import { alpha, fonts, useTheme } from '@/theme';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Entrada del paso: se desliza desde el lado hacia el que avanzas. */
const slideIn = (dir: number) => () => {
  'worklet';
  const cfg = { duration: 320, easing: Easing.out(Easing.cubic) };
  return {
    initialValues: { opacity: 0, transform: [{ translateX: 48 * dir }] },
    animations: { opacity: withTiming(1, cfg), transform: [{ translateX: withTiming(0, cfg) }] },
  };
};

/**
 * Modo cocinar: alistar ingredientes → un paso por pantalla (dibujo animado, letra grande, temporizador y
 * voz opcional) → listo, con opción de registrar la comida. La pantalla no se apaga mientras cocinas.
 */
export default function Cocinar() {
  useKeepAwake();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const slot = Number(useLocalSearchParams<{ slot: string }>().slot ?? 0);
  const { plan } = useDayPlan();
  // Se congela al abrir: si el plan cambia mientras cocinas, los pasos no se mueven.
  const [meal] = useState(() => plan[slot]);
  const [guide] = useState(() => (meal ? recipeGuide(meal.recipeId, meal.how) : null));
  const logs = useTodayLogs();
  const voice = useApp((s) => s.voice);
  // 0 = alistar ingredientes · 1…n = pasos · n + 1 = listo.
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [have, setHave] = useState<number[]>([]);
  // Temporizador del paso: hora de fin mientras corre; si no, segundos que quedan.
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [left, setLeft] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [rang, setRang] = useState(false);

  const steps = guide?.steps ?? [];
  const n = steps.length;
  const step: RecipeStep | null = i >= 1 && i <= n ? steps[i - 1] : null;

  useEffect(() => {
    prepareVoice();
    if (useApp.getState().voice) speak('Primero, alista los ingredientes.');
    return () => {
      stopVoice();
    };
  }, []);

  useEffect(() => {
    if (endsAt === null) return;
    const id = setInterval(() => {
      const t = Date.now();
      if (t < endsAt) return setNow(t);
      setEndsAt(null);
      setLeft(0);
      setRang(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Vibration.vibrate([0, 500, 250, 500]);
      if (useApp.getState().voice) speak('¡Tiempo! Sigue con el siguiente paso.');
    }, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!meal || !guide) return null;
  const done = logs.some((l) => l.slot === slot);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/plan'));

  const go = (to: number) => {
    setDir(to > i ? 1 : -1);
    setI(to);
    const next = to >= 1 && to <= n ? steps[to - 1] : null;
    setEndsAt(null);
    setLeft(next?.sec ?? 0);
    setRang(false);
    if (useApp.getState().voice) {
      if (next) speak(`Paso ${to}. ${next.text}`);
      else if (to > n) speak('¡Listo! Buen provecho.');
      else stopVoice();
    }
  };
  const remaining = endsAt !== null ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : left;
  const startTimer = () => {
    const secs = left > 0 ? left : (step?.sec ?? 0);
    setLeft(secs);
    setRang(false);
    setNow(Date.now());
    setEndsAt(Date.now() + secs * 1000);
  };
  const toggleVoice = () => {
    useApp.getState().setVoice(!voice);
    if (voice) stopVoice();
    else if (step) speak(step.text);
  };

  const s = sum(meal.items);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }}>
      {/* Barra superior: cerrar, progreso por pasos y voz. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20 }}>
        <Tap
          onPress={close}
          accessibilityLabel="Salir del modo cocinar"
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: c.line,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="close" size={18} color={c.ink} />
        </Tap>
        <View style={{ flex: 1, flexDirection: 'row', gap: 4 }} accessibilityLabel={`Paso ${Math.min(i, n)} de ${n}`}>
          {Array.from({ length: n + 1 }, (_, k) => (
            <View
              key={k}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: k < i ? c.acc : k === i ? alpha(c.acc, 0.45) : c.line,
              }}
            />
          ))}
        </View>
        <Tap
          onPress={toggleVoice}
          accessibilityLabel={voice ? 'Silenciar la voz' : 'Leer los pasos en voz alta'}
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: c.line,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={voice ? 'sound' : 'mute'} size={20} color={voice ? c.acc : c.mut} />
        </Tap>
      </View>

      <Animated.View key={i} entering={slideIn(dir)} style={{ flex: 1 }}>
        {i === 0 ? (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 }}>
            <Eyebrow>{meal.recipeName}</Eyebrow>
            <H size={28} style={{ marginTop: 6 }}>
              Alista los ingredientes
            </H>
            <Small style={{ marginTop: 6 }}>
              Toca cada uno cuando lo tengas a mano.
              {guide.tools.length ? ` Necesitas: ${guide.tools.join(', ').toLowerCase()}.` : ''}
            </Small>
            {meal.items.map((x, k) => {
              const f = foodOf(x.foodId);
              const on = have.includes(k);
              const m = householdMeasure(x.foodId, x.grams);
              return (
                <Tap
                  key={`${x.foodId}-${k}`}
                  onPress={() => setHave(on ? have.filter((h) => h !== k) : [...have, k])}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: c.line,
                  }}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      borderWidth: on ? 0 : 1.5,
                      borderColor: c.mut,
                      backgroundColor: on ? c.acc : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {on && <Icon name="check" size={16} stroke={2.5} color={c.on} />}
                  </View>
                  <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
                  <View style={{ flex: 1, opacity: on ? 0.5 : 1 }}>
                    <Text style={{ color: c.ink, fontFamily: fonts.med, fontSize: 16 }}>{f.name}</Text>
                    <Small style={{ fontSize: 13 }}>
                      {portionAmount(x.foodId, x.grams)}
                      {m ? ` · ${m}` : ''}
                    </Small>
                  </View>
                </Tap>
              );
            })}
          </ScrollView>
        ) : step ? (
          <View style={{ flex: 1, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' }}>
            <StepArt action={step.action} size={150} />
            <Text style={{ color: c.acc, fontFamily: fonts.numB, fontSize: 13, letterSpacing: 1, marginTop: 18 }}>
              PASO {i} DE {n}
            </Text>
            <Text
              style={{
                color: c.ink,
                fontFamily: fonts.med,
                fontSize: 24,
                lineHeight: 32,
                textAlign: 'center',
                marginTop: 10,
              }}
            >
              {step.text}
            </Text>
            {step.sec ? (
              <View style={{ alignItems: 'center', marginTop: 22 }}>
                <Text
                  accessibilityLiveRegion="polite"
                  style={{ color: rang ? c.acc : c.ink, fontFamily: fonts.numB, fontSize: 52 }}
                >
                  {rang ? '¡Tiempo!' : mmss(remaining)}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  {endsAt !== null ? (
                    <Pill
                      label="Pausar"
                      ghost
                      style={{ paddingHorizontal: 22, paddingVertical: 12 }}
                      onPress={() => {
                        setLeft(remaining);
                        setEndsAt(null);
                      }}
                    />
                  ) : (
                    <Pill
                      label={left > 0 && left < step.sec ? 'Seguir' : rang ? 'Otra vez' : 'Iniciar temporizador'}
                      style={{ paddingHorizontal: 22, paddingVertical: 12 }}
                      onPress={startTimer}
                    />
                  )}
                  {(endsAt !== null || (left > 0 && left < step.sec)) && (
                    <Pill
                      label="Reiniciar"
                      ghost
                      style={{ paddingHorizontal: 18, paddingVertical: 12 }}
                      onPress={() => {
                        setEndsAt(null);
                        setLeft(step.sec ?? 0);
                        setRang(false);
                      }}
                    />
                  )}
                </View>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={{ flex: 1, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' }}>
            <StepArt action="servir" size={150} />
            <H size={30} style={{ marginTop: 18, textAlign: 'center' }}>
              ¡Listo! Buen provecho
            </H>
            <Small style={{ marginTop: 8, fontSize: 13, textAlign: 'center' }}>
              {meal.recipeName} · {fmt(s.kcal)} kcal · P {Math.round(s.p)} g
            </Small>
          </View>
        )}
      </Animated.View>

      <View style={{ paddingHorizontal: 20, gap: 10 }}>
        {i <= n ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {i > 0 && (
              <Pill
                label="Atrás"
                ghost
                style={{ paddingHorizontal: 20, justifyContent: 'center' }}
                onPress={() => go(i - 1)}
              />
            )}
            <BigButton
              label={i === 0 ? 'Empezar' : i === n ? 'Terminar' : 'Siguiente'}
              style={{ flex: 1 }}
              onPress={() => go(i + 1)}
            />
          </View>
        ) : done ? (
          <BigButton label="Volver al menú" onPress={() => router.dismissTo('/plan')} />
        ) : (
          <>
            <BigButton
              label={`Registrar ${meal.label.toLowerCase()}`}
              onPress={() => {
                registerPlanned(meal, slot);
                router.dismissTo('/plan');
              }}
            />
            <Pill label="Salir sin registrar" ghost style={{ paddingVertical: 12 }} onPress={close} />
          </>
        )}
      </View>
    </View>
  );
}
