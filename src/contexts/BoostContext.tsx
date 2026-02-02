import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import { useAuth } from './AuthContext';
import { boostsService } from '../services/supabase/boosts';
import { revenueCatService } from '../services/revenuecat';
import { BOOST_PRODUCTS } from '../constants/subscriptions';
import { UserBoostState } from '../types/boost';

// Détection d'Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

interface BoostContextType {
  // State
  boostsAvailable: number;
  isBoostActive: boolean;
  activeBoostExpiresAt: string | null;
  remainingSeconds: number;
  isLoading: boolean;

  // Actions
  purchaseBoosts: (productId: string) => Promise<boolean>;
  activateBoost: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

const BoostContext = createContext<BoostContextType | undefined>(undefined);

interface BoostProviderProps {
  children: ReactNode;
}

export const BoostProvider: React.FC<BoostProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [boostState, setBoostState] = useState<UserBoostState>({
    boostsAvailable: 0,
    activeBoostExpiresAt: null,
    lastBoostActivatedAt: null,
    isBoostActive: false,
    remainingSeconds: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Calculate remaining seconds from expiration time
  const calculateRemainingSeconds = useCallback((expiresAt: string | null): number => {
    if (!expiresAt) return 0;
    const now = new Date();
    const expiry = new Date(expiresAt);
    return Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / 1000));
  }, []);

  // Refresh boost state from server
  const refresh = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { state, error } = await boostsService.getUserBoostState(user.id);

      if (error) {
        console.error('Error refreshing boost state:', error);
        return;
      }

      setBoostState(state);
    } catch (err) {
      console.error('Error refreshing boost state:', err);
    }
  }, [user?.id]);

  // Load boost state when user changes
  useEffect(() => {
    if (user?.id) {
      refresh();
    } else {
      setBoostState({
        boostsAvailable: 0,
        activeBoostExpiresAt: null,
        lastBoostActivatedAt: null,
        isBoostActive: false,
        remainingSeconds: 0,
      });
    }
  }, [user?.id, refresh]);

  // Update remaining seconds every second when boost is active
  useEffect(() => {
    if (!boostState.isBoostActive || !boostState.activeBoostExpiresAt) {
      return;
    }

    const interval = setInterval(() => {
      const remaining = calculateRemainingSeconds(boostState.activeBoostExpiresAt);

      if (remaining <= 0) {
        // Boost expired, refresh state
        refresh();
        clearInterval(interval);
      } else {
        setBoostState(prev => ({
          ...prev,
          remainingSeconds: remaining,
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [boostState.isBoostActive, boostState.activeBoostExpiresAt, calculateRemainingSeconds, refresh]);

  // Purchase boosts
  const purchaseBoosts = useCallback(async (productId: string): Promise<boolean> => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Vous devez être connecté pour acheter des boosts.');
      return false;
    }

    if (isExpoGo || !revenueCatService.available) {
      Alert.alert(
        'Non disponible',
        'Les achats ne sont pas disponibles dans Expo Go. Utilisez un build de développement.'
      );
      return false;
    }

    setIsLoading(true);

    try {
      // Find the product
      const product = BOOST_PRODUCTS.find(p => p.productId === productId);
      if (!product) {
        Alert.alert('Erreur', 'Produit non trouvé.');
        return false;
      }

      // Purchase via RevenueCat
      await revenueCatService.purchaseProduct(productId);

      // Add boosts to user's balance
      const { success, error } = await boostsService.purchaseBoosts(
        user.id,
        product.quantity,
        productId,
        product.price
      );

      if (!success || error) {
        Alert.alert('Erreur', error || 'Une erreur est survenue lors de l\'achat.');
        return false;
      }

      // Refresh state
      await refresh();

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
  }, [user?.id, refresh]);

  // Activate a boost
  const activateBoost = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Vous devez être connecté pour activer un boost.');
      return false;
    }

    if (boostState.isBoostActive) {
      Alert.alert('Info', 'Un boost est déjà actif.');
      return false;
    }

    if (boostState.boostsAvailable <= 0) {
      Alert.alert('Info', 'Vous n\'avez pas de boost disponible.');
      return false;
    }

    setIsLoading(true);

    try {
      const { success, expiresAt, error } = await boostsService.activateBoost(user.id);

      if (!success || error) {
        Alert.alert('Erreur', error || 'Une erreur est survenue.');
        return false;
      }

      // Update local state immediately
      setBoostState(prev => ({
        ...prev,
        boostsAvailable: prev.boostsAvailable - 1,
        activeBoostExpiresAt: expiresAt,
        lastBoostActivatedAt: new Date().toISOString(),
        isBoostActive: true,
        remainingSeconds: expiresAt ? calculateRemainingSeconds(expiresAt) : 0,
      }));

      return true;
    } catch (err) {
      console.error('Error activating boost:', err);
      Alert.alert('Erreur', 'Une erreur est survenue.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, boostState.isBoostActive, boostState.boostsAvailable, calculateRemainingSeconds]);

  return (
    <BoostContext.Provider
      value={{
        boostsAvailable: boostState.boostsAvailable,
        isBoostActive: boostState.isBoostActive,
        activeBoostExpiresAt: boostState.activeBoostExpiresAt,
        remainingSeconds: boostState.remainingSeconds,
        isLoading,
        purchaseBoosts,
        activateBoost,
        refresh,
      }}
    >
      {children}
    </BoostContext.Provider>
  );
};

export const useBoost = (): BoostContextType => {
  const context = useContext(BoostContext);
  if (!context) {
    throw new Error('useBoost must be used within a BoostProvider');
  }
  return context;
};

export default BoostContext;
