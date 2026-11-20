import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { FOODS, dayNumber, shoppingList, type ShopItem } from '@fitcoach/core';
import { Icon } from '@/components/Icon';
import { Tap } from '@/components/Tap';
import { Card, Eyebrow, H, Num, Pill, Screen, Small, T } from '@/components/ui';
import { useWeekPlans } from '@/lib/usePlan';
import { todayKey, useApp } from '@/store/useApp';
import { fonts, useTheme } from '@/theme';

const DAY = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtDay = (d: Date) => DAY.format(d).replace(/[.,]/g, '');

/**
 * Lista de compras de los próximos 7 días: suma los menús reales de esos días (cambia cuando rota el menú),
 * agrupada por sección del mercado. Lo marcado como comprado vale una semana.
 */
export default function Compras() {
  const { c } = useTheme();
  const router = useRouter();
  const days = useWeekPlans();
  const shopDone = useApp((s) => s.shopDone);
  const { toggleShop, clearShop } = useApp.getState();
  const sections = useMemo(() => shoppingList(days, FOODS), [days]);
  const today = dayNumber(todayKey());
  const done = (id: string) => !!shopDone[id] && today - dayNumber(shopDone[id]) < 7;
  const items = sections.flatMap((s) => s.items);
  const marked = items.filter((x) => done(x.id)).length;
  const end = new Date();
  end.setDate(end.getDate() + 6);

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
        <Eyebrow>Próximos 7 días</Eyebrow>
        <H size={20}>Lista de compras</H>
      </View>
    </View>
  );

  return (
    <Screen header={header}>
      <Card hero>
        <H>
          {fmtDay(new Date())} – {fmtDay(end)}
        </H>
        <Small style={{ marginTop: 4 }}>
          Sale de tus menús de estos 7 días: cambia cuando rota el menú o cambias una receta. Granos y menestras van en
          peso seco.
        </Small>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: c.line, marginTop: 12, overflow: 'hidden' }}>
          <View
            style={{ width: `${items.length ? (marked / items.length) * 100 : 0}%`, height: 6, backgroundColor: c.acc }}
          />
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 8,
            minHeight: 36,
          }}
        >
          <T style={{ fontSize: 13 }}>
            {marked} de {items.length} comprados
          </T>
          {marked > 0 && <Pill label="Desmarcar todo" ghost onPress={clearShop} />}
        </View>
      </Card>

      {sections.map((s) => (
        <Card key={s.aisle}>
          <Eyebrow>
            {s.label} · {s.items.length}
          </Eyebrow>
          {s.items.map((x, i) => (
            <Row key={x.id} x={x} first={i === 0} done={done(x.id)} onPress={() => toggleShop(x.id)} />
          ))}
        </Card>
      ))}
    </Screen>
  );
}

function Row({ x, first, done, onPress }: { x: ShopItem; first: boolean; done: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Tap
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={`${x.name}, ${x.qty}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        marginTop: first ? 6 : 0,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: c.line,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: done ? 0 : 1.5,
          borderColor: c.mut,
          backgroundColor: done ? c.acc : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {done && <Icon name="check" size={14} stroke={2.5} color={c.on} />}
      </View>
      <Text style={{ fontSize: 18, opacity: done ? 0.45 : 1 }}>{x.emoji}</Text>
      <View style={{ flex: 1, opacity: done ? 0.45 : 1 }}>
        <Text
          style={{
            color: c.ink,
            fontFamily: fonts.body,
            fontSize: 14,
            textDecorationLine: done ? 'line-through' : 'none',
          }}
        >
          {x.name}
        </Text>
        {x.note && <Small>{x.note}</Small>}
      </View>
      <Num style={{ fontSize: 14, opacity: done ? 0.45 : 1 }}>{x.qty}</Num>
    </Tap>
  );
}
