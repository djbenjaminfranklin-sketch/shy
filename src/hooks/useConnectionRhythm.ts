import { useState, useEffect, useCallback } from 'react';
import { connectionRhythmService } from '../services/supabase/connectionRhythm';
import { getRhythmDisplay, getTrendDisplay, MIN_MESSAGES_FOR_SCORE } from '../constants/connectionRhythm';
import { useLanguage } from '../contexts/LanguageContext';
import type {
  RhythmScoreResult,
  ConnectionRhythmScore,
  RhythmScoreDisplay,
} from '../types/connectionRhythm';

interface UseConnectionRhythmReturn {
  // Score data
  score: RhythmScoreResult | null;
  isLoading: boolean;
  error: string | null;

  // Computed
  isValid: boolean;
  totalScore: number;
  messagesNeeded: number;
  progressPercent: number;

  // Display helpers
  display: RhythmScoreDisplay | null;
  trendDisplay: { icon: string; label: string } | null;

  // Actions
  refresh: () => Promise<void>;
}

export function useConnectionRhythm(conversationId: string | null): UseConnectionRhythmReturn {
  const { language } = useLanguage();
  const lang = (language || 'fr') as 'fr' | 'en';

  const [score, setScore] = useState<RhythmScoreResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load score
  const loadScore = useCallback(async () => {
    if (!conversationId) {
      setScore(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { score: loadedScore, error: loadError } = await connectionRhythmService.getRhythmScore(
        conversationId
      );

      if (loadError) {
        setError(loadError);
      } else {
        setScore(loadedScore);
        setError(null);
      }
    } catch (err) {
      setError('Erreur lors du chargement du score');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Initial load
  useEffect(() => {
    loadScore();
  }, [loadScore]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = connectionRhythmService.subscribeToScoreChanges(
      conversationId,
      (updatedScore) => {
        setScore(updatedScore);
      }
    );

    return unsubscribe;
  }, [conversationId]);

  // Computed values
  const isValid = score?.isValid ?? false;
  const totalScore = isValid ? (score as ConnectionRhythmScore).totalScore : 0;
  const currentMessages = score?.currentMessageCount ?? 0;
  const messagesNeeded = Math.max(0, MIN_MESSAGES_FOR_SCORE - currentMessages);
  const progressPercent = Math.min(100, (currentMessages / MIN_MESSAGES_FOR_SCORE) * 100);

  // Display helpers
  const display = isValid ? getRhythmDisplay(totalScore, lang) : null;
  const trendDisplay =
    isValid && (score as ConnectionRhythmScore).trend
      ? getTrendDisplay((score as ConnectionRhythmScore).trend, lang)
      : null;

  return {
    score,
    isLoading,
    error,
    isValid,
    totalScore,
    messagesNeeded,
    progressPercent,
    display,
    trendDisplay,
    refresh: loadScore,
  };
}

export default useConnectionRhythm;
