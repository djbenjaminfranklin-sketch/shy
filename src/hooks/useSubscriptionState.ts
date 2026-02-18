import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { PurchasesPackage, PurchasesOffering, CustomerInfo } from 'react-native-purchases';
import Constants from 'expo-constants';
import { revenueCatService } from '../services/revenuecat';
import { PlanType, PLAN_FEATURES, PlanFeatures } from '../constants/subscriptions';
import {
  syncSubscriptionToSupabase,
  determinePlanFromCustomerInfo,
  extractPlanIdFromPackage,
} from '../utils/subscriptionSync';

// Detection d'Expo Go pour l'import conditionnel de Purchases
const isExpoGo = Constants.appOwnership === 'expo';
let Purchases: typeof import('react-native-purchases').default | null = null;

if (!isExpoGo) {
  try {
    Purchases = require('react-native-purchases').default;
  } catch {
    // RevenueCat module not available
  }
}

interface Offerings {
  plus: PurchasesOffering | null;
  premium: PurchasesOffering | null;
}

export interface SubscriptionStateReturn {
  isLoading: boolean;
  currentPlan: PlanType;
  features: PlanFeatures;
  expirationDate: Date | null;
  offerings: Offerings;
  isPremium: boolean;
  isPlus: boolean;
  hasSubscription: boolean;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
}

/**
 * Hook pour gerer l'etat d'abonnement, l'integration RevenueCat et les achats
 */
export function useSubscriptionState(userId: string | undefined): SubscriptionStateReturn {
  const customerInfoListenerRef = useRef<((info: CustomerInfo) => void) | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<PlanType>('free');
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [offerings, setOfferings] = useState<Offerings>({ plus: null, premium: null });

  const syncToSupabase = useCallback(async (customerInfo: CustomerInfo, planId?: string) => {
    if (!userId) return;
    await syncSubscriptionToSupabase(userId, customerInfo, planId);
  }, [userId]);

  const setupCustomerInfoListener = useCallback(() => {
    if (!Purchases || !revenueCatService.available) return;

    if (customerInfoListenerRef.current) {
      Purchases.removeCustomerInfoUpdateListener(customerInfoListenerRef.current);
      customerInfoListenerRef.current = null;
    }

    const listener = (info: CustomerInfo) => {
      setCurrentPlan(determinePlanFromCustomerInfo(info));

      const activeEntitlements = Object.values(info.entitlements.active);
      if (activeEntitlements.length > 0) {
        const expDate = activeEntitlements[0].expirationDate;
        setExpirationDate(expDate ? new Date(expDate) : null);
      } else {
        setExpirationDate(null);
      }

      syncToSupabase(info).catch(() => {
        // Failed to sync subscription from listener
      });
    };

    customerInfoListenerRef.current = listener;
    Purchases.addCustomerInfoUpdateListener(listener);
  }, [syncToSupabase]);

  const loadOfferings = useCallback(async () => {
    if (!revenueCatService.available) return;
    try {
      const allOfferings = await revenueCatService.getOfferings();
      setOfferings(allOfferings);
    } catch (error) {
      // Failed to load offerings
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (!revenueCatService.available) return;
    try {
      const plan = await revenueCatService.getCurrentPlan();
      setCurrentPlan(plan);
      const expDate = await revenueCatService.getExpirationDate();
      setExpirationDate(expDate);
      const customerInfo = await revenueCatService.getCustomerInfo();
      if (customerInfo) {
        await syncToSupabase(customerInfo);
      }
    } catch (error) {
      // Failed to refresh subscription
    }
  }, [syncToSupabase]);

  const initializeRevenueCat = useCallback(async () => {
    try {
      await revenueCatService.initialize();
      if (revenueCatService.available) {
        await loadOfferings();
        setupCustomerInfoListener();
      }
    } catch (error) {
      // Failed to initialize RevenueCat
    } finally {
      setIsLoading(false);
    }
  }, [loadOfferings, setupCustomerInfoListener]);

  const loginToRevenueCat = useCallback(async (loginUserId: string) => {
    if (!revenueCatService.available) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      await revenueCatService.login(loginUserId);
      await refreshSubscription();
    } catch (error) {
      // Failed to login to RevenueCat
    } finally {
      setIsLoading(false);
    }
  }, [refreshSubscription]);

  const logoutFromRevenueCat = useCallback(async () => {
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
      // Failed to logout from RevenueCat
    }
  }, []);

  // Initialisation
  useEffect(() => {
    initializeRevenueCat();
    return () => {
      if (Purchases && customerInfoListenerRef.current) {
        Purchases.removeCustomerInfoUpdateListener(customerInfoListenerRef.current);
        customerInfoListenerRef.current = null;
      }
    };
  }, []);

  // Login/Logout avec l'utilisateur
  useEffect(() => {
    if (userId) {
      loginToRevenueCat(userId);
    } else {
      logoutFromRevenueCat();
    }
  }, [userId]);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    if (!revenueCatService.available) {
      Alert.alert(
        'Non disponible',
        'Les achats ne sont pas disponibles dans Expo Go. Utilisez un build de developpement.'
      );
      return false;
    }
    setIsLoading(true);
    try {
      const customerInfo = await revenueCatService.purchasePackage(pkg);
      if (customerInfo && userId) {
        const planId = extractPlanIdFromPackage(pkg.identifier);
        await syncToSupabase(customerInfo, planId);
      }
      await refreshSubscription();
      return true;
    } catch (error: unknown) {
      const purchaseError = error as { userCancelled?: boolean };
      if (!purchaseError.userCancelled) {
        Alert.alert('Erreur', 'Une erreur est survenue lors de l\'achat. Veuillez reessayer.');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, syncToSupabase, refreshSubscription]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!revenueCatService.available) {
      Alert.alert(
        'Non disponible',
        'La restauration n\'est pas disponible dans Expo Go. Utilisez un build de developpement.'
      );
      return false;
    }
    setIsLoading(true);
    try {
      const customerInfo = await revenueCatService.restorePurchases();
      if (customerInfo && userId) {
        await syncToSupabase(customerInfo);
      }
      await refreshSubscription();
      const hasActive = await revenueCatService.hasActiveSubscription();
      if (hasActive) {
        Alert.alert('Succes', 'Vos achats ont ete restaures !');
        return true;
      } else {
        Alert.alert('Info', 'Aucun achat a restaurer.');
        return false;
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de restaurer les achats.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, syncToSupabase, refreshSubscription]);

  // Computed values
  const isPremium = currentPlan === 'premium';
  const isPlus = currentPlan === 'plus' || currentPlan === 'premium';
  const hasSubscription = currentPlan !== 'free';
  const features = PLAN_FEATURES[currentPlan];

  return {
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
  };
}

export default useSubscriptionState;
