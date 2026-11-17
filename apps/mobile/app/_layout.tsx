import { useEffect } from 'react';
import { Stack } from 'expo-router';
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
