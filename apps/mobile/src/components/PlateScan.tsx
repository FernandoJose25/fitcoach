import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { Easing, FadeIn, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { alternatives, matchFood, scanFood, searchFoods, totals, verdict, type Food, type Goal, type Item, type ScanItem, type Targets } from '@fitcoach/core';
import { ConsequenceCard } from '@/components/Consequence';
import { Icon } from '@/components/Icon';
import { Tap } from '@/components/Tap';
import { BigButton, Card, Em, Eyebrow, Pill, Small, T } from '@/components/ui';
import { AI_ERRORS, aiFood, callAi } from '@/lib/foodApi';
import { prepareShot, type Shot } from '@/lib/photo';
import { useConsequence } from '@/lib/usePlan';
import { supabase } from '@/lib/supabase';
import { alpha, fonts, radius, useTheme } from '@/theme';

/**
 * `base`: gramos que estimó la IA (la porción ½×…2× se aplica sobre ellos). `low`: la IA no está segura.
 * `options`: lo que se confunde a la vista con lo detectado, para cambiarlo de un toque.
 */
type Row = { name: string; food: Food | null; grams: number; base: number; low: boolean; options: Food[] };
type State = { kind: 'camera' } | { kind: 'loading'; uri: string } | { kind: 'result'; uri: string; rows: Row[]; dish: string } | { kind: 'error'; text: string };

/** La IA puede tardar con fotos grandes; más allá de esto se corta para no dejar el spinner girando. */
const SCAN_TIMEOUT = 35_000;
const STEPS = ['Detectando alimentos…', 'Separando ingredientes…', 'Calculando porciones…', 'Estimando calorías…'];
const PORTIONS: [string, number][] = [
  ['½', 0.5],
  ['¾', 0.75],
  ['Normal', 1],
  ['1¼', 1.25],
  ['1½', 1.5],
  ['2×', 2],
];
const roundG = (g: number) => Math.max(0, Math.round(g / 5) * 5);

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
  // Fila a cambiar; 'add' = elegir un alimento que la IA no vio.
  const [replacing, setReplacing] = useState<number | 'add' | null>(null);
  const [torch, setTorch] = useState(false);
  const shot = useRef<Shot | null>(null); // la última foto, para volver a analizarla con una pista

  const analyze = async (s: Shot, hint?: string) => {
    shot.current = s;
    setState({ kind: 'loading', uri: s.uri });
    try {
      const r = await callAi<{ dish?: string; items: ScanItem[] }>({ imageBase64: s.base64, mime: 'image/jpeg', ...(hint ? { hint } : {}) }, SCAN_TIMEOUT);
      if ('error' in r) return setState({ kind: 'error', text: AI_ERRORS[r.error] ?? 'No pudimos analizar la foto. Revisa tu internet e inténtalo de nuevo.' });
      const items = r.data?.items ?? [];
      if (!items.length) return setState({ kind: 'error', text: 'No reconocimos comida en la foto. Prueba con más luz y el plato completo a la vista.' });
      setState({
        kind: 'result',
        uri: s.uri,
        dish: r.data?.dish ?? '',
        rows: items.map((i) => {
          const food = scanFood(foods, i) ?? (i.per100 ? aiFood(i.name, i.per100) : matchFood(foods, i.name));
          return { name: i.name, food, grams: i.grams, base: i.grams, low: i.confidence < 0.5, options: alternatives(foods, i, food) };
        }),
      });
    } catch {
      setState({ kind: 'error', text: 'No pudimos procesar la foto. Inténtalo de nuevo.' });
    }
  };

  const shoot = async () => {
    if (!camera.current) return;
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.8 });
      if (!photo) return;
      setTorch(false);
      setState({ kind: 'loading', uri: photo.uri });
      await analyze(await prepareShot(photo.uri));
    } catch {
      setState({ kind: 'error', text: 'No pudimos procesar la foto. Inténtalo de nuevo.' });
    }
  };

  /** Una foto que ya tomaste (galería). */
  const pick = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      const uri = res.canceled ? null : res.assets?.[0]?.uri;
      if (!uri) return;
      setState({ kind: 'loading', uri });
      await analyze(await prepareShot(uri));
    } catch {
      setState({ kind: 'error', text: 'No pudimos abrir esa foto. Prueba con otra.' });
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
  // Solo antes de tomar o elegir la foto: con la cámara negada, la foto de la galería sigue su análisis.
  if (!permission.granted && state.kind === 'camera') {
    return (
      <Center>
        <T kind="mut" style={{ textAlign: 'center' }}>
          {permission.canAskAgain ? 'Necesitamos la cámara para analizar tu plato.' : 'La cámara está bloqueada para FitCoach. Actívala en los ajustes del teléfono para analizar tu plato.'}
        </T>
        <Pill label={permission.canAskAgain ? 'Permitir cámara' : 'Abrir ajustes'} onPress={permission.canAskAgain ? requestPermission : () => Linking.openSettings()} />
        <Pill label="Elegir una foto de la galería" ghost onPress={pick} />
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
      const adding = replacing === 'add';
      return (
        <Replace
          title={adding ? '' : rows[replacing].name}
          foods={foods}
          onPick={(food) => {
            setRows(adding ? [...rows, { name: food.name, food, grams: food.serving?.g ?? 100, base: food.serving?.g ?? 100, low: false, options: [] }] : rows.map((r, i) => (i === replacing ? { ...r, food, low: false, options: [] } : r)));
            setReplacing(null);
          }}
          onRemove={
            adding
              ? undefined
              : () => {
                  setRows(rows.filter((_, i) => i !== replacing));
                  setReplacing(null);
                }
          }
          onCancel={() => setReplacing(null)}
        />
      );
    }
    return (
      <Result
        uri={state.uri}
        dish={state.dish}
        rows={rows}
        setRows={setRows}
        onReplace={setReplacing}
        {...{ slot, slotLabel, targets, goal, eaten, cart, onRegister }}
        onRetake={() => setState({ kind: 'camera' })}
        onHint={(hint) => shot.current && analyze(shot.current, hint)}
      />
    );
  }

  return (
    <View style={{ flex: 1, gap: 12 }}>
      <View style={{ flex: 1, maxHeight: 440, borderRadius: radius.card, overflow: 'hidden', backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }}>
        {state.kind === 'loading' ? (
          <Scanning uri={state.uri} />
        ) : (
          <>
            <CameraView ref={camera} style={{ width: '100%', height: '100%' }} facing="back" enableTorch={torch} />
            {/* Guía de encuadre: el plato dentro del círculo. */}
            <View pointerEvents="none" style={{ position: 'absolute', width: '78%', aspectRatio: 1, borderRadius: 999, borderWidth: 2, borderColor: alpha('#FFFFFF', 0.7), borderStyle: 'dashed' }} />
            <Tap
              onPress={() => setTorch((t) => !t)}
              accessibilityLabel={torch ? 'Apagar la linterna' : 'Encender la linterna'}
              accessibilityState={{ selected: torch }}
              style={{ position: 'absolute', top: 12, right: 12, width: 44, height: 44, borderRadius: radius.btn, backgroundColor: torch ? c.acc : alpha('#000000', 0.5), alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="flash" size={20} color="#FFFFFF" />
            </Tap>
          </>
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Tap
          onPress={pick}
          disabled={state.kind === 'loading'}
          accessibilityLabel="Elegir una foto de la galería"
          style={{ width: 58, borderRadius: radius.btn, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center', opacity: state.kind === 'loading' ? 0.4 : 1 }}
        >
          <Icon name="image" size={24} color={c.ink} />
        </Tap>
        <BigButton label="Tomar foto" disabled={state.kind === 'loading'} onPress={shoot} style={{ flex: 1 }} />
      </View>
      <Small style={{ textAlign: 'center' }}>Encuadra el plato completo desde arriba y con buena luz. También puedes elegir una foto de tu galería. Máximo 30 al día.</Small>
    </View>
  );
}

/** Análisis en curso: la foto con una línea que la recorre y el paso que va haciendo la IA. */
function Scanning({ uri }: { uri: string }) {
  const { c } = useTheme();
  const [h, setH] = useState(0);
  const [step, setStep] = useState(0);
  const y = useSharedValue(0);
  useEffect(() => {
    if (!h) return;
    y.value = 0;
    // Ida y vuelta lineal, sin rebote.
    y.value = withRepeat(withTiming(h - 3, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(y);
  }, [h, y]);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 1600);
    return () => clearInterval(id);
  }, []);
  const line = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }} onLayout={(e) => setH(e.nativeEvent.layout.height)}>
      <Image source={{ uri }} style={{ position: 'absolute', inset: 0, opacity: 0.55 }} contentFit="cover" />
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: c.acc, shadowColor: c.acc, shadowOpacity: 0.9, shadowRadius: 10, elevation: 6 }, line]} />
      <View style={{ alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 14, borderRadius: radius.card, backgroundColor: alpha('#000000', 0.55) }}>
        <ActivityIndicator color={c.acc} size="large" />
        <Animated.Text key={step} entering={FadeIn.duration(250)} style={{ color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 15 }}>
          {STEPS[step]}
        </Animated.Text>
      </View>
    </View>
  );
}

function Result({
  uri,
  dish,
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
  onHint,
}: {
  uri: string;
  dish: string;
  rows: Row[];
  setRows: (r: Row[]) => void;
  onReplace: (i: number | 'add') => void;
  /** Volver a analizar la misma foto con lo que el usuario dice que es. */
  onHint: (hint: string) => void;
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
  const [portion, setPortion] = useState(1);
  const [hint, setHint] = useState('');
  const step = (i: number, d: number) => setRows(rows.map((r, j) => (j === i ? { ...r, grams: Math.min(2000, Math.max(0, r.grams + d)) } : r)));
  /** Cambia lo detectado por una de sus opciones; lo anterior queda como opción por si fue sin querer. */
  const swap = (i: number, food: Food) => setRows(rows.map((r, j) => (j === i ? { ...r, food, low: false, options: [...(r.food ? [r.food] : []), ...r.options.filter((o) => o.id !== food.id)] } : r)));
  // Porción de todo el plato respecto a lo que estimó la IA (la IA suele fallar más en cantidad que en qué es).
  const scale = (f: number) => {
    setPortion(f);
    setRows(rows.map((r) => ({ ...r, grams: roundG(r.base * f) })));
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
      {/* Foto con el plato detectado y sus ingredientes etiquetados encima. */}
      <View style={{ height: 230, borderRadius: radius.card, overflow: 'hidden', marginBottom: 12, backgroundColor: c.card }}>
        <Image source={{ uri }} style={{ position: 'absolute', inset: 0 }} contentFit="cover" />
        {!!dish && (
          <View style={{ position: 'absolute', top: 10, left: 10, right: 10 }}>
            <View style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.chip, backgroundColor: alpha('#000000', 0.62) }}>
              <Text style={{ color: '#FFFFFF', fontFamily: fonts.num, fontSize: 10, letterSpacing: 1.2 }}>PLATO DETECTADO</Text>
              <Text style={{ color: '#FFFFFF', fontFamily: fonts.title, fontSize: 19 }}>{dish}</Text>
            </View>
          </View>
        )}
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
        <Eyebrow style={{ marginTop: 10, marginBottom: 6, fontSize: 9.5 }}>Tu porción</Eyebrow>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {PORTIONS.map(([label, f]) => {
            const on = portion === f;
            return (
              <Tap
                key={label}
                onPress={() => scale(f)}
                accessibilityState={{ selected: on }}
                accessibilityLabel={`Porción ${label}`}
                style={{ flex: label === 'Normal' ? 1.6 : 1, height: 34, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.ink : c.bg, borderWidth: 1, borderColor: on ? c.ink : c.line }}
              >
                <Text style={{ color: on ? c.bg : c.ink, fontFamily: fonts.bold, fontSize: 12.5 }}>{label}</Text>
              </Tap>
            );
          })}
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
            <View key={i} style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.line }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Tap haptic={false} onPress={() => onReplace(i)} accessibilityHint="Elegir otro alimento" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Em size={38}>{r.food?.emoji ?? '❓'}</Em>
                  <View style={{ flex: 1 }}>
                    <T kind="bold" numberOfLines={1}>
                      {r.food?.name ?? r.name}
                    </T>
                    <Small numberOfLines={1} style={!r.food ? { color: c.f } : r.low ? { color: c.acc } : undefined}>
                      {!r.food
                        ? 'No está en la base · toca para elegir'
                        : r.low
                          ? `¿Es esto? La IA no está segura · cambiar`
                          : `${Math.round((r.food.kcal * r.grams) / 100)} kcal${r.food.src === 'ai' ? ' · estimado por IA' : ''} · cambiar`}
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
              {r.options.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flexGrow: 0, marginTop: 8 }} contentContainerStyle={{ gap: 6, alignItems: 'center' }}>
                  <Small>¿O es?</Small>
                  {r.options.map((o) => (
                    <Tap
                      key={o.id}
                      onPress={() => swap(i, o)}
                      accessibilityLabel={`Cambiar ${r.food?.name ?? r.name} por ${o.name}`}
                      style={{ paddingHorizontal: 10, minHeight: 32, justifyContent: 'center', borderRadius: radius.chip, backgroundColor: c.bg, borderWidth: 1, borderColor: r.low ? c.acc : c.line }}
                    >
                      <Text style={{ color: c.ink, fontFamily: fonts.bold, fontSize: 12 }}>
                        {o.emoji} {o.name}
                      </Text>
                    </Tap>
                  ))}
                </ScrollView>
              )}
            </View>
          ))}
          <Tap onPress={() => onReplace('add')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.line }}>
            <View style={{ width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: c.line, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={18} color={c.ink} />
            </View>
            <T kind="bold" style={{ fontSize: 14 }}>
              Añadir algo que no vio
            </T>
          </Tap>
        </View>
      </Card>

      {/* Corrección: la misma foto se vuelve a analizar con lo que el usuario dice que es. */}
      <Card>
        <Eyebrow style={{ marginBottom: 6 }}>¿La IA se equivocó de plato?</Eyebrow>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={hint}
            onChangeText={setHint}
            placeholder="Dile qué es: ají de gallina, tallarín verde…"
            placeholderTextColor={c.mut}
            maxLength={120}
            returnKeyType="send"
            onSubmitEditing={() => hint.trim().length > 2 && onHint(hint.trim())}
            accessibilityLabel="Qué plato es"
            style={{ flex: 1, backgroundColor: c.bg, borderWidth: 1, borderColor: c.line, borderRadius: radius.btn, paddingHorizontal: 12, paddingVertical: 10, color: c.ink, fontFamily: fonts.body, fontSize: 14 }}
          />
          <Tap
            onPress={() => onHint(hint.trim())}
            disabled={hint.trim().length < 3}
            accessibilityLabel="Volver a analizar con esta pista"
            style={{ width: 48, borderRadius: radius.btn, backgroundColor: c.acc, alignItems: 'center', justifyContent: 'center', opacity: hint.trim().length < 3 ? 0.4 : 1 }}
          >
            <Icon name="spark" size={20} color={c.on} />
          </Tap>
        </View>
        <Small style={{ marginTop: 6 }}>Vuelve a analizar la misma foto con tu pista (cuenta como una foto).</Small>
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

/** Elegir el alimento correcto para una fila detectada (o, sin `title`, uno que la IA no vio). */
function Replace({ title, foods, onPick, onRemove, onCancel }: { title: string; foods: Record<string, Food>; onPick: (f: Food) => void; onRemove?: () => void; onCancel: () => void }) {
  const { c } = useTheme();
  const [query, setQuery] = useState(title);
  const results = useMemo(() => (query.trim() ? searchFoods(foods, query).slice(0, 40) : []), [foods, query]);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <Small style={{ flex: 1 }} numberOfLines={1}>
          {title ? `La IA dijo: “${title}”` : 'Añade lo que faltó en el plato'}
        </Small>
        {onRemove && <Pill label="Quitar" ghost style={{ paddingVertical: 6, paddingHorizontal: 12 }} onPress={onRemove} />}
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
            {query.trim() ? 'Sin resultados. Prueba con una palabra más simple.' : 'Escribe el alimento: palta, gaseosa, pan…'}
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
