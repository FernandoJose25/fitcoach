import { Modal, ScrollView, Text, View } from 'react-native';
import { dismissUpdate, installUpdate, openInstallPermission, useUpdater } from '@/lib/updater';
import { alpha, fonts, radius, useTheme } from '@/theme';
import { Icon } from './Icon';
import { Tap } from './Tap';
import { BigButton, Eyebrow, H, Small, T } from './ui';

/**
 * "Nueva versión disponible": aparece apenas la app detecta un APK más nuevo. Muestra la versión, las
 * novedades y el progreso de la descarga. Si la actualización es obligatoria no se puede cerrar.
 */
export function UpdateModal() {
  const { c } = useTheme();
  const { update, dismissed, downloading, progress, error } = useUpdater();
  const visible = !!update && dismissed !== update.version;
  if (!update) return null;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!downloading) dismissUpdate();
      }}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 420, backgroundColor: c.card, borderRadius: radius.card, borderWidth: 1, borderColor: c.line, padding: 20, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', top: 0, left: 0, width: 36, height: 3, backgroundColor: c.acc }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: radius.btn, backgroundColor: alpha(c.acc, 0.14), alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="spark" size={22} color={c.acc} />
            </View>
            <View style={{ flex: 1 }}>
              <Eyebrow color={c.acc}>Versión {update.version}{update.mandatory ? ' · obligatoria' : ''}</Eyebrow>
              <H size={19} style={{ marginTop: 2 }}>
                Nueva versión disponible
              </H>
            </View>
          </View>

          <ScrollView style={{ maxHeight: 220, marginTop: 14 }} showsVerticalScrollIndicator={false}>
            <T style={{ fontSize: 14, lineHeight: 21, color: c.mut }}>{update.changelog?.trim() || 'Trae mejoras y correcciones. Tus datos se mantienen.'}</T>
          </ScrollView>

          {downloading && (
            <View style={{ marginTop: 16 }}>
              <View style={{ height: 6, backgroundColor: alpha(c.ink, 0.1), overflow: 'hidden', borderRadius: 3 }}>
                <View style={{ width: `${progress}%`, height: '100%', backgroundColor: c.acc }} />
              </View>
              <Text style={{ color: c.mut, fontFamily: fonts.num, fontSize: 12, marginTop: 6, textAlign: 'center' }}>Descargando… {progress} %</Text>
            </View>
          )}

          {error && (
            <View style={{ marginTop: 14, gap: 6 }} accessibilityLiveRegion="polite">
              <Small style={{ color: c.acc }}>No se pudo instalar: {error}</Small>
              <Tap haptic={false} onPress={openInstallPermission}>
                <Small style={{ color: c.ink, fontFamily: fonts.bold, textDecorationLine: 'underline' }}>Permitir que FitCoach instale actualizaciones</Small>
              </Tap>
            </View>
          )}

          <BigButton label={downloading ? 'Descargando…' : error ? 'Reintentar' : 'Actualizar ahora'} disabled={downloading} onPress={installUpdate} style={{ marginTop: 18 }} />
          {!update.mandatory && !downloading && (
            <Tap haptic={false} onPress={dismissUpdate} style={{ alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 16, marginTop: 4 }}>
              <Small style={{ color: c.ink, fontFamily: fonts.bold }}>Ahora no</Small>
            </Tap>
          )}
        </View>
      </View>
    </Modal>
  );
}
