import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { palette } from '@/theme';

export default function RootLayout() {
  const scheme = useColorScheme() === 'light' ? 'light' : 'dark';
  const c = palette[scheme];
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />
    </>
  );
}
