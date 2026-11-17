import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'FitCoach',
  slug: 'fitcoach',
  version: '0.1.0',
  scheme: 'fitcoach',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  android: {
    package: 'com.fitcoach.app',
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
    ['expo-camera', { cameraPermission: 'FitCoach usa la cámara para leer códigos de barras y analizar tu plato.', recordAudioAndroid: false }],
  ],
  experiments: { typedRoutes: true },
};

export default config;
