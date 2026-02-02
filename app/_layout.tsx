import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/contexts/AuthContext';
import { LocationProvider } from '../src/contexts/LocationContext';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import { SubscriptionProvider } from '../src/contexts/SubscriptionContext';
import { BoostProvider } from '../src/contexts/BoostContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <BoostProvider>
              <LocationProvider>
                <Slot />
              </LocationProvider>
            </BoostProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
