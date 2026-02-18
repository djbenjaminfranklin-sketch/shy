import React, { createContext, useContext, ReactNode } from 'react';
import { PurchasesPackage, PurchasesOffering } from 'react-native-purchases';
import { useAuth } from './AuthContext';
import { PlanType, PlanFeatures } from '../constants/subscriptions';
import { useSubscriptionState } from '../hooks/useSubscriptionState';

interface Offerings {
  plus: PurchasesOffering | null;
  premium: PurchasesOffering | null;
}

interface SubscriptionContextType {
  // Etat
  isLoading: boolean;
  currentPlan: PlanType;
  features: PlanFeatures;
  expirationDate: Date | null;
  offerings: Offerings;

  // Verifications
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

  const subscriptionState = useSubscriptionState(user?.id);

  return (
    <SubscriptionContext.Provider value={subscriptionState}>
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

// Hook pour verifier une feature specifique
export const useFeature = (feature: keyof PlanFeatures) => {
  const { features } = useSubscription();
  return features[feature];
};

// Hook pour verifier si l'utilisateur peut effectuer une action
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
