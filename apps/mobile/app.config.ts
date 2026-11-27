import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'FitCoach',
  slug: 'fitcoach',
  // Cuenta Expo dueña del proyecto EAS. Para usar la otra cuenta hay que cambiar owner y projectId a la vez
  // (y conservar el mismo keystore); ver las reglas de cuentas en la memoria del usuario. El keystore va como
  // credencial local (credentials.json, fuera de git), así que sirve igual en cualquiera de las dos cuentas.
  owner: 'developerfer123',
  version: '0.16.0',
  runtimeVersion: { policy: 'appVersion' },
  scheme: 'fitcoach',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  android: {
    package: 'com.fitcoach.app',
    // Súbelo en cada build que vaya a Play o se instale encima de otro (EAS no admite autoIncrement con app.config.ts).
    versionCode: 8,
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
    // cameraPermission NO puede ser false: el plugin pondría CAMERA como bloqueado en el manifiesto y Android
    // negaría la cámara a toda la app (escáner, foto del plato y fotos de progreso). Pasó en la 0.13.0.
    ['expo-image-picker', { photosPermission: 'FitCoach abre tu galería para analizar la foto de un plato.', cameraPermission: 'FitCoach usa la cámara para leer códigos de barras y analizar tu plato.', microphonePermission: false }],
  ],
  experiments: { typedRoutes: true },
  // Proyecto en developerfer123 desde la 0.16.0; el de ferrrrr23 era b17cddb9-2d31-44b1-8eb8-5a2944e130df.
  extra: { eas: { projectId: '2a4060fc-5b64-4b86-a8a9-6daefa1b72a0' } },
};

export default config;
