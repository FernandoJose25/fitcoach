import { Text, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tap } from '@/components/Tap';
import { alpha, fonts, spring, useTheme } from '@/theme';

const TABS: Record<string, { icon: string; label: string }> = {
  index: { icon: '🏠', label: 'Hoy' },
  plan: { icon: '🍱', label: 'Plan' },
  entreno: { icon: '🏋️', label: 'Entreno' },
  aprende: { icon: '📚', label: 'Aprende' },
};

function TabButton({ name, on, onPress }: { name: string; on: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const s = useSharedValue(1);
  useEffect(() => {
    s.value = withSpring(on ? 1.2 : 1, spring);
  }, [on, s]);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }, { translateY: on ? -3 : 0 }] }));
  const t = TABS[name];
  return (
    <Tap haptic={false} onPress={onPress} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, height: '100%' }}>
      <Animated.Text style={[{ fontSize: 20 }, a]}>{t.icon}</Animated.Text>
      <Text style={{ fontSize: 11, color: on ? c.ink : c.mut, fontFamily: on ? fonts.bold : fonts.med }}>{t.label}</Text>
    </Tap>
  );
}

/** Subconjunto estable de las props de la barra (varía entre versiones de react-navigation). */
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation?: { navigate: (name: string) => void };
  navigateToTab?: (routeKey: string) => void;
}

function TabBar({ state, navigation, navigateToTab }: TabBarProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const routes = state.routes.filter((r) => TABS[r.name]);
  const go = (r: { key: string; name: string }) => (navigateToTab ? navigateToTab(r.key) : navigation?.navigate(r.name));
  const render = (names: string[]) =>
    routes.filter((r) => names.includes(r.name)).map((r) => <TabButton key={r.key} name={r.name} on={state.routes[state.index]?.name === r.name} onPress={() => go(r)} />);
  return (
    <View
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: insets.bottom + 12,
        height: 68,
        borderRadius: 26,
        backgroundColor: c.card,
        borderWidth: 1,
        borderColor: c.line,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      }}
    >
      {render(['index', 'plan'])}
      <View style={{ width: 78, alignItems: 'center' }}>
        <Tap
          onPress={() => router.push('/scan')}
          style={{
            width: 62,
            height: 62,
            borderRadius: 31,
            marginTop: -28,
            backgroundColor: c.acc,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: c.acc,
            shadowOpacity: 0.45,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 8 },
            elevation: 6,
            borderWidth: 4,
            borderColor: alpha(c.bg, 0.6),
          }}
        >
          <Text style={{ fontSize: 30, color: c.on, fontFamily: fonts.bold, lineHeight: 34 }}>＋</Text>
        </Tap>
      </View>
      {render(['entreno', 'aprende'])}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }} tabBar={(p) => <TabBar {...(p as unknown as TabBarProps)} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="plan" />
      <Tabs.Screen name="entreno" />
      <Tabs.Screen name="aprende" />
    </Tabs>
  );
}
