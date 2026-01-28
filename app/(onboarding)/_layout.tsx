import { Stack } from 'expo-router';
import { OnboardingProvider } from '../../src/contexts/OnboardingContext';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack>
        <Stack.Screen name="profile-photo" options={{ headerShown: false }} />
        <Stack.Screen name="face-verification" options={{ headerShown: false }} />
        <Stack.Screen name="basic-info" options={{ headerShown: false }} />
        <Stack.Screen name="intention" options={{ headerShown: false }} />
        <Stack.Screen name="interests" options={{ headerShown: false }} />
        <Stack.Screen name="location-consent" options={{ headerShown: false }} />
      </Stack>
    </OnboardingProvider>
  );
}
