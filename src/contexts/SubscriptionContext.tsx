import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { PurchasesPackage, PurchasesOffering } from 'react-native-purchases';
import { revenueCatService } from '../services/revenuecat';
import { useAuth } from './AuthContext';
import { PlanType, PLAN_FEATURES, PlanFeatures } from '../constants/subscriptions';

interface Offerings {
  plus: PurchasesOffering | null;
  premium: PurchasesOffering | null;
}

interface SubscriptionContextType {
  // État
  isLoading: boolean;
  currentPlan: PlanType;
  features: PlanFeatures;
  expirationDate: Date | null;
  offerings: Offerings;

  // Vérifications
  isPremium: boolean;
  isPlus: boolean;
  hasSubscription: boolean;

  // Actions
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<PlanType>('free');
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [offerings, setOfferings] = useState<Offerings>({ plus: null, premium: null });

  // Initialisation
  useEffect(() => {
    initializeRevenueCat();
  }, []);

  // Login/Logout avec l'utilisateur
  useEffect(() => {
    if (user) {
      loginToRevenueCat(user.id);
    } else {
      logoutFromRevenueCat();
    }
  }, [user]);

  const initializeRevenueCat = async () => {
    try {
      await revenueCatService.initialize();
      if (revenueCatService.available) {
        await loadOfferings();
      }
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
    } finally {
      // Toujours marquer comme non-loading après l'init
      setIsLoading(false);
    }
  };

  const loginToRevenueCat = async (userId: string) => {
    if (!revenueCatService.available) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      await revenueCatService.login(userId);
      await refreshSubscription();
    } catch (error) {
      console.error('Failed to login to RevenueCat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logoutFromRevenueCat = async () => {
    if (!revenueCatService.available) {
      setCurrentPlan('free');
      setExpirationDate(null);
      return;
    }
    try {
      await revenueCatService.logout();
      setCurrentPlan('free');
      setExpirationDate(null);
    } catch (error) {
      console.error('Failed to logout from RevenueCat:', error);
    }
  };

  const loadOfferings = async () => {
    if (!revenueCatService.available) {
      return;
    }
    try {
      const allOfferings = await revenueCatService.getOfferings();
      setOfferings(allOfferings);
    } catch (error) {
      console.error('Failed to load offerings:', error);
    }
  };

  const refreshSubscription = async () => {
    if (!revenueCatService.available) {
      return;
    }
    try {
      const plan = await revenueCatService.getCurrentPlan();
      setCurrentPlan(plan);

      const expDate = await revenueCatService.getExpirationDate();
      setExpirationDate(expDate);
    } catch (error) {
      console.error('Failed to refresh subscription:', error);
    }
  };

  const purchasePackage = async (pkg: PurchasesPackage): Promise<boolean> => {
    if (!revenueCatService.available) {
      Alert.alert(
        'Non disponible',
        'Les achats ne sont pas disponibles dans Expo Go. Utilisez un build de développement.'
      );
      return false;
    }
    setIsLoading(true);
    try {
      await revenueCatService.purchasePackage(pkg);
      await refreshSubscription();
      return true;
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert(
          'Erreur',
          'Une erreur est survenue lors de l\'achat. Veuillez réessayer.'
        );
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    if (!revenueCatService.available) {
      Alert.alert(
        'Non disponible',
        'La restauration n\'est pas disponible dans Expo Go. Utilisez un build de développement.'
      );
      return false;
    }
    setIsLoading(true);
    try {
      await revenueCatService.restorePurchases();
      await refreshSubscription();

      const hasActive = await revenueCatService.hasActiveSubscription();
      if (hasActive) {
        Alert.alert('Succès', 'Vos achats ont été restaurés !');
        return true;
      } else {
        Alert.alert('Info', 'Aucun achat à restaurer.');
        return false;
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de restaurer les achats.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Computed values
  const isPremium = currentPlan === 'premium';
  const isPlus = currentPlan === 'plus' || currentPlan === 'premium';
  const hasSubscription = currentPlan !== 'free';
  const features = PLAN_FEATURES[currentPlan];

  return (
    <SubscriptionContext.Provider
      value={{
        isLoading,
        currentPlan,
        features,
        expirationDate,
        offerings,
        isPremium,
        isPlus,
        hasSubscription,
        purchasePackage,
        restorePurchases,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

// Hook pour vérifier une feature spécifique
export const useFeature = (feature: keyof PlanFeatures) => {
  const { features } = useSubscription();
  return features[feature];
};

// Hook pour vérifier si l'utilisateur peut effectuer une action
export const useCanPerformAction = (action: 'sendInvitation' | 'superLike' | 'boost' | 'seeWhoLiked') => {
  const { features } = useSubscription();

  switch (action) {
    case 'sendInvitation':
      return features.invitationsPerDay !== 0;
    case 'superLike':
      return features.superLikesPerDay > 0;
    case 'boost':
      return features.boostsPerWeek > 0;
    case 'seeWhoLiked':
      return features.seeWhoLikedYou;
    default:
      return false;
  }
};
