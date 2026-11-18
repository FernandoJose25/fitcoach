import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, FlatList, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FOODS, frequentFoodIds, searchFoods, type Food } from '@fitcoach/core';
import { Chip } from '@/components/Chip';
import { ConsequenceCard } from '@/components/Consequence';
import { Icon, type IconName } from '@/components/Icon';
import { PlateScan } from '@/components/PlateScan';
import { Tap } from '@/components/Tap';
import { BigButton, Em, Eyebrow, H, Num, Small, T } from '@/components/ui';
import { BarcodeScan } from '@/components/log/BarcodeScan';
import { CreateFood } from '@/components/log/CreateFood';
import { FoodDetail, sourceLabel } from '@/components/log/FoodDetail';
import { AI_ERRORS, estimateByName, searchProducts } from '@/lib/foodApi';
import { fmt } from '@/lib/format';
import { sum, useConsequence, useDayPlan, useFoods, useTodayLogs } from '@/lib/usePlan';
import { useApp, type Via } from '@/store/useApp';
import { useUi } from '@/store/useUi';
import { alpha, fonts, radius, useTheme } from '@/theme';

type Screen = { kind: 'home' } | { kind: 'detail'; food: Food; via: Via } | { kind: 'photo' } | { kind: 'barcode' } | { kind: 'create'; name?: string; barcode?: string };
type CartItem = { food: Food; grams: number; via: Via };
type Row =
  | { t: 'h'; key: string; label: string }
  | { t: 'food'; key: string; food: Food }
  | { t: 'act'; key: string; icon: IconName; title: string; sub: string; onPress: () => void; busy?: boolean }
  | { t: 'note'; key: string; text: string }
  | { t: 'loading'; key: string };

const TITLES: Record<Screen['kind'], string> = { home: 'Registrar', detail: 'Registrar', photo: 'Foto del plato', barcode: 'Código de barras', create: 'Crear alimento' };
const viaOf = (f: Food): Via => (f.src === 'off' || f.id.startsWith('bc_') ? 'barcode' : 'manual');
const quickGrams = (f: Food) => f.serving?.g ?? 100;

/**
 * Registrar comida. Tres vías grandes (foto del plato, código de barras, escribir) y una búsqueda que
 * junta la base de FitCoach, tus alimentos, productos de marca (Open Food Facts) y, si no aparece,
 * la estimación con IA o crearlo a mano. Varios alimentos se juntan en un plato y se registran juntos.
 */
export default function Scan() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ slot?: string; mode?: string }>();
  const profile = useApp((s) => s.profile)!;
  const targets = useApp((s) => s.targets)!;
  const allLogs = useApp((s) => s.logs);
  const customFoods = useApp((s) => s.customFoods);
  const { plan } = useDayPlan();
  const logs = useTodayLogs();
  const foods = useFoods();
  const { showToast, confetti } = useUi.getState();

  const [screen, setScreen] = useState<Screen>(() => (params.mode === 'foto' ? { kind: 'photo' } : params.mode === 'codigo' ? { kind: 'barcode' } : { kind: 'home' }));
  const [slot, setSlot] = useState(() => {
    if (params.slot !== undefined) return Number(params.slot);
    const next = plan.findIndex((_, i) => !logs.some((l) => l.slot === i));
    return next >= 0 ? next : plan.length - 1;
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState<{ q: string; foods: Food[]; loading: boolean }>({ q: '', foods: [], loading: false });
  const [ai, setAi] = useState<{ busy: boolean; msg: string | null }>({ busy: false, msg: null });
  const slotLabel = plan[slot]?.label ?? 'mi día';
  const home = () => setScreen({ kind: 'home' });

  // Atrás del sistema: de una subpantalla vuelve a la lista en vez de cerrar el registro.
  useEffect(() => {
    if (screen.kind === 'home') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      home();
      return true;
    });
    return () => sub.remove();
  }, [screen.kind]);

  // Productos de marca: se buscan al dejar de escribir (Open Food Facts limita las búsquedas por minuto).
  useEffect(() => {
    const q = query.trim();
    setAi({ busy: false, msg: null });
    if (q.length < 3) return setBrand({ q: '', foods: [], loading: false });
    setBrand((b) => ({ ...b, loading: true }));
    let live = true;
    const timer = setTimeout(async () => {
      const found = await searchProducts(q);
      if (live) setBrand({ q, foods: found, loading: false });
    }, 600);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query]);

  /** Los alimentos de fuera (marca, IA) se guardan al usarlos: así los registros y los totales los encuentran. */
  const ensure = useCallback((f: Food) => {
    if (!FOODS[f.id] && !useApp.getState().customFoods[f.id]) useApp.getState().addFood(f);
  }, []);
  const open = useCallback(
    (f: Food) => {
      ensure(f);
      setScreen({ kind: 'detail', food: f, via: viaOf(f) });
    },
    [ensure],
  );
  const addToCart = useCallback(
    (items: CartItem[]) => {
      items.forEach((i) => ensure(i.food));
      setCart((x) => [...x, ...items]);
      setScreen({ kind: 'home' });
      showToast(items.length === 1 ? `${items[0].food.name} al plato` : `${items.length} alimentos al plato`);
    },
    [ensure, showToast],
  );
  const register = (items: CartItem[]) => {
    items.forEach((i) => ensure(i.food));
    useApp.getState().addLogs(items.map((i) => ({ foodId: i.food.id, grams: i.grams, slot, via: i.via })));
    confetti();
    showToast(items.length === 1 ? `${items[0].grams} g de ${items[0].food.name.toLowerCase()} ✓` : `${items.length} alimentos en ${slotLabel} ✓`);
    router.back();
  };
  const close = () => {
    if (screen.kind !== 'home') return home();
    if (!cart.length) return router.back();
    Alert.alert('¿Descartar el plato?', 'Los alimentos que sumaste aún no se registran.', [
      { text: 'Seguir', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => router.back() },
    ]);
  };
  const estimate = async () => {
    setAi({ busy: true, msg: null });
    const r = await estimateByName(query.trim());
    if ('error' in r) return setAi({ busy: false, msg: AI_ERRORS[r.error] ?? AI_ERRORS.provider });
    if (!r.food) return setAi({ busy: false, msg: `La IA no reconoció “${query.trim()}” como comida. Prueba con otro nombre o créalo.` });
    setAi({ busy: false, msg: null });
    setScreen({ kind: 'detail', food: r.food, via: 'manual' });
  };

  const cartItems = useMemo(() => cart.map((i) => ({ foodId: i.food.id, grams: i.grams })), [cart]);
  const rows = useRows({ query, foods, customFoods, allLogs, brand, ai, estimate, setScreen });

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Tap
            onPress={close}
            accessibilityLabel={screen.kind === 'home' ? 'Cerrar' : 'Volver'}
            style={{ width: 44, height: 44, borderRadius: radius.btn, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name={screen.kind === 'home' ? 'close' : 'back'} size={20} color={c.ink} />
          </Tap>
          <H size={20} style={{ flex: 1 }}>
            {TITLES[screen.kind]}
          </H>
        </View>
        {screen.kind !== 'create' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 12 }} contentContainerStyle={{ gap: 8, paddingVertical: 2, paddingHorizontal: 2 }}>
            {plan.map((m, i) => (
              <Chip key={i} small label={`${m.label}${logs.some((l) => l.slot === i) ? ' ✓' : ''}`} on={slot === i} onPress={() => setSlot(i)} />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {screen.kind === 'detail' && (
          <FoodDetail
            key={screen.food.id}
            food={screen.food}
            slot={slot}
            slotLabel={slotLabel}
            cart={cartItems}
            onAdd={(grams) => addToCart([{ food: screen.food, grams, via: screen.via }])}
            onRegister={(grams) => register([{ food: screen.food, grams, via: screen.via }])}
          />
        )}
        {screen.kind === 'photo' && (
          <PlateScan
            foods={foods}
            slot={slot}
            slotLabel={slotLabel}
            targets={targets}
            goal={profile.goal}
            eaten={sum([...logs, ...cartItems])}
            cart={cartItems}
            onSearch={home}
            onRegister={(items) => register([...cart, ...items.map((i) => ({ ...i, via: 'scan' as const }))])}
          />
        )}
        {screen.kind === 'barcode' && <BarcodeScan onFood={open} onCreate={(code) => setScreen({ kind: 'create', barcode: code })} onSearch={home} />}
        {screen.kind === 'create' && <CreateFood initialName={screen.name} barcode={screen.barcode} onSaved={(f) => setScreen({ kind: 'detail', food: f, via: screen.barcode ? 'barcode' : 'manual' })} />}
        {screen.kind === 'home' && (
          <>
            {!query && <Budget cart={cartItems} />}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radius.btn, paddingHorizontal: 14, marginBottom: 12 }}>
              <Icon name="search" size={18} color={c.mut} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Busca o escribe lo que comiste"
                placeholderTextColor={c.mut}
                accessibilityLabel="Buscar alimento"
                autoCorrect={false}
                returnKeyType="search"
                style={{ flex: 1, paddingVertical: 13, color: c.ink, fontFamily: fonts.body, fontSize: 16 }}
              />
              {!!query && (
                <Tap haptic={false} onPress={() => setQuery('')} accessibilityLabel="Borrar búsqueda" style={{ padding: 4 }}>
                  <Icon name="close" size={16} color={c.mut} />
                </Tap>
              )}
            </View>
            <FlatList
              data={rows}
              keyExtractor={(r) => r.key}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
              ListHeaderComponent={
                query ? undefined : (
                  <>
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                      <Method icon="camera" title="Foto del plato" sub="La IA lo reconoce" onPress={() => setScreen({ kind: 'photo' })} accent />
                      <Method icon="barcode" title="Código" sub="Productos envasados" onPress={() => setScreen({ kind: 'barcode' })} />
                      <Method icon="edit" title="Crear" sub="Con sus valores" onPress={() => setScreen({ kind: 'create' })} />
                    </View>
                    <Suggestion slot={slot} label={slotLabel} onAdd={(items) => addToCart(items)} />
                  </>
                )
              }
              renderItem={({ item: r }) =>
                r.t === 'h' ? (
                  <Eyebrow style={{ marginTop: 14, marginBottom: 4 }}>{r.label}</Eyebrow>
                ) : r.t === 'food' ? (
                  <FoodRow food={r.food} onOpen={open} onQuick={(f) => addToCart([{ food: f, grams: quickGrams(f), via: viaOf(f) }])} />
                ) : r.t === 'act' ? (
                  <ActionRow icon={r.icon} title={r.title} sub={r.sub} onPress={r.onPress} busy={r.busy} />
                ) : r.t === 'loading' ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}>
                    <ActivityIndicator color={c.mut} />
                    <Small>Buscando productos de marca…</Small>
                  </View>
                ) : (
                  <Small style={{ paddingVertical: 8, lineHeight: 17 }}>{r.text}</Small>
                )
              }
            />
          </>
        )}
      </View>

      {cart.length > 0 && screen.kind !== 'detail' && screen.kind !== 'photo' && screen.kind !== 'create' && (
        <Cart cart={cart} slot={slot} slotLabel={slotLabel} onRemove={(i) => setCart((x) => x.filter((_, j) => j !== i))} onRegister={() => register(cart)} />
      )}
    </View>
  );
}

/** Filas de la lista: sin búsqueda, recientes y tus alimentos; con búsqueda, resultados locales, de marca y salidas. */
function useRows({
  query,
  foods,
  customFoods,
  allLogs,
  brand,
  ai,
  estimate,
  setScreen,
}: {
  query: string;
  foods: Record<string, Food>;
  customFoods: Record<string, Food>;
  allLogs: Record<string, { foodId: string }[]>;
  brand: { q: string; foods: Food[]; loading: boolean };
  ai: { busy: boolean; msg: string | null };
  estimate: () => void;
  setScreen: (s: Screen) => void;
}): Row[] {
  return useMemo(() => {
    const q = query.trim();
    const out: Row[] = [];
    if (!q) {
      const recent = frequentFoodIds(allLogs, 12).flatMap((id) => (foods[id] ? [foods[id]] : []));
      if (recent.length) out.push({ t: 'h', key: 'h-rec', label: 'Recientes' }, ...recent.map((f) => ({ t: 'food' as const, key: `r-${f.id}`, food: f })));
      const mine = Object.values(customFoods)
        .filter((f) => !f.id.startsWith('off_'))
        .reverse()
        .slice(0, 15);
      if (mine.length) out.push({ t: 'h', key: 'h-mine', label: 'Mis alimentos' }, ...mine.map((f) => ({ t: 'food' as const, key: `m-${f.id}`, food: f })));
      if (!recent.length && !mine.length) out.push({ t: 'note', key: 'n-empty', text: 'Busca cualquier comida, escanea un producto o toma una foto de tu plato. Lo que registres aparecerá aquí para repetirlo con un toque.' });
      return out;
    }
    const local = searchFoods(foods, q).slice(0, 25);
    if (local.length) out.push({ t: 'h', key: 'h-loc', label: 'En FitCoach' }, ...local.map((f) => ({ t: 'food' as const, key: `l-${f.id}`, food: f })));
    const seen = new Set(local.map((f) => f.id));
    const branded = brand.q === q ? brand.foods.filter((f) => !seen.has(f.id)) : [];
    const more: Row[] = [
      { t: 'h', key: 'h-more', label: local.length ? '¿No es ninguno?' : `No está en FitCoach: “${q}”` },
      { t: 'act', key: 'a-ai', icon: 'spark', title: `Estimar “${q}” con IA`, sub: 'Calorías y macros de cualquier plato o bebida', onPress: estimate, busy: ai.busy },
      ...(ai.msg ? [{ t: 'note' as const, key: 'n-ai', text: ai.msg }] : []),
      { t: 'act', key: 'a-new', icon: 'edit', title: `Crear “${q}”`, sub: 'Con los valores de la etiqueta o una tabla', onPress: () => setScreen({ kind: 'create', name: q }) },
      { t: 'act', key: 'a-bc', icon: 'barcode', title: 'Escanear el código de barras', sub: 'Si es un producto envasado', onPress: () => setScreen({ kind: 'barcode' }) },
    ];
    // Sin resultados propios, las salidas (IA, crear) van primero; si hay, al final.
    if (!local.length) out.push(...more);
    if (branded.length) out.push({ t: 'h', key: 'h-off', label: 'Productos de marca' }, ...branded.map((f) => ({ t: 'food' as const, key: `o-${f.id}`, food: f })));
    if (brand.loading) out.push({ t: 'loading', key: 'loading' });
    if (local.length) out.push(...more);
    return out;
  }, [query, foods, customFoods, allLogs, brand, ai, estimate, setScreen]);
}

/** Lo que queda del día (con lo que ya está en el plato): kcal y macros. */
function Budget({ cart }: { cart: { foodId: string; grams: number }[] }) {
  const { c } = useTheme();
  const t = useApp((s) => s.targets)!;
  const logs = useTodayLogs();
  const e = sum([...logs, ...cart]);
  const left = Math.round(t.kcal - e.kcal);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radius.card, padding: 12, marginBottom: 12 }}>
      <View>
        <Eyebrow style={{ fontSize: 9.5 }}>{left < 0 ? 'De más hoy' : 'Te quedan hoy'}</Eyebrow>
        <Text style={{ fontFamily: fonts.titleX, fontSize: 30, color: left < 0 ? c.acc : c.ink }}>
          {fmt(Math.abs(left))}
          <Text style={{ fontFamily: fonts.num, fontSize: 12, color: c.mut }}> kcal</Text>
        </Text>
      </View>
      <View style={{ flex: 1, gap: 5 }}>
        {(
          [
            ['P', e.p, t.protein, c.p],
            ['C', e.c, t.carbs, c.c],
            ['G', e.f, t.fat, c.f],
          ] as const
        ).map(([k, v, max, color]) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Num style={{ fontSize: 10.5, width: 10, color: c.mut }}>{k}</Num>
            <View style={{ flex: 1, height: 4, backgroundColor: alpha(c.ink, 0.1) }}>
              <View style={{ width: `${Math.min(100, (v / Math.max(1, max)) * 100)}%`, height: '100%', backgroundColor: color }} />
            </View>
            <Num style={{ fontSize: 10.5, minWidth: 64, textAlign: 'right' }}>
              {Math.round(v)}/{max} g
            </Num>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Vía de registro: tarjeta grande con ícono (foto, código, crear). */
function Method({ icon, title, sub, onPress, accent }: { icon: IconName; title: string; sub: string; onPress: () => void; accent?: boolean }) {
  const { c } = useTheme();
  return (
    <Tap
      onPress={onPress}
      accessibilityLabel={`${title}. ${sub}`}
      style={{ flex: 1, minHeight: 96, padding: 12, borderRadius: radius.card, backgroundColor: accent ? c.acc : c.card, borderWidth: 1, borderColor: accent ? c.acc : c.line, justifyContent: 'space-between' }}
    >
      <Icon name={icon} size={24} color={accent ? c.on : c.ink} />
      <View>
        <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: accent ? c.on : c.ink }}>{title}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 11, color: accent ? alpha(c.on, 0.75) : c.mut }} numberOfLines={2}>
          {sub}
        </Text>
      </View>
    </Tap>
  );
}

/** La comida del plan para esta comida (con la compensación aplicada), para sumarla de un toque. */
function Suggestion({ slot, label, onAdd }: { slot: number; label: string; onAdd: (items: CartItem[]) => void }) {
  const { c } = useTheme();
  const { plan } = useDayPlan();
  const logs = useTodayLogs();
  const m = plan[slot];
  if (!m || logs.some((l) => l.slot === slot) || !m.items.length) return null;
  const s = sum(m.items);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.card, backgroundColor: c.hero, borderWidth: 1, borderColor: alpha(c.acc, 0.28), marginBottom: 4 }}>
      <View style={{ flex: 1 }}>
        <Eyebrow color={c.acc}>Tu plan para {label.toLowerCase()}</Eyebrow>
        <T kind="bold" style={{ marginTop: 2 }} numberOfLines={2}>
          {m.recipeName}
        </T>
        <Small>
          {Math.round(s.kcal)} kcal · P {Math.round(s.p)} · C {Math.round(s.c)} · G {Math.round(s.f)}
          {m.cut ? ` · −${m.cut} kcal por compensar` : ''}
        </Small>
      </View>
      <Tap
        onPress={() => onAdd(m.items.map((x) => ({ food: FOODS[x.foodId] ?? useApp.getState().customFoods[x.foodId], grams: x.grams, via: 'plan' as const })))}
        accessibilityLabel={`Añadir ${m.recipeName} al plato`}
        style={{ paddingHorizontal: 14, height: 44, borderRadius: radius.btn, backgroundColor: c.acc, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: c.on, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' }}>Añadir</Text>
      </Tap>
    </View>
  );
}

/** Fila de alimento: tocar abre el detalle; ＋ lo suma al plato con su porción (o 100 g). */
const FoodRow = memo(function FoodRow({ food, onOpen, onQuick }: { food: Food; onOpen: (f: Food) => void; onQuick: (f: Food) => void }) {
  const { c } = useTheme();
  const g = quickGrams(food);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.line }}>
      <Tap haptic={false} onPress={() => onOpen(food)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }} accessibilityHint="Ver porción y detalles">
        <Em size={42}>{food.emoji}</Em>
        <View style={{ flex: 1 }}>
          <T kind="bold" numberOfLines={2} style={{ fontSize: 14 }}>
            {food.name}
          </T>
          <Small numberOfLines={1}>
            {food.serving ? `${Math.round((food.kcal * food.serving.g) / 100)} kcal · ${food.serving.label}` : `${Math.round(food.kcal)} kcal · 100 g`}
            {food.src ? ` · ${sourceLabel(food).replace('Producto · ', '')}` : ''}
          </Small>
        </View>
      </Tap>
      <Tap
        onPress={() => onQuick(food)}
        accessibilityLabel={`Sumar ${g} gramos de ${food.name} al plato`}
        style={{ width: 40, height: 40, borderRadius: radius.btn, borderWidth: 1, borderColor: c.line, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name="plus" size={18} color={c.ink} />
      </Tap>
    </View>
  );
});

function ActionRow({ icon, title, sub, onPress, busy }: { icon: IconName; title: string; sub: string; onPress: () => void; busy?: boolean }) {
  const { c } = useTheme();
  return (
    <Tap disabled={busy} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.line }}>
      <View style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}>
        {busy ? <ActivityIndicator color={c.acc} /> : <Icon name={icon} size={20} color={icon === 'spark' ? c.acc : c.ink} />}
      </View>
      <View style={{ flex: 1 }}>
        <T kind="bold" style={{ fontSize: 14 }} numberOfLines={1}>
          {title}
        </T>
        <Small>{busy ? 'Calculando…' : sub}</Small>
      </View>
    </Tap>
  );
}

/** Plato en curso: lista corta, total, consecuencia y registrar todo junto. */
function Cart({ cart, slot, slotLabel, onRemove, onRegister }: { cart: CartItem[]; slot: number; slotLabel: string; onRemove: (i: number) => void; onRegister: () => void }) {
  const { c } = useTheme();
  const goal = useApp((s) => s.profile!.goal);
  const [open, setOpen] = useState(false);
  const items = useMemo(() => cart.map((i) => ({ foodId: i.food.id, grams: i.grams })), [cart]);
  const total = sum(items);
  const x = useConsequence(items, slot);
  return (
    <Animated.View entering={FadeIn.duration(200)} style={{ marginHorizontal: 12, padding: 12, borderRadius: radius.card, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, gap: 10 }}>
      <Tap haptic={false} onPress={() => setOpen((v) => !v)} accessibilityState={{ expanded: open }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ minWidth: 28, height: 28, borderRadius: 14, paddingHorizontal: 6, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: c.bg, fontFamily: fonts.numB, fontSize: 13 }}>{cart.length}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <T kind="bold" style={{ fontSize: 14 }}>
            Tu plato · {fmt(total.kcal)} kcal
          </T>
          <Small numberOfLines={1} style={x ? { color: c.acc } : undefined}>
            {x ? (x.excess > 0 ? `Te pasarías ${fmt(x.excess)} kcal · ver consecuencia` : 'Macros por encima · ver detalle') : `P ${Math.round(total.p)} · C ${Math.round(total.c)} · G ${Math.round(total.f)} g`}
          </Small>
        </View>
        <Text style={{ color: c.mut, fontSize: 20, transform: [{ rotate: open ? '-90deg' : '90deg' }] }}>›</Text>
      </Tap>
      {open && (
        <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
          {cart.map((i, j) => (
            <View key={`${i.food.id}-${j}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
              <Em size={30}>{i.food.emoji}</Em>
              <T style={{ flex: 1, fontSize: 13 }} numberOfLines={1}>
                {i.food.name}
              </T>
              <Num style={{ fontSize: 12 }}>{i.grams} g</Num>
              <Tap onPress={() => onRemove(j)} accessibilityLabel={`Quitar ${i.food.name}`} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="close" size={16} color={c.mut} />
              </Tap>
            </View>
          ))}
          {x && (
            <View style={{ marginTop: 8 }}>
              <ConsequenceCard x={x} goal={goal} />
            </View>
          )}
        </ScrollView>
      )}
      <BigButton label={`Registrar en ${slotLabel}`} onPress={onRegister} />
    </Animated.View>
  );
}
