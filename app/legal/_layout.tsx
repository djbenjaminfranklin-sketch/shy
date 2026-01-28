import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function LegalLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' as const },
        headerShadowVisible: false,
        headerBackTitle: 'Retour',
      }}
    >
      <Stack.Screen name="terms" options={{ title: 'CGU' }} />
      <Stack.Screen name="privacy-policy" options={{ title: 'Confidentialité' }} />
      <Stack.Screen name="disclaimer" options={{ title: 'Mentions légales' }} />
    </Stack>
  );
}
