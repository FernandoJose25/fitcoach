import { useCallback, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { FOODS, shoppingList } from '@fitcoach/core';
import { FoodChip } from '@/components/Chip';
import { Header } from '@/components/Header';
import { Card, H, KV, Pill, Screen, Small, T, flipIn } from '@/components/ui';
import { SLOT_ICON, fmt, grams } from '@/lib/format';
import { sum, usePlan, useTodayLogs } from '@/lib/usePlan';
import { useApp } from '@/store/useApp';
import { useUi } from '@/store/useUi';
import { useTheme } from '@/theme';

const ROLE_ORDER: Record<string, number> = { P: 0, C: 1, V: 2, F: 3 };

export default function Plan() {
  const { c } = useTheme();
  const profile = useApp((s) => s.profile)!;
  const t = useApp((s) => s.targets)!;
  const { addLogs, clearSlot, swapRecipe } = useApp.getState();
  const { showToast, confetti } = useUi.getState();
  const plan = usePlan();
  const logs = useTodayLogs();
  const [shop, setShop] = useState(false);
  const [focus, setFocus] = useState(0);
  useFocusEffect(useCallback(() => setFocus((n) => n + 1), []));

  const total = sum(plan.flatMap((m) => m.items));
  const exclusions = [...profile.allergies, ...profile.avoid];
  const list = Object.entries(shoppingList(plan)).sort(([a], [b]) => ROLE_ORDER[FOODS[a].role] - ROLE_ORDER[FOODS[b].role] || FOODS[a].name.localeCompare(FOODS[b].name));

  const toggle = (i: number) => {
    if (logs.some((l) => l.slot === i)) {
      clearSlot(i);
      return;
    }
    addLogs(plan[i].items.map((x) => ({ ...x, slot: i, via: 'plan' })));
    confetti();
    showToast(`${plan[i].label} registrado ✓`);
  };

  return (
    <Screen header={<Header subtitle="Tu plan de comidas" />} animKey={focus}>
      <Card hero>
        <H>Plan de hoy</H>
        <Small style={{ marginTop: 4 }}>
          Cubre {fmt(total.kcal)} de {fmt(t.kcal)} kcal · P {Math.round(total.p)} / {t.protein} g · C {Math.round(total.c)} / {t.carbs} g · G {Math.round(total.f)} / {t.fat} g
        </Small>
        {exclusions.length > 0 && <T style={{ marginTop: 8, fontSize: 13 }}>🚫 Excluido: {exclusions.join(', ')}</T>}
        <Pill label="🛒 Lista de compras (7 días)" ghost style={{ marginTop: 10, alignSelf: 'flex-start' }} onPress={() => setShop((v) => !v)} />
        {shop && (
          <Animated.View entering={flipIn} style={{ marginTop: 10 }}>
            {list.map(([id, g], i) => (
              <KV key={id} first={i === 0} k={`${FOODS[id].emoji} ${FOODS[id].name}`} v={grams(g)} />
            ))}
          </Animated.View>
        )}
      </Card>

      {plan.map((m, i) => {
        const s = sum(m.items);
        const done = logs.some((l) => l.slot === i);
        return (
          <Card key={i}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Small>
                {SLOT_ICON[m.slot]} {m.label} · {Math.round(s.kcal)} kcal
              </Small>
              <Small>
                P {Math.round(s.p)} · C {Math.round(s.c)} · G {Math.round(s.f)}
              </Small>
            </View>
            <H style={{ marginBottom: 10 }}>{m.recipeName}</H>
            <Animated.View key={`${m.recipeId}-${m.items.map((x) => x.grams).join()}`} entering={flipIn} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {m.items.map((x) => (
                <FoodChip key={x.foodId} emoji={FOODS[x.foodId].emoji} name={FOODS[x.foodId].name} grams={x.grams} />
              ))}
            </Animated.View>
            <T kind="mut" style={{ fontSize: 13, marginBottom: 12 }}>
              👩‍🍳 {m.how}
            </T>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pill label="↻ Cambiar" ghost style={{ flex: 1 }} onPress={() => swapRecipe(i)} />
              <Pill label={done ? '✓ Registrado' : 'Registrar'} style={{ flex: 2, backgroundColor: done ? c.hero : c.acc }} textStyle={done ? { color: c.ink } : undefined} onPress={() => toggle(i)} />
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
