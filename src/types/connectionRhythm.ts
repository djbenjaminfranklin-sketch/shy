/**
 * Types pour le système Rythme de Connexion
 */

// Score trend
export type RhythmTrend = 'up' | 'down' | 'stable';

// Score label based on percentage
export type RhythmLabel =
  | 'perfect_harmony'    // 85-100%
  | 'great_connection'   // 70-84%
  | 'good_compatibility' // 55-69%
  | 'building'           // 40-54%
  | 'developing';        // 0-39%

// Full rhythm score data
export interface ConnectionRhythmScore {
  isValid: boolean;
  rhythmScore: number;        // 0-100
  availabilityScore: number;  // 0-100
  engagementScore: number;    // 0-100
  regularityScore: number;    // 0-100
  totalScore: number;         // 0-100 (weighted)
  trend: RhythmTrend;
  currentMessageCount: number;
  minMessagesRequired: number;
  calculatedAt: string | null;
}

// Invalid/pending score
export interface PendingRhythmScore {
  isValid: false;
  currentMessageCount: number;
  minMessagesRequired: number;
}

// Union type for API response
export type RhythmScoreResult = ConnectionRhythmScore | PendingRhythmScore;

// Score display configuration
export interface RhythmScoreDisplay {
  label: RhythmLabel;
  labelText: string;
  description: string;
  color: string;
  backgroundColor: string;
  icon: string;
}

// Interaction stats for a user in a conversation
export interface InteractionStats {
  conversationId: string;
  userId: string;
  totalMessages: number;
  avgResponseTimeSeconds: number | null;
  avgMessageLength: number | null;
  messagesPerDay: number;
  activeHours: number[];
  firstMessageAt: string | null;
  lastMessageAt: string | null;
}
