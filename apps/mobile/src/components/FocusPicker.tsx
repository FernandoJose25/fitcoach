import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { FOCUS_MUSCLES, FOCUS_OPTIONS, MAX_FOCUS, type Focus } from '@fitcoach/core';
import { Icon } from '@/components/Icon';
import { MuscleMap } from '@/components/MuscleMap';
import { Tap } from '@/components/Tap';
import { Small, T } from '@/components/ui';
import { FOCUS_IMAGE } from '@/lib/refImages';
import { alpha, fonts, radius, useTheme } from '@/theme';

/**
 * Zona prioritaria: cuerpo con las zonas elegidas resaltadas, "equilibrado" y una tarjeta por zona: foto de
 * referencia (son de hombres) o, para mujeres, el cuerpo femenino con la zona resaltada. Hasta dos zonas:
 * elegir una tercera reemplaza a la más antigua.
 */
export function FocusPicker({ value, onChange, sex }: { value: Focus[]; onChange: (v: Focus[]) => void; sex?: 'male' | 'female' }) {
  const { c } = useTheme();
  const toggle = (f: Focus) => onChange(value.includes(f) ? value.filter((x) => x !== f) : [...value, f].slice(-MAX_FOCUS));
  const balanced = value.length === 0;
  return (
    <View>
      <MuscleMap groups={value.flatMap((f) => FOCUS_MUSCLES[f])} height={150} sex={sex} style={{ marginBottom: 12 }} />
      <Tap
        onPress={() => onChange([])}
        accessibilityState={{ selected: balanced }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.btn, backgroundColor: balanced ? c.hero : c.card, borderWidth: 1, borderColor: balanced ? c.acc : c.line, marginBottom: 10 }}
      >
        <View style={{ flex: 1 }}>
          <T kind="bold">Todo el cuerpo por igual</T>
          <Small style={{ marginTop: 2, fontSize: 13 }}>Plan equilibrado, sin zona prioritaria</Small>
        </View>
        {balanced && <Icon name="check" size={20} stroke={2.25} color={c.acc} />}
      </Tap>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {FOCUS_OPTIONS.map((o) => {
          const on = value.includes(o.value);
          return (
            <Tap
              key={o.value}
              onPress={() => toggle(o.value)}
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${o.label}. ${o.desc}`}
              style={{ width: '48%', flexGrow: 1, borderRadius: radius.btn, overflow: 'hidden', backgroundColor: on ? c.hero : c.card, borderWidth: on ? 2 : 1, borderColor: on ? c.acc : c.line }}
            >
              {sex === 'female' ? (
                <View style={{ width: '100%', aspectRatio: 3 / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(c.ink, 0.04) }}>
                  <MuscleMap groups={FOCUS_MUSCLES[o.value]} height={92} sex="female" />
                </View>
              ) : (
                <Image source={FOCUS_IMAGE[o.value]} contentFit="cover" style={{ width: '100%', aspectRatio: 3 / 2 }} accessibilityIgnoresInvertColors />
              )}
              {on && (
                <View style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: c.acc, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={16} stroke={2.5} color={c.on} />
                </View>
              )}
              {on && (
                <View style={{ position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.chip, backgroundColor: alpha('#000000', 0.6) }}>
                  <Text style={{ color: '#FFFFFF', fontFamily: fonts.num, fontSize: 10, letterSpacing: 1 }}>PRIORIDAD {value.indexOf(o.value) + 1}</Text>
                </View>
              )}
              <View style={{ padding: 10 }}>
                <T kind="bold" style={{ fontSize: 14 }}>
                  {o.label}
                </T>
                <Small style={{ fontSize: 12 }} numberOfLines={2}>
                  {o.desc}
                </Small>
              </View>
            </Tap>
          );
        })}
      </View>
    </View>
  );
}
