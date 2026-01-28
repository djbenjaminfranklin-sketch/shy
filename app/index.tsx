import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

export default function Index() {
  const { isAuthenticated, hasCompletedOnboarding, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/welcome');
    } else if (!hasCompletedOnboarding) {
      router.replace('/(onboarding)/profile-photo');
    } else {
      router.replace('/(tabs)/discover');
    }
  }, [isAuthenticated, hasCompletedOnboarding, isLoading, router]);

  // Afficher un écran vide pendant le chargement/redirection
  return null;
}
