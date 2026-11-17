import { Text, View, useColorScheme } from 'react-native';
import { computeTargets, type Profile } from '@fitcoach/core';
import { palette } from '@/theme';

// F0: pantalla de humo que prueba que el core corre en el teléfono. F2 la reemplaza por Welcome.
const demo: Profile = {
  name: 'Demo',
  sex: 'male',
  age: 25,
  weightKg: 70,
  heightCm: 175,
  goal: 'gain',
  pace: 'moderate',
  activity: 'active',
  level: 'intermediate',
  where: 'gym',
  daysPerWeek: 4,
  mealsPerDay: 4,
  allergies: [],
  avoid: [],
};

export default function Index() {
  const c = palette[useColorScheme() === 'light' ? 'light' : 'dark'];
  const t = computeTargets(demo);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg, gap: 8 }}>
      <Text style={{ color: c.acc, fontSize: 32, fontWeight: '800' }}>FitCoach</Text>
      <Text style={{ color: c.mut }}>Tu entrenador y nutricionista, gratis.</Text>
      <Text style={{ color: c.ink, marginTop: 16 }}>
        Demo core: {t.kcal} kcal · {t.protein} g proteína · mantenimiento {t.tdee}
      </Text>
    </View>
  );
}
