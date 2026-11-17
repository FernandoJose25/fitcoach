import { Text, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/Icon';
import { Tap } from '@/components/Tap';
import { easeOut } from '@/components/ui';
import { fonts, useTheme } from '@/theme';

const TABS: Record<string, { icon: IconName; label: string }> = {
  index: { icon: 'today', label: 'Hoy' },
  plan: { icon: 'plan', label: 'Menú' },
  entreno: { icon: 'train', label: 'Entreno' },
  aprende: { icon: 'learn', label: 'Aprende' },
};

function TabButton({ name, on, onPress }: { name: string; on: boolean; onPress: () => void }) {
  const { c } = useTheme();
  // Indicador de señal: filete bermellón que crece sobre la pestaña activa.
  const w = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    w.value = withTiming(on ? 1 : 0, { duration: 220, easing: easeOut });
  }, [on, w]);
  const bar = useAnimatedStyle(() => ({ transform: [{ scaleX: w.value }], opacity: w.value }));
  const t = TABS[name];
  return (
    <Tap haptic={false} onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={t.label} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5, height: '100%' }}>
      <Animated.View style={[{ position: 'absolute', top: 0, width: 22, height: 2, backgroundColor: c.acc }, bar]} />
      <Icon name={t.icon} size={22} color={on ? c.ink : c.mut} />
      <Text style={{ fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase', color: on ? c.ink : c.mut, fontFamily: fonts.num }}>{t.label}</Text>
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
        bottom: insets.bottom + 10,
        height: 66,
        borderRadius: 16,
        backgroundColor: c.card,
        borderWidth: 1,
        borderColor: c.line,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      }}
    >
      {render(['index', 'plan'])}
      <View style={{ width: 78, alignItems: 'center' }}>
        <Tap
          onPress={() => router.push('/scan')}
          accessibilityLabel="Registrar comida"
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            backgroundColor: c.acc,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: c.acc,
            shadowOpacity: 0.35,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}
        >
          <Icon name="plus" size={24} stroke={2.25} color={c.on} />
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
