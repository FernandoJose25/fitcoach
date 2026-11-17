import { Redirect } from 'expo-router';
import { useApp } from '@/store/useApp';

export default function Index() {
  const hasProfile = useApp((s) => !!s.profile);
  return <Redirect href={hasProfile ? '/(tabs)' : '/welcome'} />;
}
