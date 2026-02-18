import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import { useAuth } from './AuthContext';
import { iceBreakerService } from '../services/supabase/icebreaker';
import { revenueCatService } from '../services/revenuecat';
import { ICEBREAKER_PRODUCTS } from '../constants/subscriptions';
import { UserIceBreakerState, IceBreakerResult, IceBreakerCandidate } from '../types/icebreaker';

// Détection d'Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

interface IceBreakerContextType {
  // State
  iceBreakersAvailable: number;
  lastIceBreakerUsedAt: string | null;
  totalIceBreakersUsed: number;
  isLoading: boolean;

  // Actions
  purchaseIceBreakers: (productId: string) => Promise<boolean>;
  useIceBreaker: () => Promise<{ success: boolean; results: IceBreakerResult[] }>;
  getCandidates: () => Promise<{ candidates: IceBreakerCandidate[]; replacementPool: IceBreakerCandidate[]; error: string | null }>;
  sendToApproved: (candidates: IceBreakerCandidate[]) => Promise<{ success: boolean; results: IceBreakerResult[]; error: string | null }>;
  sendToSingle: (candidate: IceBreakerCandidate) => Promise<{ success: boolean; error: string | null }>;
  refresh: () => Promise<void>;
}

const IceBreakerContext = createContext<IceBreakerContextType | undefined>(undefined);

interface IceBreakerProviderProps {
  children: ReactNode;
}

export const IceBreakerProvider: React.FC<IceBreakerProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [iceBreakerState, setIceBreakerState] = useState<UserIceBreakerState>({
    iceBreakersAvailable: 0,
    lastIceBreakerUsedAt: null,
    totalIceBreakersUsed: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Refresh Ice Breaker state from server
  const refresh = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { state, error } = await iceBreakerService.getUserIceBreakerState(user.id);

      if (error) {
        return;
      }

      setIceBreakerState(state);
    } catch (err) {
      // Error refreshing Ice Breaker state
    }
  }, [user?.id]);

  // Load Ice Breaker state when user changes
  useEffect(() => {
    if (user?.id) {
      refresh();
    } else {
      setIceBreakerState({
        iceBreakersAvailable: 0,
        lastIceBreakerUsedAt: null,
        totalIceBreakersUsed: 0,
      });
    }
  }, [user?.id, refresh]);

  // Purchase Ice Breakers
  const purchaseIceBreakers = useCallback(async (productId: string): Promise<boolean> => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Vous devez être connecté pour acheter des Ice Breakers.');
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
      const product = ICEBREAKER_PRODUCTS.find(p => p.productId === productId);
      if (!product) {
        Alert.alert('Erreur', 'Produit non trouvé.');
        return false;
      }

      // Purchase via RevenueCat
      await revenueCatService.purchaseProduct(productId);

      // Add Ice Breakers to user's balance
      const { success, error } = await iceBreakerService.purchaseIceBreakers(
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

  // Use an Ice Breaker (legacy method)
  const useIceBreaker = useCallback(async (): Promise<{ success: boolean; results: IceBreakerResult[] }> => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Vous devez être connecté pour utiliser un Ice Breaker.');
      return { success: false, results: [] };
    }

    if (iceBreakerState.iceBreakersAvailable <= 0) {
      Alert.alert('Info', 'Vous n\'avez pas d\'Ice Breaker disponible.');
      return { success: false, results: [] };
    }

    setIsLoading(true);

    try {
      const { success, results, error } = await iceBreakerService.useIceBreaker(user.id);

      if (!success || error) {
        Alert.alert('Oops', error || 'Une erreur est survenue.');
        return { success: false, results: [] };
      }

      // Update local state immediately
      setIceBreakerState(prev => ({
        ...prev,
        iceBreakersAvailable: prev.iceBreakersAvailable - 1,
        lastIceBreakerUsedAt: new Date().toISOString(),
        totalIceBreakersUsed: prev.totalIceBreakersUsed + 1,
      }));

      const sentCount = results.filter(r => r.sent).length;
      if (sentCount > 0) {
        Alert.alert(
          'Ice Breaker envoyé !',
          `${sentCount} message${sentCount > 1 ? 's personnalisés ont été envoyés' : ' personnalisé a été envoyé'} !`
        );
      }

      return { success: true, results };
    } catch (err) {
      Alert.alert('Erreur', 'Une erreur est survenue.');
      return { success: false, results: [] };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, iceBreakerState.iceBreakersAvailable]);

  // Get candidates for preview (new flow)
  const getCandidates = useCallback(async (): Promise<{
    candidates: IceBreakerCandidate[];
    replacementPool: IceBreakerCandidate[];
    error: string | null;
  }> => {
    if (!user?.id) {
      return { candidates: [], replacementPool: [], error: 'Vous devez être connecté.' };
    }

    if (iceBreakerState.iceBreakersAvailable <= 0) {
      return { candidates: [], replacementPool: [], error: 'Aucun Ice Breaker disponible.' };
    }

    try {
      const result = await iceBreakerService.getCandidates(user.id);
      return result;
    } catch (err) {
      return { candidates: [], replacementPool: [], error: 'Une erreur est survenue.' };
    }
  }, [user?.id, iceBreakerState.iceBreakersAvailable]);

  // Send messages to approved candidates (new flow)
  const sendToApproved = useCallback(async (
    candidates: IceBreakerCandidate[]
  ): Promise<{ success: boolean; results: IceBreakerResult[]; error: string | null }> => {
    if (!user?.id) {
      return { success: false, results: [], error: 'Vous devez être connecté.' };
    }

    setIsLoading(true);

    try {
      const result = await iceBreakerService.sendToApprovedCandidates(user.id, candidates);

      if (result.success) {
        // Update local state
        setIceBreakerState(prev => ({
          ...prev,
          iceBreakersAvailable: prev.iceBreakersAvailable - 1,
          lastIceBreakerUsedAt: new Date().toISOString(),
          totalIceBreakersUsed: prev.totalIceBreakersUsed + 1,
        }));
      }

      return result;
    } catch (err) {
      return { success: false, results: [], error: 'Une erreur est survenue.' };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Send message to a single candidate
  const sendToSingle = useCallback(async (
    candidate: IceBreakerCandidate
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!user?.id) {
      return { success: false, error: 'Vous devez être connecté.' };
    }

    try {
      const result = await iceBreakerService.sendToSingleCandidate(user.id, candidate);
      return { success: result.success, error: result.error };
    } catch (err) {
      return { success: false, error: 'Une erreur est survenue.' };
    }
  }, [user?.id]);

  return (
    <IceBreakerContext.Provider
      value={{
        iceBreakersAvailable: iceBreakerState.iceBreakersAvailable,
        lastIceBreakerUsedAt: iceBreakerState.lastIceBreakerUsedAt,
        totalIceBreakersUsed: iceBreakerState.totalIceBreakersUsed,
        isLoading,
        purchaseIceBreakers,
        useIceBreaker,
        getCandidates,
        sendToApproved,
        sendToSingle,
        refresh,
      }}
    >
      {children}
    </IceBreakerContext.Provider>
  );
};

export const useIceBreaker = (): IceBreakerContextType => {
  const context = useContext(IceBreakerContext);
  if (!context) {
    throw new Error('useIceBreaker must be used within an IceBreakerProvider');
  }
  return context;
};

export default IceBreakerContext;
