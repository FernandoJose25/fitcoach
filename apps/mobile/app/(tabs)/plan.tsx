import { useCallback, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import { recipeGuide } from '@fitcoach/core';
import { FoodChip } from '@/components/Chip';
import { ConsequenceCard } from '@/components/Consequence';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { StepArt } from '@/components/StepArt';
import { Tap } from '@/components/Tap';
import { Card, Eyebrow, H, Pill, Screen, Small, T, flipIn } from '@/components/ui';
import { fmt } from '@/lib/format';
import { foodOf, registerPlanned, sum, useConsequence, useDayPlan, useTodayLogs } from '@/lib/usePlan';
import { useApp } from '@/store/useApp';
import { useTheme } from '@/theme';

const NO_ITEMS: { foodId: string; grams: number }[] = [];

/**
 * Menú = qué comer hoy y registrarlo. El menú cambia cada día (rota las recetas de la semana). Cada comida
 * muestra la sugerencia del plan (receta y porciones, con acceso a la receta paso a paso) mientras está
 * pendiente, y lo que de verdad comiste cuando ya está registrada.
 * Si te pasas, se muestra la consecuencia y las comidas pendientes se recortan para compensar.
 */
export default function Menu() {
  const { c } = useTheme();
  const router = useRouter();
  const profile = useApp((s) => s.profile)!;
  const t = useApp((s) => s.targets)!;
  const { clearSlot, swapRecipe } = useApp.getState();
  const { plan } = useDayPlan();
  const logs = useTodayLogs();
  const consequence = useConsequence(NO_ITEMS);
  const [focus, setFocus] = useState(0);
  useFocusEffect(useCallback(() => setFocus((n) => n + 1), []));

  const total = sum(plan.flatMap((m) => m.items));
  const eaten = sum(logs);
  const exclusions = [...profile.allergies, ...profile.avoid];
  const next = plan.findIndex((_, i) => !logs.some((l) => l.slot === i));

  const register = (i: number) => registerPlanned(plan[i], i);

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
        <Pill label="Lista de compras · 7 días" ghost style={{ marginTop: 10, alignSelf: 'flex-start' }} onPress={() => router.push('/compras')} />
      </Card>

      {consequence && <ConsequenceCard x={consequence} goal={profile.goal} title="Consecuencia de hoy" done />}

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
                {!done && m.cut ? <Eyebrow style={{ marginTop: 2, fontSize: 9.5 }}>Ajustada −{m.cut} kcal para compensar</Eyebrow> : null}
                <H style={{ marginTop: 2 }}>{done ? `${Math.round(s.kcal)} de ${target} kcal` : m.recipeName}</H>
                <Small>
                  {done ? `P ${Math.round(s.p)} · C ${Math.round(s.c)} · G ${Math.round(s.f)} g` : `${Math.round(s.kcal)} kcal · P ${Math.round(s.p)} · C ${Math.round(s.c)} · G ${Math.round(s.f)}`}
                </Small>
              </View>
              {!done && <Pill label="↻" a11y={`Cambiar receta de ${m.label.toLowerCase()}`} ghost onPress={() => swapRecipe(i)} style={{ paddingHorizontal: 12, minWidth: 44 }} />}
            </View>
            <Animated.View key={done ? `d-${L.length}` : `${m.recipeId}-${m.items.map((x) => x.grams).join()}`} entering={flipIn} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {(done ? L : m.items).map((x, j) => {
                const f = foodOf(x.foodId);
                return <FoodChip key={`${x.foodId}-${j}`} emoji={f.emoji} name={f.name} grams={x.grams} />;
              })}
            </Animated.View>
            {!done && <RecipeLink how={m.how} recipeId={m.recipeId} onPress={() => router.push({ pathname: '/receta', params: { slot: String(i) } })} />}
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

/** Acceso a la receta paso a paso de una comida pendiente: dibujo del primer paso, tiempo y número de pasos. */
function RecipeLink({ recipeId, how, onPress }: { recipeId: string | null; how: string; onPress: () => void }) {
  const { c } = useTheme();
  const g = recipeGuide(recipeId, how);
  return (
    <Tap
      onPress={onPress}
      accessibilityLabel="Ver receta paso a paso"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: c.line, marginBottom: 12 }}
    >
      <StepArt action={g.steps[0]?.action ?? 'servir'} size={36} still />
      <View style={{ flex: 1 }}>
        <T style={{ fontSize: 14 }}>Ver receta paso a paso</T>
        <Small>
          {g.min ? `${g.min} min · ` : ''}
          {g.steps.length} {g.steps.length === 1 ? 'paso' : 'pasos'} · medidas en tazas y cucharadas
        </Small>
      </View>
      <T style={{ color: c.acc, fontSize: 20 }}>›</T>
    </Tap>
  );
}
