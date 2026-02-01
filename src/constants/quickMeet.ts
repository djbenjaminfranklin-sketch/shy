/**
 * Configuration du système Pause Café (Quick Meet)
 */
import type { PlaceType, PlaceTypeDisplay, MeetDuration } from '../types/quickMeet';

// Durées disponibles
export const MEET_DURATIONS: MeetDuration[] = [15, 30];

// Configuration des durées FR
export const DURATION_LABELS_FR: Record<MeetDuration, string> = {
  15: '15 minutes',
  30: '30 minutes',
};

// Configuration des durées EN
export const DURATION_LABELS_EN: Record<MeetDuration, string> = {
  15: '15 minutes',
  30: '30 minutes',
};

// Types de lieux FR
export const PLACE_TYPES_FR: Record<PlaceType, Omit<PlaceTypeDisplay, 'type'>> = {
  cafe: {
    label: 'Café',
    icon: '☕',
    description: 'Un café tranquille pour discuter',
  },
  park: {
    label: 'Parc',
    icon: '🌳',
    description: 'Une promenade en plein air',
  },
  library: {
    label: 'Bibliothèque',
    icon: '📚',
    description: 'Un espace calme et culturel',
  },
  museum: {
    label: 'Musée',
    icon: '🏛️',
    description: 'Découvrir une exposition ensemble',
  },
  shopping: {
    label: 'Centre commercial',
    icon: '🛍️',
    description: 'Un lieu animé et pratique',
  },
  restaurant: {
    label: 'Restaurant',
    icon: '🍽️',
    description: 'Partager un repas léger',
  },
};

// Types de lieux EN
export const PLACE_TYPES_EN: Record<PlaceType, Omit<PlaceTypeDisplay, 'type'>> = {
  cafe: {
    label: 'Café',
    icon: '☕',
    description: 'A quiet café to chat',
  },
  park: {
    label: 'Park',
    icon: '🌳',
    description: 'A walk in the fresh air',
  },
  library: {
    label: 'Library',
    icon: '📚',
    description: 'A calm and cultural space',
  },
  museum: {
    label: 'Museum',
    icon: '🏛️',
    description: 'Discover an exhibition together',
  },
  shopping: {
    label: 'Shopping center',
    icon: '🛍️',
    description: 'A lively and convenient place',
  },
  restaurant: {
    label: 'Restaurant',
    icon: '🍽️',
    description: 'Share a light meal',
  },
};

// Liste ordonnée des types de lieux
export const PLACE_TYPES_ORDER: PlaceType[] = ['cafe', 'park', 'restaurant', 'museum', 'library', 'shopping'];

// Délai d'expiration par défaut (6 heures)
export const PROPOSAL_EXPIRY_HOURS = 6;

// Plage horaire min/max (2-6 heures dans le futur)
export const MIN_HOURS_AHEAD = 2;
export const MAX_HOURS_AHEAD = 6;

// Nombre de créneaux à proposer
export const NUM_TIME_SLOTS = 3;

// Helper: Obtenir la config d'affichage pour un type de lieu
export function getPlaceTypeDisplay(
  type: PlaceType,
  lang: 'fr' | 'en' = 'fr'
): PlaceTypeDisplay {
  const config = lang === 'fr' ? PLACE_TYPES_FR[type] : PLACE_TYPES_EN[type];
  return { type, ...config };
}

// Helper: Obtenir le label de durée
export function getDurationLabel(
  duration: MeetDuration,
  lang: 'fr' | 'en' = 'fr'
): string {
  return lang === 'fr' ? DURATION_LABELS_FR[duration] : DURATION_LABELS_EN[duration];
}

// Helper: Générer des créneaux horaires disponibles
export function generateTimeSlots(count: number = NUM_TIME_SLOTS): { startTime: Date; endTime: Date; label: string }[] {
  const slots: { startTime: Date; endTime: Date; label: string }[] = [];
  const now = new Date();

  // Commencer à l'heure ronde suivante + MIN_HOURS_AHEAD
  const startHour = now.getHours() + MIN_HOURS_AHEAD + 1;

  for (let i = 0; i < count; i++) {
    const slotHour = startHour + i;
    if (slotHour > now.getHours() + MAX_HOURS_AHEAD) break;

    const startTime = new Date(now);
    startTime.setHours(slotHour, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(30);

    const label = `${slotHour.toString().padStart(2, '0')}h00 - ${slotHour.toString().padStart(2, '0')}h30`;

    slots.push({ startTime, endTime, label });
  }

  return slots;
}

// Helper: Vérifier si un créneau est encore valide
export function isSlotValid(slotTime: Date): boolean {
  const now = new Date();
  const minTime = new Date(now.getTime() + MIN_HOURS_AHEAD * 60 * 60 * 1000);
  return slotTime >= minTime;
}
