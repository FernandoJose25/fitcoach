import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'FitCoach',
  slug: 'fitcoach',
  // Cuenta Expo dueña del proyecto EAS. Para usar la otra cuenta hay que cambiar owner y projectId a la vez
  // (y conservar el mismo keystore); ver las reglas de cuentas en la memoria del usuario.
  owner: 'ferrrrr23',
  version: '0.12.0',
  runtimeVersion: { policy: 'appVersion' },
  scheme: 'fitcoach',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  android: {
    package: 'com.fitcoach.app',
    // Súbelo en cada build que vaya a Play o se instale encima de otro (EAS no admite autoIncrement con app.config.ts).
    versionCode: 4,
    // Aviso puntual del fin del descanso; sin este permiso Android puede retrasar la notificación hasta ~1 min.
    // REQUEST_INSTALL_PACKAGES: la app descarga e instala su propia actualización (ver src/lib/updater.ts).
    permissions: ['android.permission.SCHEDULE_EXACT_ALARM', 'android.permission.REQUEST_INSTALL_PACKAGES'],
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
      backgroundColor: '#0B0F14',
    },
  },
  ios: { supportsTablet: false, bundleIdentifier: 'com.fitcoach.app' },
  plugins: [
    'expo-router',
    'expo-font',
    ['expo-splash-screen', { image: './assets/splash-icon.png', resizeMode: 'contain', backgroundColor: '#0B0F14' }],
    'expo-notifications',
    ['expo-camera', { cameraPermission: 'FitCoach usa la cámara para leer códigos de barras y analizar tu plato.', recordAudioAndroid: false }],
    // Galería para analizar una foto de comida que ya tomaste (Android 13+ usa el selector de fotos, sin permiso).
    ['expo-image-picker', { photosPermission: 'FitCoach abre tu galería para analizar la foto de un plato.', cameraPermission: false, microphonePermission: false }],
  ],
  experiments: { typedRoutes: true },
  extra: { eas: { projectId: 'b17cddb9-2d31-44b1-8eb8-5a2944e130df' } },
};

export default config;
