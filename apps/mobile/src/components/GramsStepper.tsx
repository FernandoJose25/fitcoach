import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { stepGrams } from '@fitcoach/core';
import { Icon } from '@/components/Icon';
import { Tap } from '@/components/Tap';
import { fonts, radius, useTheme } from '@/theme';

/**
 * − gramos +: los botones van de media en media medida casera (½ manzana) y los gramos se pueden escribir.
 * `min`: por debajo no baja (1 = no se puede dejar en 0; para quitar hay otro botón).
 */
export function GramsStepper({ foodId, name, grams, onChange, min = 0 }: { foodId: string; name: string; grams: number; onChange: (g: number) => void; min?: number }) {
  const { c } = useTheme();
  const [draft, setDraft] = useState<string | null>(null); // lo que se está escribiendo
  const go = (dir: 1 | -1) => {
    const g = stepGrams(foodId, grams, dir);
    if (g >= min) onChange(g);
  };
  const btn = { width: 36, height: 36, borderRadius: radius.chip, backgroundColor: c.bg, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' } as const;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Tap onPress={() => go(-1)} accessibilityLabel={`Menos ${name}`} style={btn}>
        <Icon name="minus" size={16} color={c.ink} />
      </Tap>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', minWidth: 54 }}>
        <TextInput
          value={draft ?? String(grams)}
          onFocus={() => setDraft(String(grams))}
          onBlur={() => setDraft(null)}
          onChangeText={(t) => {
            const d = t.replace(/\D/g, '');
            setDraft(d);
            const n = Math.min(2000, Number(d));
            if (n >= Math.max(1, min)) onChange(n);
          }}
          keyboardType="number-pad"
          maxLength={4}
          selectTextOnFocus
          accessibilityLabel={`Gramos de ${name}`}
          style={{ color: c.ink, fontFamily: fonts.num, fontSize: 14, padding: 0, minWidth: 30, textAlign: 'right' }}
        />
        <Text style={{ color: c.mut, fontFamily: fonts.num, fontSize: 12 }}> g</Text>
      </View>
      <Tap onPress={() => go(1)} accessibilityLabel={`Más ${name}`} style={btn}>
        <Icon name="plus" size={16} color={c.ink} />
      </Tap>
    </View>
  );
}
