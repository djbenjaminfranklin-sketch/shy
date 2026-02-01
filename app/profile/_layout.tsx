import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function ProfileLayout() {
  const screenOptions = {
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: '600' as const },
    headerShadowVisible: false,
    headerBackTitle: 'Retour',
  };

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="[userId]" options={{ title: 'Profil' }} />
      <Stack.Screen name="edit" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="privacy" options={{ headerShown: false }} />
      <Stack.Screen name="blocked-users" options={{ headerShown: false }} />
      <Stack.Screen name="delete-account" options={{ headerShown: false }} />
      <Stack.Screen name="subscription" options={{ headerShown: false }} />
      <Stack.Screen name="auto-reply" options={{ headerShown: false }} />
    </Stack>
  );
}
