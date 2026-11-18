import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, ScrollView, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { matchFood, searchFoods, totals, verdict, type Food, type Goal, type Item, type ScanItem, type Targets } from '@fitcoach/core';
import { ConsequenceCard } from '@/components/Consequence';
import { Icon } from '@/components/Icon';
import { Tap } from '@/components/Tap';
import { BigButton, Card, Em, Eyebrow, Pill, Small, T } from '@/components/ui';
import { AI_ERRORS, aiFood, callAi } from '@/lib/foodApi';
import { useConsequence } from '@/lib/usePlan';
import { supabase } from '@/lib/supabase';
import { alpha, fonts, radius, useTheme } from '@/theme';

type Row = { name: string; food: Food | null; grams: number };
type State = { kind: 'camera' } | { kind: 'loading'; uri: string } | { kind: 'result'; uri: string; rows: Row[] } | { kind: 'error'; text: string };

/** La IA puede tardar con fotos grandes; más allá de esto se corta para no dejar el spinner girando. */
const SCAN_TIMEOUT = 35_000;

/**
 * Foto del plato → Edge Function `scan-food` → ingredientes etiquetados sobre la foto, gramos editables,
 * total, veredicto y consecuencia. Lo que no está en la base se registra con la estimación de la IA.
 */
export function PlateScan({
  foods,
  slot,
  slotLabel,
  targets,
  goal,
  eaten,
  cart,
  onRegister,
  onSearch,
}: {
  foods: Record<string, Food>;
  slot: number;
  slotLabel: string;
  targets: Targets;
  goal: Goal;
  eaten: { kcal: number };
  /** Lo que ya está en el plato (cuenta para la consecuencia). */
  cart: Item[];
  /** Alimentos a registrar (los estimados por IA aún no están guardados: se guardan al registrar). */
  onRegister: (items: { food: Food; grams: number }[]) => void;
  /** Salida cuando la foto no sirve: buscar el alimento por nombre. */
  onSearch: () => void;
}) {
  const { c } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [state, setState] = useState<State>({ kind: 'camera' });
  const [replacing, setReplacing] = useState<number | null>(null);

  const shoot = async () => {
    if (!camera.current) return;
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.8 });
      if (!photo) return;
      setState({ kind: 'loading', uri: photo.uri });
      const img = await ImageManipulator.manipulate(photo.uri).resize({ width: 1024 }).renderAsync();
      const { base64 } = await img.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
      const r = await callAi<{ items: ScanItem[] }>({ imageBase64: base64, mime: 'image/jpeg' }, SCAN_TIMEOUT);
      if ('error' in r) return setState({ kind: 'error', text: AI_ERRORS[r.error] ?? 'No pudimos analizar la foto. Revisa tu internet e inténtalo de nuevo.' });
      const items = r.data?.items ?? [];
      if (!items.length) return setState({ kind: 'error', text: 'No reconocimos comida en la foto. Prueba con más luz y el plato completo a la vista.' });
      setState({
        kind: 'result',
        uri: photo.uri,
        rows: items.map((i) => ({ name: i.name, food: matchFood(foods, i.name) ?? (i.per100 ? aiFood(i.name, i.per100) : null), grams: i.grams })),
      });
    } catch {
      setState({ kind: 'error', text: 'No pudimos procesar la foto. Inténtalo de nuevo.' });
    }
  };

  if (!supabase) {
    return (
      <Center>
        <T kind="mut" style={{ textAlign: 'center' }}>
          La foto del plato necesita conexión con el servidor. Mientras tanto, busca el alimento por nombre.
        </T>
        <Pill label="Buscar por nombre" onPress={onSearch} />
      </Center>
    );
  }
  if (!permission) return null;
  if (!permission.granted) {
    return (
      <Center>
        <T kind="mut" style={{ textAlign: 'center' }}>
          {permission.canAskAgain ? 'Necesitamos la cámara para analizar tu plato.' : 'La cámara está bloqueada para FitCoach. Actívala en los ajustes del teléfono para analizar tu plato.'}
        </T>
        <Pill label={permission.canAskAgain ? 'Permitir cámara' : 'Abrir ajustes'} onPress={permission.canAskAgain ? requestPermission : () => Linking.openSettings()} />
        <Pill label="Buscar por nombre" ghost onPress={onSearch} />
      </Center>
    );
  }

  if (state.kind === 'error') {
    return (
      <Center>
        <T style={{ textAlign: 'center' }}>{state.text}</T>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pill label="Tomar otra foto" onPress={() => setState({ kind: 'camera' })} />
          <Pill label="Buscar por nombre" ghost onPress={onSearch} />
        </View>
      </Center>
    );
  }

  if (state.kind === 'result') {
    const rows = state.rows;
    const setRows = (next: Row[]) => setState({ ...state, rows: next });
    if (replacing !== null) {
      return (
        <Replace
          title={rows[replacing].name}
          foods={foods}
          onPick={(food) => {
            setRows(rows.map((r, i) => (i === replacing ? { ...r, food } : r)));
            setReplacing(null);
          }}
          onCancel={() => setReplacing(null)}
        />
      );
    }
    return <Result uri={state.uri} rows={rows} setRows={setRows} onReplace={setReplacing} {...{ slot, slotLabel, targets, goal, eaten, cart, onRegister }} onRetake={() => setState({ kind: 'camera' })} />;
  }

  return (
    <View style={{ flex: 1, gap: 12 }}>
      <View style={{ flex: 1, maxHeight: 440, borderRadius: radius.card, overflow: 'hidden', backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }}>
        {state.kind === 'loading' ? (
          <>
            <Image source={{ uri: state.uri }} style={{ position: 'absolute', inset: 0, opacity: 0.45 }} contentFit="cover" />
            <ActivityIndicator color={c.acc} size="large" />
            <T kind="bold" style={{ marginTop: 10 }}>
              Analizando tu plato…
            </T>
          </>
        ) : (
          <CameraView ref={camera} style={{ width: '100%', height: '100%' }} facing="back" />
        )}
      </View>
      <BigButton label="Tomar foto" disabled={state.kind === 'loading'} onPress={shoot} />
      <Small style={{ textAlign: 'center' }}>Encuadra el plato completo desde arriba y con buena luz. Máximo 30 fotos al día.</Small>
    </View>
  );
}

function Result({
  uri,
  rows,
  setRows,
  onReplace,
  slot,
  slotLabel,
  targets,
  goal,
  eaten,
  cart,
  onRegister,
  onRetake,
}: {
  uri: string;
  rows: Row[];
  setRows: (r: Row[]) => void;
  onReplace: (i: number) => void;
  slot: number;
  slotLabel: string;
  targets: Targets;
  goal: Goal;
  eaten: { kcal: number };
  cart: Item[];
  onRegister: (items: { food: Food; grams: number }[]) => void;
  onRetake: () => void;
}) {
  const { c } = useTheme();
  const matched = rows.filter((r): r is Row & { food: Food } => !!r.food && r.grams > 0);
  const byId = Object.fromEntries(matched.map((r) => [r.food.id, r.food]));
  const sum = totals(
    matched.map((r) => ({ foodId: r.food.id, grams: r.grams })),
    byId,
  );
  // Consecuencia: los alimentos estimados aún no están guardados, así que se suma el total del plato.
  const x = useConsequence(cart, slot, sum);
  const step = (i: number, d: number) => setRows(rows.map((r, j) => (j === i ? { ...r, grams: Math.min(2000, Math.max(0, r.grams + d)) } : r)));

  return (
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
      {/* Foto con los ingredientes detectados etiquetados encima. */}
      <View style={{ height: 230, borderRadius: radius.card, overflow: 'hidden', marginBottom: 12, backgroundColor: c.card }}>
        <Image source={{ uri }} style={{ position: 'absolute', inset: 0 }} contentFit="cover" />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6, backgroundColor: alpha('#000000', 0.28) }}>
          {rows.map((r, i) => (
            <View key={i} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.chip, backgroundColor: alpha('#FFFFFF', 0.92) }}>
              <Text style={{ color: '#151513', fontFamily: fonts.bold, fontSize: 12 }}>{r.food?.name ?? r.name}</Text>
            </View>
          ))}
        </View>
      </View>

      <Card hero>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View>
            <Eyebrow>Calorías del plato</Eyebrow>
            <Text style={{ fontFamily: fonts.titleX, fontSize: 40, color: c.ink }}>
              {Math.round(sum.kcal)}
              <Text style={{ fontFamily: fonts.num, fontSize: 14, color: c.mut }}> kcal</Text>
            </Text>
          </View>
          <Small style={{ marginBottom: 8 }}>La IA estima los gramos a ojo: revísalos.</Small>
        </View>
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 8 }}>
          {(
            [
              ['Proteína', sum.p, c.p],
              ['Carbos', sum.c, c.c],
              ['Grasas', sum.f, c.f],
            ] as const
          ).map(([label, v, color]) => (
            <View key={label} style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 6, height: 6, backgroundColor: color }} />
                <Eyebrow style={{ fontSize: 9.5 }}>{label}</Eyebrow>
              </View>
              <Text style={{ fontFamily: fonts.num, fontSize: 15, color: c.ink, marginTop: 4 }}>{Math.round(v)} g</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 12 }}>
          {rows.map((r, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.line }}>
              <Tap haptic={false} onPress={() => onReplace(i)} accessibilityHint="Elegir otro alimento" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Em size={38}>{r.food?.emoji ?? '❓'}</Em>
                <View style={{ flex: 1 }}>
                  <T kind="bold" numberOfLines={1}>
                    {r.food?.name ?? r.name}
                  </T>
                  <Small numberOfLines={1} style={r.food ? undefined : { color: c.f }}>
                    {r.food ? `${Math.round((r.food.kcal * r.grams) / 100)} kcal${r.food.src === 'ai' ? ' · estimado por IA' : ''} · cambiar` : 'No está en la base · toca para elegir'}
                  </Small>
                </View>
              </Tap>
              <Tap onPress={() => step(i, -10)} accessibilityLabel={`Restar 10 gramos de ${r.food?.name ?? r.name}`} style={stepBtn(c)}>
                <Icon name="minus" size={16} color={c.ink} />
              </Tap>
              <Text style={{ color: c.ink, fontFamily: fonts.num, fontSize: 14, minWidth: 48, textAlign: 'center' }}>{r.grams} g</Text>
              <Tap onPress={() => step(i, 10)} accessibilityLabel={`Sumar 10 gramos de ${r.food?.name ?? r.name}`} style={stepBtn(c)}>
                <Icon name="plus" size={16} color={c.ink} />
              </Tap>
            </View>
          ))}
        </View>
      </Card>

      {matched.length > 0 && !(x && x.excess > 0) && (
        <Card>
          <Eyebrow style={{ marginBottom: 4 }}>Para tu día</Eyebrow>
          <T style={{ fontSize: 14, lineHeight: 20 }}>{verdict({ kcal: sum.kcal, p: sum.p }, eaten, targets, goal).text}</T>
        </Card>
      )}
      {x && <ConsequenceCard x={x} goal={goal} />}
      <BigButton label={`Registrar en ${slotLabel}`} disabled={!matched.length} onPress={() => onRegister(matched.map((r) => ({ food: r.food, grams: r.grams })))} />
      <Pill label="Solo consultar · otra foto" ghost style={{ marginTop: 10, paddingVertical: 13 }} onPress={onRetake} />
    </ScrollView>
  );
}

const stepBtn = (c: { bg: string; line: string }) => ({ width: 36, height: 36, borderRadius: radius.chip, backgroundColor: c.bg, borderWidth: 1, borderColor: c.line, alignItems: 'center' as const, justifyContent: 'center' as const });

function Center({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 10 }}>{children}</View>;
}

/** Elegir el alimento correcto para una fila detectada. */
function Replace({ title, foods, onPick, onCancel }: { title: string; foods: Record<string, Food>; onPick: (f: Food) => void; onCancel: () => void }) {
  const { c } = useTheme();
  const [query, setQuery] = useState(title);
  const results = useMemo(() => searchFoods(foods, query).slice(0, 40), [foods, query]);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Small>La IA dijo: “{title}”</Small>
        <Pill label="Cancelar" ghost style={{ paddingVertical: 6, paddingHorizontal: 12 }} onPress={onCancel} />
      </View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        autoFocus
        selectTextOnFocus
        placeholder="Busca el alimento…"
        placeholderTextColor={c.mut}
        autoCorrect={false}
        accessibilityLabel="Buscar alimento"
        style={{ backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radius.btn, paddingHorizontal: 16, paddingVertical: 12, color: c.ink, fontFamily: fonts.body, fontSize: 15, marginBottom: 10 }}
      />
      <FlatList
        data={results}
        keyExtractor={(f) => f.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <T kind="mut" style={{ textAlign: 'center', marginTop: 20 }}>
            Sin resultados. Prueba con una palabra más simple.
          </T>
        }
        renderItem={({ item: f }) => (
          <Tap onPress={() => onPick(f)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: c.line }}>
            <Em size={36}>{f.emoji}</Em>
            <View style={{ flex: 1 }}>
              <T kind="bold">{f.name}</T>
              <Small>{Math.round(f.kcal)} kcal por 100 g</Small>
            </View>
          </Tap>
        )}
      />
    </View>
  );
}
