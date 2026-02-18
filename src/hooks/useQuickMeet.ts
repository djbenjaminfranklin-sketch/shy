import { useState, useEffect, useCallback } from 'react';
import { quickMeetService } from '../services/supabase/quickMeet';
import { subscriptionsService } from '../services/supabase/subscriptions';
import {
  generateTimeSlots,
  getPlaceTypeDisplay,
  getDurationLabel,
  MEET_DURATIONS,
  PLACE_TYPES_ORDER,
} from '../constants/quickMeet';
import { SUBSCRIPTION_PLANS_BY_ID, PlanType } from '../constants/subscriptions';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import type {
  MeetProposal,
  MeetDuration,
  TimeSlot,
  SuggestedPlace,
  PlaceType,
  MeetProposalResponse,
} from '../types/quickMeet';

interface UseQuickMeetReturn {
  // État
  activeProposal: MeetProposal | null;
  isLoading: boolean;
  error: string | null;

  // Permissions
  canPropose: boolean;
  isProposer: boolean;
  isRecipient: boolean;

  // Limites
  proposalsUsedToday: number;
  proposalsLimit: number;
  hasReachedLimit: boolean;

  // Données pour création
  availableDurations: MeetDuration[];
  availableTimeSlots: TimeSlot[];
  availablePlaceTypes: PlaceType[];

  // Actions
  createProposal: (
    duration: MeetDuration,
    slots: TimeSlot[],
    places: SuggestedPlace[],
    message?: string
  ) => Promise<boolean>;
  acceptProposal: (slotId: string, placeId: string) => Promise<boolean>;
  declineProposal: (reason?: string) => Promise<boolean>;
  cancelProposal: () => Promise<boolean>;
  refresh: () => Promise<void>;

  // Helpers
  getDurationLabel: (duration: MeetDuration) => string;
  getPlaceTypeDisplay: (type: PlaceType) => ReturnType<typeof getPlaceTypeDisplay>;
}

export function useQuickMeet(
  conversationId: string | null,
  otherUserId: string | null
): UseQuickMeetReturn {
  const { language } = useLanguage();
  const { user } = useAuth();
  const lang = (language || 'fr') as 'fr' | 'en';

  const [activeProposal, setActiveProposal] = useState<MeetProposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Limites Quick Meet
  const [proposalsUsedToday, setProposalsUsedToday] = useState(0);
  const [proposalsLimit, setProposalsLimit] = useState(1);

  // Charger la proposition active
  const loadProposal = useCallback(async () => {
    if (!conversationId) {
      setActiveProposal(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { proposal, error: loadError } = await quickMeetService.getActiveProposal(
        conversationId
      );

      if (loadError) {
        setError(loadError);
      } else {
        setActiveProposal(proposal);
        setError(null);
      }
    } catch (err) {
      setError('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Chargement initial
  useEffect(() => {
    loadProposal();
  }, [loadProposal]);

  // Charger les limites de l'abonnement
  useEffect(() => {
    if (!user) return;

    const loadLimits = async () => {
      try {
        const { subscription } = await subscriptionsService.getUserSubscription(user.id);
        const planId = (subscription?.planId || 'free') as PlanType;
        const plan = SUBSCRIPTION_PLANS_BY_ID[planId];
        setProposalsLimit(plan?.features.quickMeetProposalsPerDay ?? 1);

        const { limits } = await subscriptionsService.getUserLimits(user.id);
        setProposalsUsedToday(limits?.quickMeetProposalsUsed || 0);
      } catch {
        // Silent fail - limits will use defaults
      }
    };

    loadLimits();
  }, [user]);

  // Abonnement temps réel
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = quickMeetService.subscribeToProposals(
      conversationId,
      (updatedProposal) => {
        if (updatedProposal.status === 'pending') {
          setActiveProposal(updatedProposal);
        } else {
          setActiveProposal(null);
        }
      }
    );

    return unsubscribe;
  }, [conversationId]);

  // Valeurs calculées
  const hasReachedLimit = proposalsLimit !== -1 && proposalsUsedToday >= proposalsLimit;
  const canPropose = !activeProposal && !!user && !!otherUserId && !hasReachedLimit;
  const isProposer = activeProposal?.proposerId === user?.id;
  const isRecipient = activeProposal?.recipientId === user?.id;

  // Créer une proposition
  const createProposal = useCallback(
    async (
      duration: MeetDuration,
      slots: TimeSlot[],
      places: SuggestedPlace[],
      message?: string
    ): Promise<boolean> => {
      if (!conversationId || !user || !otherUserId) return false;

      // Vérifier la limite (sauf si illimité = -1)
      if (proposalsLimit !== -1 && proposalsUsedToday >= proposalsLimit) {
        setError('Limite de propositions atteinte');
        return false;
      }

      const { proposal, error: createError } = await quickMeetService.createProposal(
        conversationId,
        user.id,
        otherUserId,
        duration,
        slots,
        places,
        message
      );

      if (createError || !proposal) {
        setError(createError || 'Erreur lors de la création');
        return false;
      }

      // Incrémenter le compteur
      setProposalsUsedToday((prev) => prev + 1);
      subscriptionsService.incrementQuickMeetProposals(user.id);

      setActiveProposal(proposal);
      return true;
    },
    [conversationId, user, otherUserId, proposalsUsedToday, proposalsLimit]
  );

  // Accepter une proposition
  const acceptProposal = useCallback(
    async (slotId: string, placeId: string): Promise<boolean> => {
      if (!activeProposal) return false;

      const response: MeetProposalResponse = {
        proposalId: activeProposal.id,
        accepted: true,
        selectedSlotId: slotId,
        selectedPlaceId: placeId,
      };

      const { success, error: respError } = await quickMeetService.respondToProposal(response);

      if (!success) {
        setError(respError || 'Erreur lors de la réponse');
        return false;
      }

      setActiveProposal(null);
      return true;
    },
    [activeProposal]
  );

  // Décliner une proposition
  const declineProposal = useCallback(
    async (reason?: string): Promise<boolean> => {
      if (!activeProposal) return false;

      const response: MeetProposalResponse = {
        proposalId: activeProposal.id,
        accepted: false,
        declineReason: reason as MeetProposalResponse['declineReason'],
      };

      const { success, error: respError } = await quickMeetService.respondToProposal(response);

      if (!success) {
        setError(respError || 'Erreur lors de la réponse');
        return false;
      }

      setActiveProposal(null);
      return true;
    },
    [activeProposal]
  );

  // Annuler une proposition
  const cancelProposal = useCallback(async (): Promise<boolean> => {
    if (!activeProposal || !user) return false;

    const { success, error: cancelError } = await quickMeetService.cancelProposal(
      activeProposal.id,
      user.id
    );

    if (!success) {
      setError(cancelError || 'Erreur lors de l\'annulation');
      return false;
    }

    setActiveProposal(null);
    return true;
  }, [activeProposal, user]);

  return {
    activeProposal,
    isLoading,
    error,
    canPropose,
    isProposer,
    isRecipient,
    proposalsUsedToday,
    proposalsLimit,
    hasReachedLimit,
    availableDurations: MEET_DURATIONS,
    availableTimeSlots: generateTimeSlots().map((slot, index) => ({
      id: `slot-${index}`,
      ...slot,
    })),
    availablePlaceTypes: PLACE_TYPES_ORDER,
    createProposal,
    acceptProposal,
    declineProposal,
    cancelProposal,
    refresh: loadProposal,
    getDurationLabel: (duration: MeetDuration) => getDurationLabel(duration, lang),
    getPlaceTypeDisplay: (type: PlaceType) => getPlaceTypeDisplay(type, lang),
  };
}

export default useQuickMeet;
