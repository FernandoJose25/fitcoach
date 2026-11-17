import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { matchFood, searchFoods, totals, verdict, type Food, type Goal, type ScanItem, type Targets } from '@fitcoach/core';
import { Tap } from '@/components/Tap';
import { BigButton, Card, Em, H, Pill, Small, T } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { userId } from '@/lib/sync';
import { fonts, radius, useTheme } from '@/theme';

type Row = { name: string; food: Food | null; grams: number };
type State = { kind: 'camera' } | { kind: 'loading'; uri: string } | { kind: 'result'; uri: string; rows: Row[] } | { kind: 'error'; text: string };

const ERRORS: Record<string, string> = {
  limit: 'Llegaste al límite de 30 fotos de hoy. Mañana se renueva; mientras tanto, búscalo por nombre.',
  provider: 'El servicio de IA no respondió. Inténtalo de nuevo en un momento.',
  unauthorized: 'No pudimos iniciar tu sesión. Revisa tu internet e inténtalo de nuevo.',
};

/** Foto del plato → Edge Function `scan-food` (Groq) → alimentos de la base con gramos editables → veredicto. */
export function PlateScan({
  foods,
  slotLabel,
  targets,
  goal,
  eaten,
  onRegister,
}: {
  foods: Record<string, Food>;
  slotLabel: string;
  targets: Targets;
  goal: Goal;
  eaten: { kcal: number };
  onRegister: (items: { foodId: string; grams: number }[]) => void;
}) {
  const { c } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [state, setState] = useState<State>({ kind: 'camera' });
  const [replacing, setReplacing] = useState<number | null>(null);

  const shoot = async () => {
    if (!camera.current || !supabase) return;
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.8 });
      if (!photo) return;
      setState({ kind: 'loading', uri: photo.uri });
      const img = await ImageManipulator.manipulate(photo.uri).resize({ width: 1024 }).renderAsync();
      const { base64 } = await img.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
      await userId(); // asegura la sesión (anónima) para que la función acepte el JWT
      const { data, error } = await supabase.functions.invoke<{ items: ScanItem[] }>('scan-food', { body: { imageBase64: base64, mime: 'image/jpeg' } });
      if (error) {
        const code = error instanceof FunctionsHttpError ? ((await error.context.json().catch(() => ({}))) as { error?: string }).error : undefined;
        const status = error instanceof FunctionsHttpError ? (error.context as Response).status : 0;
        return setState({ kind: 'error', text: ERRORS[code ?? (status === 401 ? 'unauthorized' : '')] ?? 'No pudimos analizar la foto. Revisa tu internet e inténtalo de nuevo.' });
      }
      const items = data?.items ?? [];
      if (!items.length) return setState({ kind: 'error', text: 'No reconocimos comida en la foto. Prueba con más luz y el plato completo a la vista.' });
      setState({ kind: 'result', uri: photo.uri, rows: items.map((i) => ({ name: i.name, food: matchFood(foods, i.name), grams: i.grams })) });
    } catch {
      setState({ kind: 'error', text: 'No pudimos procesar la foto. Inténtalo de nuevo.' });
    }
  };

  if (!supabase) {
    return (
      <Center>
        <Text style={{ fontSize: 48 }}>📷</Text>
        <T kind="mut" style={{ textAlign: 'center' }}>
          La foto del plato necesita conexión con el servidor. Mientras tanto, busca el alimento por nombre.
        </T>
      </Center>
    );
  }
  if (!permission) return null;
  if (!permission.granted) {
    return (
      <Center>
        <Text style={{ fontSize: 48 }}>📷</Text>
        <T kind="mut" style={{ textAlign: 'center' }}>
          Necesitamos la cámara para analizar tu plato.
        </T>
        <Pill label="Permitir cámara" onPress={requestPermission} />
      </Center>
    );
  }

  if (state.kind === 'error') {
    return (
      <Center>
        <Text style={{ fontSize: 48 }}>🍽️</Text>
        <T style={{ textAlign: 'center' }}>{state.text}</T>
        <Pill label="Tomar otra foto" onPress={() => setState({ kind: 'camera' })} />
      </Center>
    );
  }

  if (state.kind === 'result') {
    const rows = state.rows;
    const setRows = (next: Row[]) => setState({ ...state, rows: next });
    const matched = rows.filter((r): r is Row & { food: Food } => !!r.food && r.grams > 0);
    const sum = totals(
      matched.map((r) => ({ foodId: r.food.id, grams: r.grams })),
      foods,
    );

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

    return (
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Card hero>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 6 }}>
            <Image source={{ uri: state.uri }} style={{ width: 64, height: 64, borderRadius: 10 }} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <H>Detectamos {rows.length === 1 ? '1 alimento' : `${rows.length} alimentos`}</H>
              <Small>Revisa los gramos: la IA los estima a ojo.</Small>
            </View>
          </View>
          {rows.map((r, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.line }}>
              <Tap haptic={false} onPress={() => setReplacing(i)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Em size={38}>{r.food?.emoji ?? '❓'}</Em>
                <View style={{ flex: 1 }}>
                  <T kind="bold" numberOfLines={1}>
                    {r.food?.name ?? r.name}
                  </T>
                  <Small numberOfLines={1} style={r.food ? undefined : { color: c.f }}>
                    {r.food ? `${Math.round((r.food.kcal * r.grams) / 100)} kcal · toca para cambiar` : 'No está en la base · toca para elegir'}
                  </Small>
                </View>
              </Tap>
              <Pill label="−" ghost style={{ width: 38, paddingVertical: 6 }} onPress={() => setRows(rows.map((x, j) => (j === i ? { ...x, grams: Math.max(0, x.grams - 10) } : x)))} />
              <Text style={{ color: c.ink, fontFamily: fonts.title, fontSize: 18, minWidth: 50, textAlign: 'center' }}>{r.grams} g</Text>
              <Pill label="＋" ghost style={{ width: 38, paddingVertical: 6 }} onPress={() => setRows(rows.map((x, j) => (j === i ? { ...x, grams: Math.min(2000, x.grams + 10) } : x)))} />
            </View>
          ))}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            {(
              [
                ['kcal', sum.kcal, c.ink],
                ['Proteína', sum.p, c.p],
                ['Carbos', sum.c, c.c],
                ['Grasas', sum.f, c.f],
              ] as const
            ).map(([label, v, color]) => (
              <View key={label} style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontFamily: fonts.title, fontSize: 21, color }}>{Math.round(v)}</Text>
                <Small>{label}</Small>
              </View>
            ))}
          </View>
        </Card>
        {matched.length > 0 && (
          <Card>
            <T>{verdict({ kcal: sum.kcal, p: sum.p }, eaten, targets, goal).text}</T>
          </Card>
        )}
        <BigButton
          label={`Registrar en ${slotLabel}`}
          disabled={!matched.length}
          onPress={() => onRegister(matched.map((r) => ({ foodId: r.food.id, grams: r.grams })))}
        />
        <Pill label="Solo consultar · otra foto" ghost style={{ marginTop: 10, paddingVertical: 13 }} onPress={() => setState({ kind: 'camera' })} />
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, gap: 12 }}>
      <View style={{ flex: 1, maxHeight: 420, borderRadius: radius.card, overflow: 'hidden', backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }}>
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
      <BigButton label="📸  Tomar foto" disabled={state.kind === 'loading'} onPress={shoot} />
      <Small style={{ textAlign: 'center' }}>Encuadra el plato completo desde arriba y con buena luz. Máximo 30 fotos al día.</Small>
    </View>
  );
}

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
