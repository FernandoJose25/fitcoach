import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { householdMeasure, portionAmount, recipeGuide } from '@fitcoach/core';
import { StepArt } from '@/components/StepArt';
import { Tap } from '@/components/Tap';
import { BigButton, Card, Em, Eyebrow, H, Num, Pill, Screen, Small, T } from '@/components/ui';
import { duration, fmt } from '@/lib/format';
import { foodOf, registerPlanned, sum, useDayPlan, useTodayLogs } from '@/lib/usePlan';
import { fonts, useTheme } from '@/theme';

/**
 * Receta de una comida del menú de hoy: tu porción en gramos y en medidas caseras, utensilios, pasos con
 * su dibujo y temporizador, y consejos. Desde aquí se entra al modo cocinar.
 */
export default function Receta() {
  const { c } = useTheme();
  const router = useRouter();
  const slot = Number(useLocalSearchParams<{ slot: string }>().slot ?? 0);
  const { plan } = useDayPlan();
  const logs = useTodayLogs();
  const meal = plan[slot];
  if (!meal) return null;
  const g = recipeGuide(meal.recipeId, meal.how);
  const s = sum(meal.items);
  const done = logs.some((l) => l.slot === slot);

  const header = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 6,
      }}
    >
      <Tap
        onPress={() => router.back()}
        accessibilityLabel="Volver"
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          backgroundColor: c.card,
          borderWidth: 1,
          borderColor: c.line,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: c.ink, fontSize: 18 }}>‹</Text>
      </Tap>
      <View style={{ flex: 1 }}>
        <Eyebrow>{meal.label} · Receta</Eyebrow>
        <H size={20} numberOfLines={2}>
          {meal.recipeName}
        </H>
      </View>
    </View>
  );

  return (
    <Screen header={header}>
      <Card hero>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            [g.min ? `${g.min}` : '—', 'minutos'],
            [g.level, 'nivel'],
            [`${g.steps.length}`, g.steps.length === 1 ? 'paso' : 'pasos'],
          ].map(([v, k]) => (
            <View
              key={k}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: c.line,
                alignItems: 'center',
              }}
            >
              <Num style={{ fontSize: 18 }}>{v}</Num>
              <Small>{k}</Small>
            </View>
          ))}
        </View>
        <Small style={{ marginTop: 10 }}>
          Tu porción: {fmt(s.kcal)} kcal · P {Math.round(s.p)} · C {Math.round(s.c)} · G {Math.round(s.f)} g
        </Small>
        {meal.cut && !done ? (
          <Eyebrow style={{ marginTop: 4, fontSize: 9.5 }}>Ajustada −{meal.cut} kcal para compensar</Eyebrow>
        ) : null}
        <BigButton
          label="Empezar a cocinar"
          style={{ marginTop: 14 }}
          onPress={() => router.push({ pathname: '/cocinar', params: { slot: String(slot) } })}
        />
        {done ? (
          <Small style={{ marginTop: 10, textAlign: 'center' }}>Ya registraste esta comida hoy.</Small>
        ) : (
          <Pill
            label="Ya lo comí"
            ghost
            style={{ marginTop: 10, paddingVertical: 12 }}
            onPress={() => {
              registerPlanned(meal, slot);
              router.back();
            }}
          />
        )}
      </Card>

      {g.tools.length > 0 && (
        <Card>
          <Eyebrow>Necesitas</Eyebrow>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {g.tools.map((t) => (
              <View
                key={t}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: c.line,
                }}
              >
                <T style={{ fontSize: 13 }}>{t}</T>
              </View>
            ))}
          </View>
        </Card>
      )}

      <Card>
        <Eyebrow>Ingredientes · tu porción</Eyebrow>
        {meal.items.map((x, i) => {
          const f = foodOf(x.foodId);
          const m = householdMeasure(x.foodId, x.grams);
          return (
            <View
              key={`${x.foodId}-${i}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 9,
                marginTop: i === 0 ? 6 : 0,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: c.line,
              }}
            >
              <Em size={36}>{f.emoji}</Em>
              <View style={{ flex: 1 }}>
                <T style={{ fontSize: 14 }}>{f.name}</T>
                {m && <Small>≈ {m}</Small>}
              </View>
              <Num style={{ fontSize: 14 }}>{portionAmount(x.foodId, x.grams)}</Num>
            </View>
          );
        })}
      </Card>

      <Card>
        <Eyebrow>Preparación</Eyebrow>
        {g.steps.map((st, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              gap: 12,
              paddingVertical: 10,
              marginTop: i === 0 ? 4 : 0,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: c.line,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: c.line,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <StepArt action={st.action} size={40} still />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.acc, fontFamily: fonts.numB, fontSize: 12 }}>PASO {i + 1}</Text>
              <T style={{ fontSize: 14, lineHeight: 20, marginTop: 2 }}>{st.text}</T>
              {st.sec ? <Small style={{ marginTop: 4 }}>Temporizador · {duration(st.sec)}</Small> : null}
            </View>
          </View>
        ))}
      </Card>

      {g.tips.length > 0 && (
        <Card>
          <Eyebrow>Consejos y cambios</Eyebrow>
          {g.tips.map((t) => (
            <View key={t} style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <T style={{ color: c.acc }}>•</T>
              <T style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>{t}</T>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}
