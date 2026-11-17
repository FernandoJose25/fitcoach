import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { FOODS, MINOR_NOTICE, PLACES, isMinor, learnFoods, macroRows, mealShares, weeksPerKg, type Food } from '@fitcoach/core';
import { Header } from '@/components/Header';
import { Tap } from '@/components/Tap';
import { Card, Eyebrow, H, Num, Screen, Small, T, easeOut } from '@/components/ui';
import { fmt } from '@/lib/format';
import { useApp } from '@/store/useApp';
import { alpha, fonts, useTheme } from '@/theme';

const dec = (n: number) => String(n).replace('.', ',');

/** Acordeón: un solo bloque abierto a la vez; el cuerpo entra con fade, sin rebote. */
function Section({ n, title, open, onToggle, children }: { n: number; title: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  const { c } = useTheme();
  const r = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    r.value = withTiming(open ? 1 : 0, { duration: 220, easing: easeOut });
  }, [open, r]);
  const chev = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value * 90}deg` }] }));
  return (
    <Card style={{ paddingVertical: 0 }}>
      <Tap onPress={onToggle} accessibilityState={{ expanded: open }} accessibilityLabel={title} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15 }}>
        <Eyebrow style={{ width: 20 }} color={open ? c.acc : c.mut}>
          {String(n).padStart(2, '0')}
        </Eyebrow>
        <H style={{ flex: 1 }}>{title}</H>
        <Animated.View style={chev}>
          <Text style={{ color: c.mut, fontSize: 20, lineHeight: 22 }}>›</Text>
        </Animated.View>
      </Tap>
      {open && (
        <Animated.View entering={FadeIn.duration(240)} style={{ paddingBottom: 16, gap: 12 }}>
          {children}
        </Animated.View>
      )}
    </Card>
  );
}

function P({ children }: { children: ReactNode }) {
  return <T style={{ fontSize: 14, lineHeight: 21 }}>{children}</T>;
}

function B({ children }: { children: ReactNode }) {
  return <T kind="bold" style={{ fontSize: 14 }}>{children}</T>;
}

/** Fila numerada (pilares, pasos). */
function Step({ i, title, children }: { i: number; title?: string; children: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Num style={{ color: c.mut, fontSize: 12, width: 20, marginTop: 2 }}>{String(i).padStart(2, '0')}</Num>
      <View style={{ flex: 1, gap: 2 }}>
        {title && <B>{title}</B>}
        <T kind="mut" style={{ fontSize: 13.5, lineHeight: 20 }}>
          {children}
        </T>
      </View>
    </View>
  );
}

/** Fila de dato: texto a la izquierda, cifra tabular a la derecha. */
function Row({ k, v, first, mark }: { k: string; v: string; first?: boolean; mark?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: first ? 0 : 1, borderTopColor: c.line }}>
      {mark && <View style={{ width: 6, height: 6, backgroundColor: mark }} />}
      <T style={{ flex: 1, fontSize: 13.5 }} numberOfLines={1}>
        {k}
      </T>
      <Num style={{ fontSize: 12.5 }}>{v}</Num>
    </View>
  );
}

function FoodList({ label, foods, value }: { label: string; foods: Food[]; value: (f: Food) => string }) {
  if (!foods.length) return null;
  return (
    <View>
      <Eyebrow style={{ marginBottom: 2 }}>{label}</Eyebrow>
      {foods.map((f, i) => (
        <Row key={f.id} first={i === 0} k={f.name} v={value(f)} />
      ))}
    </View>
  );
}

export default function Aprende() {
  const { c } = useTheme();
  const p = useApp((s) => s.profile)!;
  const t = useApp((s) => s.targets)!;
  const [open, setOpen] = useState(0);
  const lists = useMemo(() => learnFoods(p, FOODS), [p]);
  const toggle = (i: number) => () => setOpen((o) => (o === i ? -1 : i));

  const diff = Math.round(t.kcal - t.tdee);
  const place = PLACES.find((x) => x.value === p.where)?.label.toLowerCase() ?? '';
  const perMeal = Math.round(t.protein / p.mealsPerDay);
  const weeks = weeksPerKg(t);
  const exclusions = [...p.allergies, ...p.avoid];
  const macroInfo = {
    p: ['Proteína', c.p, 'Construye y repara el músculo. Es la que más importa para tu objetivo.'],
    c: ['Carbohidratos', c.c, 'La energía para entrenar con intensidad y recuperarte.'],
    f: ['Grasas', c.f, 'Necesarias para tus hormonas. Son las más densas: 9 kcal por gramo.'],
  } as const;
  const title1 = p.goal === 'gain' ? 'Cómo se gana músculo' : p.goal === 'lose' ? 'Cómo perder grasa sin perder músculo' : 'Cómo mejorar tu cuerpo sin cambiar de peso';
  const eat =
    p.goal === 'gain'
      ? `Comes ${fmt(diff)} kcal por encima de tu mantenimiento (${fmt(t.tdee)} kcal). Ese excedente es el material para construir, sin acumular mucha grasa.`
      : p.goal === 'lose'
        ? `Comes ${fmt(-diff)} kcal por debajo de tu mantenimiento (${fmt(t.tdee)} kcal): el cuerpo saca la diferencia de tu grasa. La proteína alta (${t.protein} g) y el entreno protegen tu músculo.`
        : `Comes lo que gastas (${fmt(t.kcal)} kcal). Con proteína alta y fuerza, ganas músculo y pierdes grasa poco a poco.`;
  const dense = [lists.fats.find((f) => ['mani', 'almendra', 'nuez', 'aceite'].includes(f.id))?.name, lists.carbs.find((f) => f.id === 'avena' || f.id === 'platano')?.name]
    .filter(Boolean)
    .join(' o ')
    .toLowerCase();

  return (
    <Screen header={<Header subtitle="Guía de nutrición" />}>
      <Card hero>
        <Eyebrow>Tus números</Eyebrow>
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          {[
            [fmt(t.kcal), 'kcal al día'],
            [`${t.protein} g`, 'proteína'],
            [`~${perMeal} g`, 'proteína por comida'],
          ].map(([v, l], i) => (
            <View key={l} style={{ flex: 1, paddingLeft: i ? 12 : 0, borderLeftWidth: i ? 1 : 0, borderLeftColor: alpha(c.ink, 0.12) }}>
              <Text style={{ color: c.ink, fontFamily: fonts.titleX, fontSize: 26 }}>{v}</Text>
              <Small>{l}</Small>
            </View>
          ))}
        </View>
        <Small style={{ marginTop: 10 }}>Todo lo de esta guía está calculado con tus datos.</Small>
      </Card>

      <Section n={1} title={title1} open={open === 0} onToggle={toggle(0)}>
        <Step i={1} title="Entrena con progresión">
          Tu programa: {p.daysPerWeek} días por semana en {place}. Cuando completas todas las series en el tope de repeticiones, la app te propone subir peso o repeticiones: esa subida gradual es la señal que hace crecer el músculo.
        </Step>
        <Step i={2} title="Come lo suficiente">
          {eat}
        </Step>
        <Step i={3} title="Descansa">
          Duerme 7 a 9 horas. El músculo se construye mientras descansas, no mientras entrenas; por eso tu programa deja días de descanso entre sesiones del mismo músculo.
        </Step>
      </Section>

      <Section n={2} title="Calorías y macros" open={open === 1} onToggle={toggle(1)}>
        <P>
          Las calorías son la energía de la comida. Tu meta es <B>{fmt(t.kcal)} kcal</B> al día; tu mantenimiento, lo que gastas sin cambiar de peso, es {fmt(t.tdee)} kcal.
        </P>
        <P>Esas calorías vienen de tres macronutrientes:</P>
        {macroRows(t).map((r) => {
          const [name, color, desc] = macroInfo[r.key];
          return (
            <View key={r.key} style={{ gap: 3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 6, height: 6, backgroundColor: color }} />
                <B>{name}</B>
                <Num style={{ marginLeft: 'auto', fontSize: 12.5 }}>
                  {r.grams} g × {r.kcalPerGram} = {fmt(r.kcal)} kcal · {r.pct} %
                </Num>
              </View>
              <Small style={{ fontSize: 12.5, lineHeight: 18 }}>{desc}</Small>
            </View>
          );
        })}
      </Section>

      <Section n={3} title="Qué comer" open={open === 2} onToggle={toggle(2)}>
        <FoodList label="Proteínas · más proteína por caloría" foods={lists.protein} value={(f) => `${dec(f.p)} g · ${fmt(f.kcal)} kcal`} />
        <FoodList label="Carbohidratos · tu energía" foods={lists.carbs} value={(f) => `${dec(f.c)} g · ${fmt(f.kcal)} kcal`} />
        <FoodList label="Grasas · en porciones pequeñas" foods={lists.fats} value={(f) => `${dec(f.f)} g · ${fmt(f.kcal)} kcal`} />
        <Small>
          Valores por 100 g: gramos del macro y calorías.
          {exclusions.length ? ` Sin ${exclusions.join(', ').toLowerCase()}, según tus alergias y preferencias.` : ''}
        </Small>
      </Section>

      <Section n={4} title="Cuándo y cómo repartir tu comida" open={open === 3} onToggle={toggle(3)}>
        <P>
          Repartes tus <B>{t.protein} g</B> de proteína en {p.mealsPerDay} comidas: unos {perMeal} g en promedio, más en las comidas grandes. Repartirla ayuda más que comerla toda de golpe.
        </P>
        <View>
          {mealShares(t, p.mealsPerDay).map((m, i) => (
            <Row key={m.label + i} first={i === 0} k={m.label} v={`${fmt(m.kcal)} kcal · ${m.protein} g prot`} />
          ))}
        </View>
        <Step i={1} title="Antes de entrenar (1 a 3 h)">
          Carbohidratos con algo de proteína y poca grasa, para tener energía sin sentirte pesado.
        </Step>
        <Step i={2} title="Después de entrenar">
          Una comida con proteína y carbohidratos en las siguientes horas. No hace falta correr: lo que más cuenta es el total del día.
        </Step>
      </Section>

      <Section n={5} title="Cómo usar el escáner antes de comer" open={open === 4} onToggle={toggle(4)}>
        <Step i={1}>Toca el botón + del centro y elige Plato.</Step>
        <Step i={2}>Toma la foto con el plato completo y buena luz.</Step>
        <Step i={3}>Revisa los alimentos y ajusta los gramos: la foto es aproximada (±20–30 %).</Step>
        <Step i={4}>Mira el veredicto: cómo queda tu día si lo comes.</Step>
        <Step i={5}>Elige «Solo consultar» si aún lo estás decidiendo, o regístralo en tu comida.</Step>
        <Small>Para productos envasados usa Código de barras: los datos salen de la etiqueta. El escáner de platos admite 30 fotos al día.</Small>
      </Section>

      <Section n={6} title="Preguntas frecuentes" open={open === 5} onToggle={toggle(5)}>
        <Step i={1} title="¿Tengo que pesar todo?">
          No. Pesa las primeras 2 o 3 semanas para entrenar el ojo; después basta con estimar y pesar de vez en cuando.
        </Step>
        {p.goal === 'lose' ? (
          <Step i={2} title="¿Y si un día me paso de mis calorías?">
            Un día no arruina nada. Vuelve a tu plan en la siguiente comida, sin compensar dejando de comer.
          </Step>
        ) : (
          <Step i={2} title="¿Y si no llego a mis calorías?">
            Un día no cambia nada: mira la semana. Si te cuesta comer tanto, agrega alimentos que dan mucha energía en poco volumen{dense ? ` (${dense})` : ''} o reparte en más comidas.
          </Step>
        )}
        <Step i={3} title="¿Cuánto tardaré?">
          {weeks
            ? `A tu ritmo estimado (${t.weeklyKg > 0 ? '+' : ''}${dec(t.weeklyKg)} kg por semana), cambiar 1 kg toma unas ${weeks} semanas. Es una estimación: pésate una vez por semana y la app te propondrá ajustar tus calorías si hace falta.`
            : 'Al mantener tu peso, los cambios se ven en el espejo y en tu fuerza más que en la balanza. Mide tu cintura y revisa tus récords cada mes.'}
        </Step>
        <Step i={4} title="¿Necesito suplementos?">
          No. La proteína en polvo es solo una forma cómoda de llegar a tu meta; la comida real basta.
        </Step>
        {isMinor(p.age) && <P>{MINOR_NOTICE}</P>}
      </Section>

      <Small style={{ textAlign: 'center', marginTop: 4 }}>Orientativo: no reemplaza a un nutricionista ni a un médico.</Small>
    </Screen>
  );
}
