/**
 * Types pour le système Pause Café (Quick Meet)
 * Rendez-vous courts dans des lieux publics
 */

// Durées disponibles
export type MeetDuration = 15 | 30;

// Statut d'une proposition
export type MeetProposalStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';

// Types de lieux publics
export type PlaceType = 'cafe' | 'park' | 'library' | 'museum' | 'shopping' | 'restaurant';

// Créneau horaire
export interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  label: string; // e.g., "14h30 - 15h00"
}

// Lieu suggéré
export interface SuggestedPlace {
  id: string;
  name: string;
  type: PlaceType;
  address: string;
  distance?: number; // en km
  isPublic: boolean;
}

// Proposition de rendez-vous
export interface MeetProposal {
  id: string;
  conversationId: string;
  proposerId: string;
  recipientId: string;

  // Détails
  duration: MeetDuration;
  proposedSlots: TimeSlot[];
  selectedSlotId?: string;
  suggestedPlaces: SuggestedPlace[];
  selectedPlaceId?: string;

  // Message optionnel
  message?: string;

  // Statut
  status: MeetProposalStatus;

  // Timestamps
  createdAt: string;
  expiresAt: string;
  respondedAt?: string;
}

// Réponse à une proposition
export interface MeetProposalResponse {
  proposalId: string;
  accepted: boolean;
  selectedSlotId?: string;
  selectedPlaceId?: string;
  declineReason?: 'busy' | 'not_ready' | 'prefer_chat' | 'other';
}

// Configuration d'affichage pour les types de lieux
export interface PlaceTypeDisplay {
  type: PlaceType;
  label: string;
  icon: string;
  description: string;
}

// État d'une proposition dans l'UI
export interface MeetProposalUIState {
  proposal: MeetProposal | null;
  isLoading: boolean;
  error: string | null;
  canPropose: boolean; // false si déjà une proposition en cours
}
