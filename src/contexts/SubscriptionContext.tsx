import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Alert } from 'react-native';
import { PurchasesPackage, PurchasesOffering, CustomerInfo } from 'react-native-purchases';
import Constants from 'expo-constants';
import { revenueCatService, ENTITLEMENTS } from '../services/revenuecat';
import { useAuth } from './AuthContext';
import { PlanType, PLAN_FEATURES, PlanFeatures } from '../constants/subscriptions';
import { supabase } from '../services/supabase';

// Détection d'Expo Go pour l'import conditionnel de Purchases
const isExpoGo = Constants.appOwnership === 'expo';
let Purchases: typeof import('react-native-purchases').default | null = null;

if (!isExpoGo) {
  try {
    Purchases = require('react-native-purchases').default;
  } catch {
    console.warn('RevenueCat module not available');
  }
}

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
  const customerInfoListenerRef = useRef<((info: CustomerInfo) => void) | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<PlanType>('free');
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [offerings, setOfferings] = useState<Offerings>({ plus: null, premium: null });

  /**
   * Synchronise l'état de l'abonnement RevenueCat avec Supabase
   */
  const syncSubscriptionToSupabase = useCallback(async (customerInfo: CustomerInfo, planId?: string) => {
    if (!user?.id) {
      console.log('Cannot sync subscription: no user logged in');
      return;
    }

    try {
      // Déterminer le plan actif
      let activePlanId: PlanType = 'free';
      let activeEntitlement = null;

      if (customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM]) {
        activePlanId = 'premium';
        activeEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM];
      } else if (customerInfo.entitlements.active[ENTITLEMENTS.PLUS]) {
        activePlanId = 'plus';
        activeEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PLUS];
      }

      // Si un planId spécifique est fourni (après achat), l'utiliser
      const finalPlanId = planId || activePlanId;

      // Si pas d'abonnement actif, mettre à jour le statut comme expiré
      if (activePlanId === 'free') {
        // Vérifier s'il y a un abonnement existant à marquer comme expiré
        const { data: existingSubscription } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (existingSubscription) {
          await supabase
            .from('user_subscriptions')
            .update({
              status: 'expired',
              auto_renew: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSubscription.id);

          console.log('Subscription marked as expired in Supabase');
        }
        return;
      }

      // Déterminer la date d'expiration
      const expirationDateStr = activeEntitlement?.expirationDate || null;

      // Déterminer si le renouvellement automatique est actif
      // Note: willRenew indique si l'abonnement se renouvellera automatiquement
      const willRenew = activeEntitlement?.willRenew ?? true;

      // Upsert la subscription dans Supabase
      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          plan_id: finalPlanId,
          status: 'active',
          start_date: activeEntitlement?.originalPurchaseDate || new Date().toISOString(),
          end_date: expirationDateStr,
          auto_renew: willRenew,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Error syncing subscription to Supabase:', error);
      } else {
        console.log(`Subscription synced to Supabase: ${finalPlanId}`);
      }
    } catch (err) {
      console.error('Failed to sync subscription to Supabase:', err);
    }
  }, [user?.id]);

  /**
   * Configure le listener pour les mises à jour d'abonnement RevenueCat
   */
  const setupCustomerInfoListener = useCallback(() => {
    if (!Purchases || !revenueCatService.available) {
      return;
    }

    // Supprimer le listener existant si présent
    if (customerInfoListenerRef.current) {
      Purchases.removeCustomerInfoUpdateListener(customerInfoListenerRef.current);
      customerInfoListenerRef.current = null;
    }

    // Créer le listener
    const listener = (info: CustomerInfo) => {
      console.log('RevenueCat customer info updated');

      // Mettre à jour l'état local
      let newPlan: PlanType = 'free';
      if (info.entitlements.active[ENTITLEMENTS.PREMIUM]) {
        newPlan = 'premium';
      } else if (info.entitlements.active[ENTITLEMENTS.PLUS]) {
        newPlan = 'plus';
      }
      setCurrentPlan(newPlan);

      // Mettre à jour la date d'expiration
      const activeEntitlements = Object.values(info.entitlements.active);
      if (activeEntitlements.length > 0) {
        const expDate = activeEntitlements[0].expirationDate;
        setExpirationDate(expDate ? new Date(expDate) : null);
      } else {
        setExpirationDate(null);
      }

      // Synchroniser avec Supabase (appel asynchrone sans await pour ne pas bloquer le listener)
      syncSubscriptionToSupabase(info).catch((err) => {
        console.error('Failed to sync subscription from listener:', err);
      });
    };

    // Sauvegarder la référence du listener pour pouvoir le supprimer plus tard
    customerInfoListenerRef.current = listener;

    // Ajouter le listener
    Purchases.addCustomerInfoUpdateListener(listener);
  }, [syncSubscriptionToSupabase]);

  // Initialisation
  useEffect(() => {
    initializeRevenueCat();

    // Cleanup du listener au démontage
    return () => {
      if (Purchases && customerInfoListenerRef.current) {
        Purchases.removeCustomerInfoUpdateListener(customerInfoListenerRef.current);
        customerInfoListenerRef.current = null;
      }
    };
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
        // Configurer le listener après l'initialisation
        setupCustomerInfoListener();
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

      // Synchroniser avec Supabase
      const customerInfo = await revenueCatService.getCustomerInfo();
      if (customerInfo) {
        await syncSubscriptionToSupabase(customerInfo);
      }
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
      const customerInfo = await revenueCatService.purchasePackage(pkg);

      // Synchroniser immédiatement avec Supabase après l'achat réussi
      if (customerInfo && user?.id) {
        // Extraire le planId de l'identifiant du package
        // Les identifiants sont comme 'shy_plus_month', 'shy_premium_week', etc.
        const packageId = pkg.identifier.toLowerCase();
        let planId: PlanType = 'free';

        if (packageId.includes('premium')) {
          planId = 'premium';
        } else if (packageId.includes('plus')) {
          planId = 'plus';
        }

        // Synchroniser avec Supabase avec le planId spécifique
        await syncSubscriptionToSupabase(customerInfo, planId);
      }

      await refreshSubscription();
      return true;
    } catch (error: unknown) {
      const purchaseError = error as { userCancelled?: boolean };
      if (!purchaseError.userCancelled) {
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
      const customerInfo = await revenueCatService.restorePurchases();

      // Synchroniser avec Supabase après la restauration
      if (customerInfo && user?.id) {
        await syncSubscriptionToSupabase(customerInfo);
      }

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
