import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { householdMeasure, stepGrams, verdict, type Food, type Item } from '@fitcoach/core';
import { Chip } from '@/components/Chip';
import { ConsequenceCard } from '@/components/Consequence';
import { Icon } from '@/components/Icon';
import { Tap } from '@/components/Tap';
import { BigButton, Card, Em, Eyebrow, H, Pill, Small, T } from '@/components/ui';
import { sum, useConsequence, useTodayLogs } from '@/lib/usePlan';
import { useApp } from '@/store/useApp';
import { fonts, radius, useTheme } from '@/theme';

const PRESETS = [50, 100, 150, 200, 300];

/** Origen de los valores, para que el usuario sepa cuánto fiarse. */
export const sourceLabel = (f: Food) =>
  f.src === 'off' ? 'Producto · Open Food Facts' : f.src === 'ai' ? 'Estimado por IA' : f.id.startsWith('bc_') ? 'Producto · tabla del empaque' : f.src === 'user' ? 'Creado por ti' : 'Base FitCoach';

/**
 * Un alimento: porción (de la etiqueta o rápida), gramos, macros, veredicto y consecuencia.
 * Con el plato vacío se registra directo; con alimentos en el plato, se suma al plato.
 */
export function FoodDetail({
  food,
  slot,
  slotLabel,
  cart,
  onAdd,
  onRegister,
  onFix,
}: {
  food: Food;
  slot: number;
  slotLabel: string;
  /** Lo que ya está en el plato (cuenta para la consecuencia). */
  cart: Item[];
  onAdd: (grams: number) => void;
  onRegister: (grams: number) => void;
  /** Producto estimado por IA: leer su tabla nutricional para dejar los valores exactos. */
  onFix?: () => void;
}) {
  const { c } = useTheme();
  const profile = useApp((s) => s.profile)!;
  const targets = useApp((s) => s.targets)!;
  const logs = useTodayLogs();
  const [grams, setGrams] = useState(food.serving?.g ?? 100);
  const k = grams / 100;
  const item = useMemo(() => [...cart, { foodId: food.id, grams }], [cart, food.id, grams]);
  const x = useConsequence(item, slot);
  const eaten = sum([...logs, ...cart]);
  const v = verdict({ kcal: food.kcal * k, p: food.p * k }, eaten, targets, profile.goal);
  const presets = food.serving ? [food.serving.g, ...PRESETS.filter((g) => g !== food.serving!.g)] : PRESETS;
  const step = (d: 1 | -1) => setGrams((g) => Math.max(5, stepGrams(food.id, g, d)));
  const unit = householdMeasure(food.id, grams);
  const btn = { width: 48, height: 48, borderRadius: radius.btn, backgroundColor: c.bg, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' } as const;

  return (
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
      <Card hero>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Em size={56}>{food.emoji}</Em>
          <View style={{ flex: 1 }}>
            <Eyebrow color={food.src === 'ai' ? c.acc : undefined}>{sourceLabel(food)}</Eyebrow>
            <H size={19} style={{ marginTop: 2 }}>
              {food.name}
            </H>
            <Small>{Math.round(food.kcal)} kcal por 100 g</Small>
          </View>
        </View>

        <Eyebrow style={{ marginTop: 18, marginBottom: 8 }}>Porción</Eyebrow>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2, paddingHorizontal: 2 }}>
          {presets.map((g, i) => (
            <Chip key={g} small label={food.serving && i === 0 ? `${food.serving.label}` : `${g} g`} on={grams === g} onPress={() => setGrams(g)} />
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <Tap onPress={() => step(-1)} style={btn} accessibilityLabel="Menos">
            <Icon name="minus" size={20} color={c.ink} />
          </Tap>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
            <TextInput
              value={grams ? String(grams) : ''}
              onChangeText={(t) => setGrams(Math.min(2000, Number(t.replace(/\D/g, '')) || 0))}
              keyboardType="number-pad"
              maxLength={4}
              selectTextOnFocus
              accessibilityLabel="Gramos"
              style={{ color: c.ink, fontFamily: fonts.titleX, fontSize: 39, minWidth: 70, textAlign: 'right', padding: 0 }}
            />
            <T kind="mut">g</T>
          </View>
          <Tap onPress={() => step(1)} style={btn} accessibilityLabel="Más">
            <Icon name="plus" size={20} color={c.ink} />
          </Tap>
        </View>
        {unit && <Small style={{ textAlign: 'center', marginTop: 4 }}>≈ {unit}</Small>}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.line }}>
          {(
            [
              ['kcal', food.kcal, c.ink],
              ['Proteína', food.p, c.p],
              ['Carbos', food.c, c.c],
              ['Grasas', food.f, c.f],
            ] as const
          ).map(([label, per100, color]) => (
            <View key={label} style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontFamily: fonts.title, fontSize: 22, color }}>{Math.round(per100 * k)}</Text>
              <Small>{label === 'kcal' ? label : `${label} g`}</Small>
            </View>
          ))}
        </View>
      </Card>

      {onFix && (
        <Card>
          <T style={{ fontSize: 14, lineHeight: 20 }}>No encontramos la tabla de este producto: estos valores son una estimación por su nombre.</T>
          <Pill label="Corregir con una foto de la etiqueta" ghost style={{ marginTop: 10 }} onPress={onFix} />
        </Card>
      )}

      {/* Con exceso manda la consecuencia (cuenta las comidas que faltan); el veredicto solo mira lo comido. */}
      {x && x.excess > 0 ? null : (
        <Card>
          <Eyebrow style={{ marginBottom: 4 }}>Para tu día</Eyebrow>
          <T style={{ fontSize: 14, lineHeight: 20 }}>{v.text}</T>
        </Card>
      )}
      {x && <ConsequenceCard x={x} goal={profile.goal} />}

      {cart.length ? (
        <BigButton label={`Añadir al plato (${cart.length + 1})`} disabled={grams <= 0} onPress={() => onAdd(grams)} />
      ) : (
        <>
          <BigButton label={`Registrar en ${slotLabel}`} disabled={grams <= 0} onPress={() => onRegister(grams)} />
          <Pill label="Añadir y seguir sumando al plato" ghost style={{ marginTop: 10, paddingVertical: 13 }} onPress={() => grams > 0 && onAdd(grams)} />
        </>
      )}
    </ScrollView>
  );
}
