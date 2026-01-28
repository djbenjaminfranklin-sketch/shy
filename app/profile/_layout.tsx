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
      <Stack.Screen name="settings" options={{ title: 'Paramètres' }} />
      <Stack.Screen name="privacy" options={{ title: 'Confidentialité' }} />
      <Stack.Screen name="blocked-users" options={{ title: 'Utilisateurs bloqués' }} />
      <Stack.Screen name="delete-account" options={{ title: 'Supprimer le compte' }} />
      <Stack.Screen name="subscription" options={{ title: 'Abonnement' }} />
      <Stack.Screen name="auto-reply" options={{ title: 'Réponse automatique' }} />
    </Stack>
  );
}
