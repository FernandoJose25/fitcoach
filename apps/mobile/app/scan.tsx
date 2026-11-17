import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { foodFromOff, frequentFoodIds, offId, searchFoods, verdict, type Food } from '@fitcoach/core';
import { Chip } from '@/components/Chip';
import { PlateScan } from '@/components/PlateScan';
import { Tap } from '@/components/Tap';
import { BigButton, Card, Em, H, Pill, Small, T } from '@/components/ui';
import { sum, useFoods, usePlan, useTodayLogs } from '@/lib/usePlan';
import { useApp, type Via } from '@/store/useApp';
import { useUi } from '@/store/useUi';
import { fonts, radius, useTheme } from '@/theme';

type Mode = 'buscar' | 'codigo' | 'plato';
const MODES: [Mode, string][] = [
  ['buscar', 'Buscar'],
  ['codigo', 'Código de barras'],
  ['plato', 'Plato'],
];
/** Open Food Facts puede tardar; sin respuesta en 12 s se muestra el error en vez de un spinner infinito. */
const OFF_TIMEOUT = 12_000;

/** Registro manual: búsqueda, código de barras y foto del plato con IA. */
export default function Scan() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ slot?: string }>();
  const profile = useApp((s) => s.profile)!;
  const targets = useApp((s) => s.targets)!;
  const allLogs = useApp((s) => s.logs);
  const plan = usePlan();
  const logs = useTodayLogs();
  const foods = useFoods();

  const [mode, setMode] = useState<Mode>('buscar');
  const [slot, setSlot] = useState(() => {
    if (params.slot !== undefined) return Number(params.slot);
    const next = plan.findIndex((_, i) => !logs.some((l) => l.slot === i));
    return next >= 0 ? next : plan.length - 1;
  });
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<{ food: Food; via: Via } | null>(null);
  const [grams, setGrams] = useState(100);

  const results = useMemo(() => searchFoods(foods, query), [foods, query]);
  const frequent = useMemo(() => frequentFoodIds(allLogs).flatMap((id) => (foods[id] ? [foods[id]] : [])), [allLogs, foods]);
  const pick = (food: Food, via: Via) => {
    setGrams(100);
    setPicked({ food, via });
  };

  const register = () => {
    if (!picked) return;
    useApp.getState().addLogs([{ foodId: picked.food.id, grams, slot, via: picked.via }]);
    useUi.getState().confetti();
    useUi.getState().showToast(`${grams} g de ${picked.food.name.toLowerCase()} ✓`);
    router.back();
  };

  const k = grams / 100;
  const eaten = sum(logs);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingHorizontal: 20, paddingTop: insets.top + 14, paddingBottom: insets.bottom + 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <Tap
          onPress={() => (picked ? setPicked(null) : router.back())}
          accessibilityLabel={picked ? 'Volver a la búsqueda' : 'Cerrar'}
          style={{ width: 42, height: 42, borderRadius: 11, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: c.ink, fontSize: 18 }}>{picked ? '‹' : '✕'}</Text>
        </Tap>
        <H size={20}>Registrar comida</H>
      </View>

      <View style={{ marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2, paddingHorizontal: 2 }}>
          {plan.map((m, i) => (
            <Chip key={i} small label={m.label} on={slot === i} onPress={() => setSlot(i)} />
          ))}
        </ScrollView>
      </View>

      {picked ? (
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Card hero>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <Em size={52}>{picked.food.emoji}</Em>
              <View style={{ flex: 1 }}>
                <H>{picked.food.name}</H>
                <Small>{Math.round(picked.food.kcal)} kcal por 100 g</Small>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pill label="−" a11y="Restar 10 gramos" ghost style={{ width: 52 }} textStyle={{ fontSize: 18 }} onPress={() => setGrams((g) => Math.max(10, g - 10))} />
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
                <TextInput
                  value={grams ? String(grams) : ''}
                  onChangeText={(v) => setGrams(Math.min(2000, Number(v.replace(/\D/g, '')) || 0))}
                  keyboardType="number-pad"
                  maxLength={4}
                  selectTextOnFocus
                  accessibilityLabel="Gramos"
                  style={{ color: c.ink, fontFamily: fonts.titleX, fontSize: 39, minWidth: 70, textAlign: 'right', padding: 0 }}
                />
                <T kind="mut">g</T>
              </View>
              <Pill label="＋" a11y="Sumar 10 gramos" ghost style={{ width: 52 }} textStyle={{ fontSize: 18 }} onPress={() => setGrams((g) => Math.min(2000, g + 10))} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              {(
                [
                  ['kcal', picked.food.kcal, c.ink],
                  ['Proteína', picked.food.p, c.p],
                  ['Carbos', picked.food.c, c.c],
                  ['Grasas', picked.food.f, c.f],
                ] as const
              ).map(([label, per100, color]) => (
                <View key={label} style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontFamily: fonts.title, fontSize: 21, color }}>{Math.round(per100 * k)}</Text>
                  <Small>{label}</Small>
                </View>
              ))}
            </View>
          </Card>
          <Card>
            <T>{verdict({ kcal: picked.food.kcal * k, p: picked.food.p * k }, eaten, targets, profile.goal).text}</T>
          </Card>
          <BigButton label={`Registrar en ${plan[slot]?.label ?? 'mi día'}`} disabled={grams <= 0} onPress={register} />
          <Pill label="Solo consultar, no lo comeré" ghost style={{ marginTop: 10, paddingVertical: 13 }} onPress={() => setPicked(null)} />
        </ScrollView>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {MODES.map(([m, label]) => (
              <Chip key={m} small label={label} on={mode === m} onPress={() => setMode(m)} />
            ))}
          </View>

          {mode === 'buscar' && (
            <>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Busca un alimento…"
                placeholderTextColor={c.mut}
                accessibilityLabel="Buscar alimento"
                autoCorrect={false}
                style={{ backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radius.btn, paddingHorizontal: 16, paddingVertical: 12, color: c.ink, fontFamily: fonts.body, fontSize: 15, marginBottom: 10 }}
              />
              <FlatList
                data={results}
                keyExtractor={(f) => f.id}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                  !query && frequent.length ? (
                    <View style={{ marginBottom: 6 }}>
                      <Small style={{ marginBottom: 8 }}>Frecuentes</Small>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {frequent.map((f) => (
                          <Chip key={f.id} small label={`${f.emoji} ${f.name}`} on={false} onPress={() => pick(f, f.id.startsWith('off_') ? 'barcode' : 'manual')} />
                        ))}
                      </View>
                      <Small style={{ marginTop: 14 }}>Todos</Small>
                    </View>
                  ) : undefined
                }
                ListEmptyComponent={
                  <View style={{ alignItems: 'center', gap: 12, marginTop: 30 }}>
                    <T kind="mut" style={{ textAlign: 'center' }}>
                      No encontramos “{query}”. Prueba con una palabra más simple o escanea el código de barras.
                    </T>
                    <Pill label="Escanear código" ghost onPress={() => setMode('codigo')} />
                  </View>
                }
                renderItem={({ item: f }) => (
                  <Tap onPress={() => pick(f, f.id.startsWith('off_') ? 'barcode' : 'manual')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: c.line }}>
                    <Em size={40}>{f.emoji}</Em>
                    <View style={{ flex: 1 }}>
                      <T kind="bold">{f.name}</T>
                      <Small>
                        {Math.round(f.kcal)} kcal · P {f.p} · C {f.c} · G {f.f} (por 100 g)
                      </Small>
                    </View>
                    <Text style={{ color: c.mut, fontSize: 20 }}>›</Text>
                  </Tap>
                )}
              />
            </>
          )}

          {mode === 'codigo' && <Barcode onFood={(f) => pick(f, 'barcode')} onSearch={() => setMode('buscar')} />}

          {mode === 'plato' && (
            <PlateScan
              foods={foods}
              slotLabel={plan[slot]?.label ?? 'mi día'}
              targets={targets}
              goal={profile.goal}
              eaten={eaten}
              onSearch={() => setMode('buscar')}
              onRegister={(items) => {
                useApp.getState().addLogs(items.map((i) => ({ ...i, slot, via: 'scan' as const })));
                useUi.getState().confetti();
                useUi.getState().showToast(`Plato registrado en ${plan[slot]?.label ?? 'tu día'} ✓`);
                router.back();
              }}
            />
          )}
        </>
      )}
    </View>
  );
}

/** Lee un código de barras y trae el producto de Open Food Facts (se guarda como alimento propio). */
function Barcode({ onFood, onSearch }: { onFood: (f: Food) => void; onSearch: () => void }) {
  const { c } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<'scan' | 'loading' | { error: string }>('scan');

  const busy = useRef(false); // la cámara dispara el mismo código varias veces seguidas
  const lookup = async (code: string) => {
    if (busy.current) return;
    busy.current = true;
    try {
      await fetchFood(code);
    } finally {
      busy.current = false;
    }
  };
  const fetchFood = async (code: string) => {
    const cached = useApp.getState().customFoods[offId(code)];
    if (cached) return onFood(cached);
    setState('loading');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), OFF_TIMEOUT);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_es,generic_name,brands,nutriments`, {
        headers: { 'User-Agent': 'FitCoach/0.1 (Android)' },
        signal: ctrl.signal,
      });
      // 404 = el producto no existe en Open Food Facts; otro error = el servicio falló.
      if (!res.ok && res.status !== 404) return setState({ error: 'Open Food Facts no responde ahora. Inténtalo en un momento o búscalo por nombre.' });
      const food = res.ok ? foodFromOff(code, (await res.json()).product) : null;
      if (!food) return setState({ error: 'No encontramos ese producto o no tiene datos nutricionales. Búscalo por nombre.' });
      useApp.getState().addFood(food);
      setState('scan');
      onFood(food);
    } catch {
      setState({ error: ctrl.signal.aborted ? 'La consulta tardó demasiado. Revisa tu conexión e inténtalo de nuevo.' : 'No hay conexión. Revisa tu internet e inténtalo de nuevo.' });
    } finally {
      clearTimeout(timer);
    }
  };

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <T kind="mut" style={{ textAlign: 'center' }}>
          {permission.canAskAgain ? 'Necesitamos la cámara para leer el código de barras.' : 'La cámara está bloqueada para FitCoach. Actívala en los ajustes del teléfono para leer códigos.'}
        </T>
        <Pill label={permission.canAskAgain ? 'Permitir cámara' : 'Abrir ajustes'} onPress={permission.canAskAgain ? requestPermission : () => Linking.openSettings()} />
        <Pill label="Buscar por nombre" ghost onPress={onSearch} />
      </View>
    );
  }
  return (
    <View style={{ flex: 1, gap: 12 }}>
      <View style={{ height: 300, borderRadius: radius.card, overflow: 'hidden', backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }}>
        {state === 'scan' ? (
          <CameraView
            style={{ width: '100%', height: '100%' }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
            onBarcodeScanned={({ data }) => lookup(data)}
          />
        ) : state === 'loading' ? (
          <ActivityIndicator color={c.acc} size="large" />
        ) : (
          <View style={{ padding: 20, alignItems: 'center', gap: 12 }}>
            <T style={{ textAlign: 'center' }}>{state.error}</T>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pill label="Escanear otro" onPress={() => setState('scan')} />
              <Pill label="Buscar por nombre" ghost onPress={onSearch} />
            </View>
          </View>
        )}
      </View>
      <Small style={{ textAlign: 'center' }}>Apunta al código de barras del empaque. Datos de Open Food Facts.</Small>
    </View>
  );
}
