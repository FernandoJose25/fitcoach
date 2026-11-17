import { useRef, useState } from 'react';
import { Alert, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { Directory, File, Paths } from 'expo-file-system';
import { weightTrend } from '@fitcoach/core';
import { LineChart } from '@/components/LineChart';
import { Tap } from '@/components/Tap';
import { BigButton, Card, Eyebrow, H, Num, Pill, Screen, Small, T } from '@/components/ui';
import { fmtKg, fmtRate, weightPoints, weightProjection } from '@/lib/weight';
import { todayKey, useApp, type Measures } from '@/store/useApp';
import { useUi } from '@/store/useUi';
import { alpha, fonts, radius, useTheme } from '@/theme';

const FIELDS: { key: keyof Measures; label: string }[] = [
  { key: 'waist', label: 'Cintura' },
  { key: 'chest', label: 'Pecho' },
  { key: 'arm', label: 'Brazo' },
  { key: 'hip', label: 'Cadera' },
  { key: 'thigh', label: 'Muslo' },
];
const short = (d: string) => `${Number(d.slice(8))}/${Number(d.slice(5, 7))}`;
const cm = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1)).replace('.', ',');

/** Progreso corporal: peso con tendencia y proyección, medidas y fotos con comparador. */
export default function Progreso() {
  const { c } = useTheme();
  const router = useRouter();
  const [camera, setCamera] = useState(false);
  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 }}>
      <Tap onPress={() => router.back()} accessibilityLabel="Volver" style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: c.ink, fontSize: 18 }}>‹</Text>
      </Tap>
      <View style={{ flex: 1 }}>
        <Eyebrow>Tu cuerpo</Eyebrow>
        <H size={20}>Progreso</H>
      </View>
    </View>
  );
  if (camera) return <PhotoCamera onClose={() => setCamera(false)} />;
  return (
    <Screen header={header}>
      <WeightSection />
      <MeasuresSection />
      <PhotosSection onShoot={() => setCamera(true)} />
    </Screen>
  );
}

function WeightSection() {
  const { c } = useTheme();
  const weights = useApp((s) => s.weights);
  const t = useApp((s) => s.targets)!;
  const days = Object.keys(weights).sort();
  const trend = weightTrend(weights, todayKey());
  const pts = weightPoints(weights, 16);
  const proj = weightProjection(weights, t.weeklyKg, 4);
  return (
    <Card>
      <Eyebrow>Peso</Eyebrow>
      {days.length ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 4 }}>
            <Text style={{ color: c.ink, fontFamily: fonts.titleX, fontSize: 38 }}>{fmtKg(weights[days[days.length - 1]])}</Text>
            <Small style={{ marginBottom: 8 }}>kg</Small>
            <View style={{ flex: 1 }} />
            <View style={{ alignItems: 'flex-end', marginBottom: 6 }}>
              <Num style={{ fontSize: 13 }}>{days.length > 1 ? `${fmtKg(+(weights[days[days.length - 1]] - weights[days[0]]).toFixed(1))} kg desde ${short(days[0])}` : 'Primer registro'}</Num>
              {trend && <Small style={{ fontSize: 11 }}>Tendencia {fmtRate(trend.kgPerWeek)} · plan {fmtRate(t.weeklyKg)}</Small>}
            </View>
          </View>
          {pts.length >= 2 ? (
            <>
              <LineChart points={pts} projection={proj} height={170} unit="kg" />
              {/* Dos series (real y proyección): leyenda presente. */}
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                <Legend color={c.acc} label="Tu peso" />
                <Legend color={c.mut} label="Proyección del plan (4 semanas)" dashed />
              </View>
            </>
          ) : (
            <Small style={{ marginTop: 6 }}>Con dos pesajes verás tu curva. Regístrate una vez por semana, en ayunas.</Small>
          )}
          <View style={{ marginTop: 12 }}>
            {days
              .slice(-5)
              .reverse()
              .map((d, i) => (
                <View key={d} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
                  <Small>{short(d)}</Small>
                  <Num style={{ fontSize: 13 }}>{fmtKg(weights[d])} kg</Num>
                </View>
              ))}
          </View>
        </>
      ) : (
        <Small style={{ marginTop: 6 }}>Aún no hay pesajes. Regístralo desde Hoy.</Small>
      )}
    </Card>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 16, height: 0, borderTopWidth: 2, borderColor: color, borderStyle: dashed ? 'dashed' : 'solid' }} />
      <Text style={{ color: c.mut, fontFamily: fonts.body, fontSize: 11.5 }}>{label}</Text>
    </View>
  );
}

function MeasuresSection() {
  const { c } = useTheme();
  const measures = useApp((s) => s.measures);
  const days = Object.keys(measures).sort();
  const lastOf = (k: keyof Measures) => [...days].reverse().map((d) => measures[d][k]).find((v) => v !== undefined);
  const firstOf = (k: keyof Measures) => days.map((d) => ({ d, v: measures[d][k] })).find((x) => x.v !== undefined);
  const [draft, setDraft] = useState<Measures | null>(null);
  const start = () => setDraft(Object.fromEntries(FIELDS.map((f) => [f.key, lastOf(f.key) ?? DEFAULTS[f.key]])) as Measures);
  const btn = { width: 38, height: 38, borderRadius: radius.btn, backgroundColor: c.bg, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' } as const;
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Eyebrow>Medidas (cm)</Eyebrow>
        {days.length > 0 && <Small>Última: {short(days[days.length - 1])}</Small>}
      </View>
      {draft ? (
        <Animated.View entering={FadeIn.duration(200)} style={{ marginTop: 8, gap: 8 }}>
          {FIELDS.map((f) => (
            <View key={f.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <T style={{ flex: 1 }}>{f.label}</T>
              <Tap onPress={() => setDraft({ ...draft, [f.key]: Math.max(10, (draft[f.key] ?? 0) - 0.5) })} style={btn} accessibilityLabel={`Restar a ${f.label}`}>
                <Text style={{ color: c.ink, fontFamily: fonts.bold, fontSize: 16 }}>−</Text>
              </Tap>
              <Num style={{ width: 52, textAlign: 'center', fontSize: 15 }}>{cm(draft[f.key] ?? 0)}</Num>
              <Tap onPress={() => setDraft({ ...draft, [f.key]: (draft[f.key] ?? 0) + 0.5 })} style={btn} accessibilityLabel={`Sumar a ${f.label}`}>
                <Text style={{ color: c.ink, fontFamily: fonts.bold, fontSize: 16 }}>＋</Text>
              </Tap>
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Pill
              label="Guardar medidas de hoy"
              onPress={() => {
                useApp.getState().setMeasures(draft);
                setDraft(null);
                useUi.getState().showToast('Medidas guardadas ✓');
              }}
              style={{ flex: 1, paddingVertical: 13 }}
            />
            <Pill label="Cancelar" ghost onPress={() => setDraft(null)} style={{ paddingVertical: 13 }} />
          </View>
          <Small>Mide con cinta flexible, a la misma hora y sin apretar. Cintura: a la altura del ombligo.</Small>
        </Animated.View>
      ) : (
        <>
          {days.length > 0 &&
            FIELDS.map((f, i) => {
              const last = lastOf(f.key);
              const first = firstOf(f.key);
              if (last === undefined) return null;
              const diff = first && first.d !== days[days.length - 1] ? +(last - (first.v ?? last)).toFixed(1) : null;
              return (
                <View key={f.key} style={{ flexDirection: 'row', alignItems: 'baseline', paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
                  <T style={{ flex: 1 }}>{f.label}</T>
                  {diff !== null && diff !== 0 && (
                    <Small style={{ marginRight: 10 }}>
                      {diff > 0 ? '+' : '−'}
                      {cm(Math.abs(diff))} desde {short(first!.d)}
                    </Small>
                  )}
                  <Num style={{ fontSize: 14 }}>{cm(last)}</Num>
                </View>
              );
            })}
          <Pill label={days.length ? 'Registrar medidas' : 'Registrar mis primeras medidas'} ghost={days.length > 0} onPress={start} style={{ marginTop: 10, paddingVertical: 12 }} />
        </>
      )}
    </Card>
  );
}

const DEFAULTS: Required<Measures> = { waist: 80, chest: 95, arm: 32, hip: 95, thigh: 55 };

function PhotosSection({ onShoot }: { onShoot: () => void }) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const photos = useApp((s) => s.photos);
  const [compare, setCompare] = useState(false);
  const size = (width - 40 - 32 - 16) / 3;
  const remove = (uri: string) =>
    Alert.alert('¿Borrar esta foto?', 'Se elimina del teléfono.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: () => {
          try {
            new File(uri).delete();
          } catch {
            // ya no existía: igual se quita de la lista
          }
          useApp.getState().removePhoto(uri);
        },
      },
    ]);
  const first = photos[0];
  const last = photos[photos.length - 1];
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Eyebrow>Fotos de progreso</Eyebrow>
        {photos.length >= 2 && (
          <Tap haptic={false} onPress={() => setCompare((v) => !v)}>
            <Small style={{ color: c.ink, fontFamily: fonts.bold }}>{compare ? 'Ver todas' : 'Comparar'}</Small>
          </Tap>
        )}
      </View>
      {compare && first && last ? (
        <Animated.View entering={FadeIn.duration(200)} style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          {[first, last].map((p, i) => (
            <View key={p.uri} style={{ flex: 1 }}>
              <Image source={{ uri: p.uri }} contentFit="cover" style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: radius.btn, backgroundColor: c.bg }} />
              <Small style={{ textAlign: 'center', marginTop: 4 }}>
                {i ? 'Ahora' : 'Inicio'} · {short(p.date)}
              </Small>
            </View>
          ))}
        </Animated.View>
      ) : photos.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {[...photos].reverse().map((p) => (
            <Tap key={p.uri} haptic={false} onLongPress={() => remove(p.uri)} accessibilityLabel={`Foto del ${short(p.date)}. Mantén presionado para borrar`}>
              <Image source={{ uri: p.uri }} contentFit="cover" style={{ width: size, height: size * 1.33, borderRadius: radius.btn, backgroundColor: c.bg }} />
              <Text style={{ position: 'absolute', left: 6, bottom: 6, color: '#FFFFFF', fontFamily: fonts.numB, fontSize: 10, backgroundColor: alpha('#000000', 0.5), paddingHorizontal: 4, borderRadius: 3 }}>{short(p.date)}</Text>
            </Tap>
          ))}
        </View>
      ) : (
        <Small style={{ marginTop: 6 }}>Una foto cada 2–4 semanas, misma luz, misma pose y misma distancia: los cambios se ven mejor que en la báscula. Se guardan solo en tu teléfono.</Small>
      )}
      <Pill label="Tomar foto" onPress={onShoot} style={{ marginTop: 12, paddingVertical: 13 }} />
    </Card>
  );
}

/** Cámara a pantalla completa (frontal por defecto, para fotos de espejo o con temporizador mental). */
function PhotoCamera({ onClose }: { onClose: () => void }) {
  const { c } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [busy, setBusy] = useState(false);
  const cam = useRef<CameraView>(null);

  const shoot = async () => {
    if (!cam.current || busy) return;
    setBusy(true);
    try {
      const photo = await cam.current.takePictureAsync({ quality: 0.8 });
      if (!photo) return;
      // Copia al almacenamiento de documentos: la caché de la cámara la puede borrar el sistema.
      const dir = new Directory(Paths.document, 'progreso');
      dir.create({ idempotent: true, intermediates: true });
      const dest = new File(dir, `${todayKey()}-${Date.now()}.jpg`);
      await new File(photo.uri).copy(dest);
      useApp.getState().addPhoto({ date: todayKey(), uri: dest.uri });
      useUi.getState().showToast('Foto guardada ✓');
      onClose();
    } catch {
      useUi.getState().showToast('No se pudo guardar la foto');
    } finally {
      setBusy(false);
    }
  };

  if (!permission?.granted)
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 }}>
        <H style={{ textAlign: 'center' }}>Necesitamos la cámara</H>
        <Small style={{ textAlign: 'center' }}>Las fotos de progreso se guardan solo en tu teléfono.</Small>
        <BigButton label="Permitir cámara" onPress={requestPermission} style={{ alignSelf: 'stretch' }} />
        <Pill label="Cancelar" ghost onPress={onClose} />
      </View>
    );
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <CameraView ref={cam} style={{ flex: 1 }} facing={facing} />
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pill label="Cancelar" ghost onPress={onClose} />
        <Tap onPress={shoot} accessibilityLabel="Tomar foto" style={{ width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.5 : 1 }}>
          <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: c.acc }} />
        </Tap>
        <Pill label="Girar" ghost onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))} />
      </View>
    </View>
  );
}
