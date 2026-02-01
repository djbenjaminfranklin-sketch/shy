/**
 * Types pour les modes de disponibilité temporaire
 */

// Types de modes disponibles
export type AvailabilityModeType = 'relaxed' | 'spontaneous' | 'explorer';

// Durées possibles (en heures)
export type ModeDuration = 24 | 72;

// Mode actif
export interface ActiveAvailabilityMode {
  id: string;
  userId: string;
  modeType: AvailabilityModeType;
  durationHours: ModeDuration;
  activatedAt: string;
  expiresAt: string;
  isActive: boolean;
  showBadge: boolean;
  createdAt: string;
}

// Historique des activations
export interface ModeActivation {
  id: string;
  userId: string;
  modeType: AvailabilityModeType;
  durationHours: ModeDuration;
  activatedAt: string;
}

// Réponse de vérification de possibilité d'activation
export interface CanActivateModeResult {
  canActivate: boolean;
  reason?: 'already_active' | 'premium_required' | 'weekly_limit';
  message?: string;
  isPremium?: boolean;
  subscriptionPlan?: string;
  activationsThisWeek?: number;
}

// Réponse d'activation de mode
export interface ActivateModeResult {
  success: boolean;
  modeId?: string;
  modeType?: AvailabilityModeType;
  expiresAt?: string;
  durationHours?: ModeDuration;
  reason?: string;
  message?: string;
}

// Réponse de désactivation
export interface DeactivateModeResult {
  success: boolean;
  deactivatedModeId?: string;
  reason?: string;
  message?: string;
}

// État du mode actif (pour le hook)
export interface ActiveModeState {
  hasActiveMode: boolean;
  modeId?: string;
  modeType?: AvailabilityModeType;
  durationHours?: ModeDuration;
  activatedAt?: string;
  expiresAt?: string;
  showBadge?: boolean;
  remainingMinutes?: number;
}

// Paramètres d'activation
export interface ActivateModeParams {
  modeType: AvailabilityModeType;
  durationHours: ModeDuration;
  showBadge?: boolean;
}
