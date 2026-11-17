import { useCallback, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import { FOODS, shoppingList } from '@fitcoach/core';
import { FoodChip } from '@/components/Chip';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Card, Eyebrow, H, KV, Pill, Screen, Small, T, flipIn } from '@/components/ui';
import { fmt, grams } from '@/lib/format';
import { foodOf, sum, usePlan, useTodayLogs } from '@/lib/usePlan';
import { useApp } from '@/store/useApp';
import { useUi } from '@/store/useUi';
import { useTheme } from '@/theme';

const ROLE_ORDER: Record<string, number> = { P: 0, C: 1, V: 2, F: 3, M: 4 };

/**
 * Menú = qué comer hoy y registrarlo. Cada comida muestra la sugerencia del plan (receta y porciones)
 * mientras está pendiente, y lo que de verdad comiste cuando ya está registrada.
 */
export default function Menu() {
  const { c } = useTheme();
  const router = useRouter();
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
  const eaten = sum(logs);
  const exclusions = [...profile.allergies, ...profile.avoid];
  const list = Object.entries(shoppingList(plan)).sort(([a], [b]) => ROLE_ORDER[FOODS[a].role] - ROLE_ORDER[FOODS[b].role] || FOODS[a].name.localeCompare(FOODS[b].name));
  const next = plan.findIndex((_, i) => !logs.some((l) => l.slot === i));

  const register = (i: number) => {
    addLogs(plan[i].items.map((x) => ({ ...x, slot: i, via: 'plan' })));
    confetti();
    showToast(`${plan[i].label} registrado ✓`);
  };

  return (
    <Screen header={<Header subtitle="Tu menú" />} animKey={focus}>
      <Card hero>
        <H>Menú de hoy</H>
        <Small style={{ marginTop: 4 }}>
          Cubre {fmt(total.kcal)} de {fmt(t.kcal)} kcal · P {Math.round(total.p)} / {t.protein} g · C {Math.round(total.c)} / {t.carbs} g · G {Math.round(total.f)} / {t.fat} g
        </Small>
        <Small style={{ marginTop: 2 }}>
          Registrado hoy: {fmt(eaten.kcal)} kcal · {logs.length ? `${new Set(logs.map((l) => l.slot)).size} de ${plan.length} comidas` : 'ninguna comida aún'}
        </Small>
        {exclusions.length > 0 && <T style={{ marginTop: 8, fontSize: 13 }}>Sin: {exclusions.join(', ')}</T>}
        <Pill label={shop ? 'Ocultar lista de compras' : 'Lista de compras (7 días)'} ghost style={{ marginTop: 10, alignSelf: 'flex-start' }} onPress={() => setShop((v) => !v)} />
        {shop && (
          <Animated.View entering={flipIn} style={{ marginTop: 10 }}>
            {list.map(([id, g], i) => (
              <KV key={id} first={i === 0} k={`${FOODS[id].emoji} ${FOODS[id].name}`} v={grams(g)} />
            ))}
          </Animated.View>
        )}
      </Card>

      {plan.map((m, i) => {
        const L = logs.filter((l) => l.slot === i);
        const done = L.length > 0;
        const s = done ? sum(L) : sum(m.items);
        const target = Math.round(t.kcal * m.share);
        return (
          <Card key={i} style={{ borderWidth: i === next ? 2 : 1, borderColor: i === next ? c.acc : c.line }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Eyebrow color={done ? c.acc : i === next ? c.acc : undefined}>
                    {m.label} · {done ? 'Registrado' : i === next ? 'Siguiente' : 'Pendiente'}
                  </Eyebrow>
                  {done && <Icon name="check" size={13} stroke={2.25} color={c.acc} />}
                </View>
                <H style={{ marginTop: 2 }}>{done ? `${Math.round(s.kcal)} de ${target} kcal` : m.recipeName}</H>
                <Small>
                  {done ? `P ${Math.round(s.p)} · C ${Math.round(s.c)} · G ${Math.round(s.f)} g` : `${Math.round(s.kcal)} kcal · P ${Math.round(s.p)} · C ${Math.round(s.c)} · G ${Math.round(s.f)}`}
                </Small>
              </View>
              {!done && <Pill label="↻" ghost onPress={() => swapRecipe(i)} style={{ paddingHorizontal: 12 }} />}
            </View>
            <Animated.View key={done ? `d-${L.length}` : `${m.recipeId}-${m.items.map((x) => x.grams).join()}`} entering={flipIn} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {(done ? L : m.items).map((x, j) => {
                const f = foodOf(x.foodId);
                return <FoodChip key={`${x.foodId}-${j}`} emoji={f.emoji} name={f.name} grams={x.grams} />;
              })}
            </Animated.View>
            {!done && (
              <T kind="mut" style={{ fontSize: 13, marginBottom: 12 }}>
                {m.how}
              </T>
            )}
            {done ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pill label="Añadir algo más" ghost onPress={() => router.push({ pathname: '/scan', params: { slot: String(i) } })} style={{ flex: 1, paddingVertical: 12 }} />
                <Pill label="Quitar" ghost onPress={() => clearSlot(i)} style={{ paddingVertical: 12 }} />
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pill label="Comí esto" onPress={() => register(i)} style={{ flex: 1, paddingVertical: 13 }} textStyle={{ fontSize: 14 }} />
                <Pill label="Comí otra cosa" ghost onPress={() => router.push({ pathname: '/scan', params: { slot: String(i) } })} style={{ flex: 1, paddingVertical: 13 }} />
              </View>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}
