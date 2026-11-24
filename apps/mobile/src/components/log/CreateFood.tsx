import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TextInput, View, type TextInputProps } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { barcodeId, customFood, type Food } from '@fitcoach/core';
import { Chip } from '@/components/Chip';
import { BigButton, Card, Eyebrow, H, Pill, Small, T } from '@/components/ui';
import { AI_ERRORS, newUserFoodId, readLabel } from '@/lib/foodApi';
import { prepareShot } from '@/lib/photo';
import { useApp } from '@/store/useApp';
import { fonts, radius, useTheme } from '@/theme';

const n = (t: string) => {
  const v = Number(t.replace(',', '.'));
  return Number.isFinite(v) && v >= 0 ? v : 0;
};

/**
 * Alimento propio con los valores de la etiqueta (por 100 g o por porción). Con `barcode` es un producto
 * que no está en ninguna base: se guarda con ese código y la próxima vez —tuya o de otra persona— sale solo.
 * La tabla se puede leer de una foto (`photo`: abre la cámara al entrar); los valores quedan para revisarlos.
 */
export function CreateFood({ initialName = '', barcode, photo, onSaved }: { initialName?: string; barcode?: string; photo?: boolean; onSaved: (f: Food) => void }) {
  const { c } = useTheme();
  const [name, setName] = useState(initialName);
  const [per, setPer] = useState<'100' | 'portion'>(barcode ? 'portion' : '100');
  const [portion, setPortion] = useState('');
  const [v, setV] = useState({ kcal: '', p: '', c: '', f: '' });
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [read, setRead] = useState(false); // los valores vienen de una foto: hay que revisarlos

  const readTable = async (from: 'camera' | 'gallery') => {
    setError(null);
    try {
      if (from === 'camera' && !(await ImagePicker.requestCameraPermissionsAsync()).granted) return setError('La cámara está bloqueada para FitCoach. Elige una foto de la galería o copia los valores.');
      const res = await (from === 'camera' ? ImagePicker.launchCameraAsync({ quality: 0.9 }) : ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 }));
      const uri = res.canceled ? null : res.assets?.[0]?.uri;
      if (!uri) return;
      setReading(true);
      // La letra de la tabla es pequeña: más ancho que la foto del plato.
      const r = await readLabel((await prepareShot(uri, 1400)).base64);
      if ('error' in r) return setError(AI_ERRORS[r.error] ?? AI_ERRORS.provider);
      const l = r.label;
      if (!l) return setError('No se ve una tabla nutricional en la foto. Acércate a la tabla, con luz y sin reflejos.');
      const s = (x: number | null) => (x === null ? '' : String(x));
      setPer(l.per);
      if (l.per === 'portion') setPortion(s(l.portion));
      setV({ kcal: s(l.kcal), p: s(l.p), c: s(l.c), f: s(l.f) });
      if (l.name) setName((x) => x || l.name);
      setRead(true);
    } catch {
      setError('No pudimos leer la foto. Inténtalo de nuevo o copia los valores.');
    } finally {
      setReading(false);
    }
  };
  const opened = useRef(false);
  useEffect(() => {
    if (!photo || opened.current) return;
    opened.current = true;
    readTable('camera');
  });

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
              ? `Código ${barcode}. Lo guardamos con los datos de la tabla nutricional para que la próxima vez salga solo, también para otras personas.`
              : 'Copia los valores de la etiqueta o de una tabla nutricional. Las calorías se calculan solas si las dejas vacías.'}
          </Small>
          {reading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
              <ActivityIndicator color={c.acc} />
              <T kind="bold">Leyendo la tabla…</T>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Pill label={read ? 'Tomar otra foto' : 'Foto de la tabla'} onPress={() => readTable('camera')} />
              <Pill label="Galería" ghost onPress={() => readTable('gallery')} />
            </View>
          )}
          {read && !reading && <Small style={{ marginTop: 10, color: c.acc }}>Revisa que los números coincidan con el empaque antes de guardar.</Small>}
        </Card>

        <Field label="Nombre" value={name} onChangeText={setName} placeholder={barcode ? 'p. ej. Galletas de soda (marca)' : 'p. ej. Salchipapa'} autoFocus={!initialName && !photo} />

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
