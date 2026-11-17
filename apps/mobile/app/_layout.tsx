import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, BarlowCondensed_600SemiBold, BarlowCondensed_700Bold, BarlowCondensed_800ExtraBold } from '@expo-google-fonts/barlow-condensed';
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { IBMPlexMono_500Medium, IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Overlay } from '@/components/Overlay';
import { syncReminders } from '@/lib/notify';
import { useSync } from '@/lib/sync';
import { useApp } from '@/store/useApp';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Error inesperado al dibujar una pantalla: en vez de cerrar la app, explica y deja reintentar.
 * Los datos viven en el teléfono (AsyncStorage), así que no se pierde nada. Sin fuentes propias ni
 * safe area: puede mostrarse antes de que carguen.
 */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const { c } = useTheme();
  SplashScreen.hideAsync().catch(() => {});
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 }}>
      <Text style={{ color: c.ink, fontSize: 22, fontWeight: '700', textAlign: 'center' }}>Algo salió mal</Text>
      <Text style={{ color: c.mut, fontSize: 15, textAlign: 'center', lineHeight: 21 }}>Tus datos están a salvo en el teléfono. Vuelve a intentarlo; si se repite, cierra y abre la app.</Text>
      <Pressable
        onPress={retry}
        accessibilityRole="button"
        style={{ marginTop: 8, minHeight: 48, paddingHorizontal: 28, borderRadius: 10, backgroundColor: c.acc, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: c.on, fontSize: 16, fontWeight: '700' }}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const { c, scheme } = useTheme();
  const hydrated = useApp((s) => s.hydrated);
  const [fontsLoaded] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });
  const ready = fontsLoaded && hydrated;
  useSync();
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  // Si cambian los días de entreno o las comidas del perfil, los recordatorios activos se reprograman.
  const days = useApp((s) => s.profile?.daysPerWeek);
  const meals = useApp((s) => s.profile?.mealsPerDay);
  useEffect(() => {
    const r = useApp.getState().reminders;
    if (hydrated && days && meals && (r.meals || r.water || r.workout || r.weigh)) syncReminders(r, days, meals);
  }, [hydrated, days, meals]);
  if (!ready) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: c.bg }}>
      <SafeAreaProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="onboarding/[step]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="scan" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="perfil" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="progreso" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="workout" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }} />
        </Stack>
        <Overlay />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
