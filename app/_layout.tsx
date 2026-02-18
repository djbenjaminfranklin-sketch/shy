import * as Sentry from '@sentry/react-native';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/contexts/AuthContext';
import { LocationProvider } from '../src/contexts/LocationContext';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import { SubscriptionProvider } from '../src/contexts/SubscriptionContext';
import { BoostProvider } from '../src/contexts/BoostContext';
import { IceBreakerProvider } from '../src/contexts/IceBreakerContext';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  sendDefaultPii: false,
});

function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <BoostProvider>
              <IceBreakerProvider>
                <LocationProvider>
                  <Slot />
                </LocationProvider>
              </IceBreakerProvider>
            </BoostProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
