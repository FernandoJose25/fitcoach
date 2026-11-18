import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View, type TextInputProps } from 'react-native';
import { barcodeId, customFood, type Food } from '@fitcoach/core';
import { Chip } from '@/components/Chip';
import { BigButton, Card, Eyebrow, H, Small, T } from '@/components/ui';
import { newUserFoodId } from '@/lib/foodApi';
import { useApp } from '@/store/useApp';
import { fonts, radius, useTheme } from '@/theme';

const n = (t: string) => {
  const v = Number(t.replace(',', '.'));
  return Number.isFinite(v) && v >= 0 ? v : 0;
};

/**
 * Alimento propio con los valores de la etiqueta (por 100 g o por porción). Con `barcode` es un producto
 * que no está en ninguna base: se guarda con ese código y la próxima vez —tuya o de otra persona— sale solo.
 */
export function CreateFood({ initialName = '', barcode, onSaved }: { initialName?: string; barcode?: string; onSaved: (f: Food) => void }) {
  const { c } = useTheme();
  const [name, setName] = useState(initialName);
  const [per, setPer] = useState<'100' | 'portion'>(barcode ? 'portion' : '100');
  const [portion, setPortion] = useState('');
  const [v, setV] = useState({ kcal: '', p: '', c: '', f: '' });
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const g = n(portion);
    if (!name.trim()) return setError('Ponle un nombre.');
    if (per === 'portion' && g <= 0) return setError('Escribe cuánto pesa la porción (en gramos).');
    const k = per === 'portion' ? 100 / g : 1;
    const food = customFood(
      barcode ? barcodeId(barcode) : newUserFoodId(),
      name,
      { kcal: v.kcal ? n(v.kcal) * k : null, p: n(v.p) * k, c: n(v.c) * k, f: n(v.f) * k },
      { emoji: barcode ? '🏷️' : '🍽️', serving: per === 'portion' ? { g: Math.round(g), label: `1 porción (${Math.round(g)} g)` } : undefined },
    );
    if (!food) return setError('Revisa los valores: faltan calorías o macros, o suman más de lo posible para esa cantidad.');
    useApp.getState().addFood(food);
    onSaved(food);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <Card hero>
          <H size={19}>{barcode ? 'Producto nuevo' : 'Crear alimento'}</H>
          <Small style={{ marginTop: 4, lineHeight: 17 }}>
            {barcode
              ? `El código ${barcode} no está en ninguna base. Copia los datos de la tabla nutricional del empaque: lo guardamos para que la próxima vez salga solo, también para otras personas.`
              : 'Copia los valores de la etiqueta o de una tabla nutricional. Las calorías se calculan solas si las dejas vacías.'}
          </Small>
        </Card>

        <Field label="Nombre" value={name} onChangeText={setName} placeholder={barcode ? 'p. ej. Galletas de soda (marca)' : 'p. ej. Salchipapa'} autoFocus={!initialName} />

        <Eyebrow style={{ marginTop: 6, marginBottom: 8 }}>Los valores son por</Eyebrow>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <Chip small label="100 g" on={per === '100'} onPress={() => setPer('100')} />
          <Chip small label="Porción" on={per === 'portion'} onPress={() => setPer('portion')} />
        </View>
        {per === 'portion' && <Field label="La porción pesa (g)" value={portion} onChangeText={setPortion} keyboardType="decimal-pad" placeholder="p. ej. 30" />}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Field label="Calorías (kcal)" value={v.kcal} onChangeText={(t) => setV({ ...v, kcal: t })} keyboardType="decimal-pad" placeholder="opcional" flex />
          <Field label="Proteína (g)" value={v.p} onChangeText={(t) => setV({ ...v, p: t })} keyboardType="decimal-pad" placeholder="0" flex />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Field label="Carbohidratos (g)" value={v.c} onChangeText={(t) => setV({ ...v, c: t })} keyboardType="decimal-pad" placeholder="0" flex />
          <Field label="Grasas (g)" value={v.f} onChangeText={(t) => setV({ ...v, f: t })} keyboardType="decimal-pad" placeholder="0" flex />
        </View>

        {error && (
          <T style={{ color: c.acc, fontSize: 13, marginBottom: 10 }} accessibilityLiveRegion="polite">
            {error}
          </T>
        )}
        <BigButton label="Guardar y continuar" onPress={save} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Campo con rótulo visible (no solo placeholder). */
function Field({ label, flex, ...rest }: TextInputProps & { label: string; flex?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={{ marginBottom: 12, flex: flex ? 1 : undefined }}>
      <Eyebrow style={{ marginBottom: 6 }}>{label}</Eyebrow>
      <TextInput
        {...rest}
        accessibilityLabel={label}
        placeholderTextColor={c.mut}
        style={{ backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radius.btn, paddingHorizontal: 14, paddingVertical: 12, color: c.ink, fontFamily: fonts.body, fontSize: 16 }}
      />
    </View>
  );
}
