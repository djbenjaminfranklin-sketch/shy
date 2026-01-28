import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/contexts/AuthContext';
import { LocationProvider } from '../src/contexts/LocationContext';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import { SubscriptionProvider } from '../src/contexts/SubscriptionContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <LocationProvider>
              <Slot />
            </LocationProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
