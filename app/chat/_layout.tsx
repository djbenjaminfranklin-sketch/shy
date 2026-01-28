import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function ChatLayout() {
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
      <Stack.Screen name="[conversationId]" options={{ title: 'Conversation' }} />
    </Stack>
  );
}
