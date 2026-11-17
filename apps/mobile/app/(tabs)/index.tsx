import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import { FOODS, TRAIN_DAYS, coachMessage } from '@fitcoach/core';
import { FoodChip } from '@/components/Chip';
import { Header } from '@/components/Header';
import { MacroBar } from '@/components/MacroBar';
import { Ring } from '@/components/Ring';
import { Tap } from '@/components/Tap';
import { BigButton, Card, Em, H, Pill, Screen, Small, T, flipIn } from '@/components/ui';
import { SLOT_ICON, WEEKDAYS, currentWeek, fmt, weekdayIndex } from '@/lib/format';
import { bestProtein, sum, usePlan, useTodayLogs } from '@/lib/usePlan';
import { todayKey, useApp } from '@/store/useApp';
import { useUi } from '@/store/useUi';
import { alpha, fonts, useTheme } from '@/theme';

export default function Hoy() {
  const { c } = useTheme();
  const router = useRouter();
  const profile = useApp((s) => s.profile)!;
  const t = useApp((s) => s.targets)!;
  const water = useApp((s) => s.water[todayKey()] ?? 0);
  const { setWater, addLogs, clearSlot, swapRecipe } = useApp.getState();
  const plan = usePlan();
  const logs = useTodayLogs();
  const { showToast, confetti } = useUi.getState();
  const [focus, setFocus] = useState(0);
  useFocusEffect(useCallback(() => setFocus((n) => n + 1), []));

  const eaten = sum(logs);
  const left = Math.round(t.kcal - eaten.kcal);
  const tip = coachMessage({ ...eaten, logs: logs.length }, t, bestProtein(profile));
  const today = weekdayIndex();
  const trainDays = TRAIN_DAYS[profile.daysPerWeek] as readonly number[];
  const next = plan.findIndex((_, i) => !logs.some((l) => l.slot === i));

  const register = (i: number) => {
    addLogs(plan[i].items.map((x) => ({ ...x, slot: i, via: 'plan' })));
    confetti();
    showToast(`${plan[i].label} registrado ✓`);
  };

  return (
    <Screen header={<Header subtitle="Tu día de hoy" />} animKey={focus}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
        {currentWeek().map((d, i) => {
          const on = i === today;
          return (
            <View key={i} style={{ width: 42, paddingVertical: 8, borderRadius: 16, alignItems: 'center', gap: 2, backgroundColor: on ? c.acc : 'transparent' }}>
              <Small style={{ fontSize: 11, color: on ? c.on : c.mut }}>{WEEKDAYS[i]}</Small>
              <Text style={{ fontFamily: fonts.title, fontSize: 15, color: on ? c.on : c.ink }}>{d.getDate()}</Text>
              {trainDays.includes(i) && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: on ? c.on : c.acc }} />}
            </View>
          );
        })}
      </View>

      <Card hero>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Ring pct={eaten.kcal / t.kcal}>
            <Text style={{ fontFamily: fonts.titleX, fontSize: 28, color: c.ink }}>{fmt(Math.abs(left))}</Text>
            <Small style={{ fontSize: 11 }}>{left < 0 ? 'kcal de más' : 'kcal restantes'}</Small>
          </Ring>
          <View style={{ flex: 1, gap: 10 }}>
            {[
              ['Meta', t.kcal],
              ['Consumidas', eaten.kcal],
              ['Mantenimiento', t.tdee],
            ].map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Small style={{ fontSize: 12 }}>{k}</Small>
                <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: c.mut }}>{fmt(v as number)}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
          <MacroBar label="Proteína" value={eaten.p} target={t.protein} color={c.p} />
          <MacroBar label="Carbos" value={eaten.c} target={t.carbs} color={c.c} />
          <MacroBar label="Grasas" value={eaten.f} target={t.fat} color={c.f} />
        </View>
      </Card>

      <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: alpha(c.acc, 0.12) }}>
        <Text style={{ fontSize: 24 }}>{tip.emoji}</Text>
        <T style={{ flex: 1 }}>{tip.text}</T>
        {tip.action && (
          <Pill
            label="Añadir"
            onPress={() => {
              const slot = next >= 0 ? next : plan.length - 1;
              addLogs([{ ...tip.action!, slot, via: 'manual' }]);
              confetti();
              showToast(`${tip.action!.grams} g de ${FOODS[tip.action!.foodId].name.toLowerCase()} ✓`);
            }}
          />
        )}
      </Card>

      {next >= 0 && (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flex: 1 }}>
              <Small>Siguiente · {plan[next].label}</Small>
              <H size={15}>{plan[next].recipeName}</H>
            </View>
            <Pill label="↻" ghost onPress={() => swapRecipe(next)} />
          </View>
          <Animated.View key={plan[next].recipeId ?? 'x'} entering={flipIn} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {plan[next].items.map((x) => (
              <FoodChip key={x.foodId} emoji={FOODS[x.foodId].emoji} name={FOODS[x.foodId].name} grams={x.grams} />
            ))}
          </Animated.View>
          <BigButton label="Registrar esta comida" onPress={() => register(next)} />
        </Card>
      )}

      <Card>
        <H style={{ marginBottom: 6 }}>Comidas de hoy</H>
        {plan.map((m, i) => {
          const L = logs.filter((l) => l.slot === i);
          const k = sum(L).kcal;
          // Pendientes atenuadas; la siguiente y las completadas a plena opacidad para guiar el ojo.
          const dim = !L.length && i !== next;
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: c.line, opacity: dim ? 0.6 : 1 }}>
              <View style={{ flexDirection: 'row' }}>
                {L.length ? (
                  L.slice(0, 3).map((l, j) => (
                    <View key={j} style={{ marginRight: -14, borderRadius: 15, borderWidth: 3, borderColor: c.card }}>
                      <Em>{FOODS[l.foodId].emoji}</Em>
                    </View>
                  ))
                ) : (
                  <Em>{SLOT_ICON[m.slot]}</Em>
                )}
              </View>
              <View style={{ flex: 1, marginLeft: L.length ? 14 : 0 }}>
                <T kind="bold">
                  {m.label}
                  {L.length ? ' ✓' : ''}
                </T>
                <Small>
                  {Math.round(k)} / {Math.round(t.kcal * m.share)} kcal
                </Small>
              </View>
              {L.length ? (
                <Pill label="Quitar" ghost onPress={() => clearSlot(i)} />
              ) : (
                <Pill label="＋" onPress={() => router.push({ pathname: '/scan', params: { slot: String(i) } })} />
              )}
            </View>
          );
        })}
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <H>Agua</H>
          <Small>{water * 250} / 2000 ml</Small>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <Tap
              key={i}
              onPress={() => setWater(water === i + 1 ? i : i + 1)}
              style={{ flex: 1, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: i < water ? c.water : c.bg, borderWidth: 1, borderColor: c.line }}
            >
              <Text style={{ fontSize: 17 }}>💧</Text>
            </Tap>
          ))}
        </View>
      </Card>
    </Screen>
  );
}
