import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { parseBarcode, type Food } from '@fitcoach/core';
import { Pill, Small, T } from '@/components/ui';
import { lookupBarcode } from '@/lib/foodApi';
import { alpha, radius, useTheme } from '@/theme';

type State = { kind: 'scan' } | { kind: 'loading' } | { kind: 'missing'; code: string; name: string } | { kind: 'error'; text: string };

const ERRORS = {
  offline: 'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
  slow: 'La consulta tardó demasiado. Revisa tu conexión e inténtalo de nuevo.',
  service: 'Las bases de productos no responden ahora. Inténtalo en un momento o créalo con los datos del empaque.',
};

/**
 * Código de barras de cualquier producto envasado. Si no está en ninguna base, se lee la tabla nutricional
 * del empaque con una foto o se copia a mano (y queda para la próxima vez).
 */
export function BarcodeScan({ onFood, onCreate, onSearch }: { onFood: (f: Food) => void; onCreate: (code: string, name: string, photo: boolean) => void; onSearch: () => void }) {
  const { c } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<State>({ kind: 'scan' });
  const busy = useRef(false); // la cámara dispara el mismo código varias veces seguidas

  const lookup = async (raw: string) => {
    const code = parseBarcode(raw);
    if (!code || busy.current) return; // no es un código de producto (lote, lectura a medias): sigue leyendo
    busy.current = true;
    setState({ kind: 'loading' });
    try {
      const r = await lookupBarcode(code);
      if ('food' in r) {
        setState({ kind: 'scan' });
        onFood(r.food);
      } else if ('missing' in r) setState({ kind: 'missing', code, name: r.name });
      else setState({ kind: 'error', text: ERRORS[r.error] });
    } finally {
      busy.current = false;
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
      <View style={{ height: 320, borderRadius: radius.card, overflow: 'hidden', backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }}>
        {state.kind === 'scan' ? (
          <>
            <CameraView
              style={{ width: '100%', height: '100%' }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
              onBarcodeScanned={({ data }) => lookup(data)}
            />
            {/* Marco de lectura: guía dónde poner el código. */}
            <View pointerEvents="none" style={{ position: 'absolute', width: '78%', height: 120, borderWidth: 2, borderColor: alpha(c.ink, 0.85), borderRadius: radius.btn }} />
          </>
        ) : state.kind === 'loading' ? (
          <>
            <ActivityIndicator color={c.acc} size="large" />
            <T kind="bold" style={{ marginTop: 10 }}>
              Buscando el producto…
            </T>
          </>
        ) : state.kind === 'missing' ? (
          <View style={{ padding: 20, alignItems: 'center', gap: 12 }}>
            <T kind="bold" style={{ textAlign: 'center' }}>
              {state.name ? `Es “${state.name}”, pero no tenemos sus valores` : 'Aún nadie registró este producto'}
            </T>
            <T kind="mut" style={{ textAlign: 'center', fontSize: 14 }}>
              Toma una foto a la tabla nutricional del empaque y la leemos por ti. La próxima vez saldrá solo.
            </T>
            <Pill label="Foto de la tabla nutricional" onPress={() => onCreate(state.code, state.name, true)} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pill label="Escribir a mano" ghost onPress={() => onCreate(state.code, state.name, false)} />
              <Pill label="Escanear otro" ghost onPress={() => setState({ kind: 'scan' })} />
            </View>
            <Pill label="Buscar por nombre" ghost onPress={onSearch} />
          </View>
        ) : (
          <View style={{ padding: 20, alignItems: 'center', gap: 12 }}>
            <T style={{ textAlign: 'center' }}>{state.text}</T>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pill label="Escanear otro" onPress={() => setState({ kind: 'scan' })} />
              <Pill label="Buscar por nombre" ghost onPress={onSearch} />
            </View>
          </View>
        )}
      </View>
      <Small style={{ textAlign: 'center' }}>Apunta al código de barras de cualquier producto envasado: galletas, gaseosas, snacks, lácteos…</Small>
    </View>
  );
}
