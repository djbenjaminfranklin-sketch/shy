import { useState, useEffect, useCallback } from 'react';
import { engagementScoreService } from '../services/supabase/engagementScore';
import {
  getEngagementLevel,
  getEngagementLevelDisplay,
} from '../constants/engagementScore';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import type {
  EngagementMetrics,
  EngagementLevel,
  EngagementLevelDisplay,
  EngagementBoost,
} from '../types/engagementScore';

interface UseEngagementScoreReturn {
  // Données
  metrics: EngagementMetrics | null;
  boosts: EngagementBoost[];
  isLoading: boolean;
  error: string | null;

  // Score et niveau
  totalScore: number;
  level: EngagementLevel;
  levelDisplay: EngagementLevelDisplay;

  // Composantes
  responsivenessScore: number;
  conversationScore: number;
  meetingScore: number;
  activityScore: number;

  // Indicateurs
  hasEnoughData: boolean;
  isNewUser: boolean;
  totalBoostMultiplier: number;

  // Actions
  refresh: () => Promise<void>;
  recordActivity: (type: 'message_sent' | 'message_replied' | 'meeting_proposed' | 'meeting_accepted' | 'session_start') => Promise<void>;
}

export function useEngagementScore(userId?: string): UseEngagementScoreReturn {
  const { language } = useLanguage();
  const { user } = useAuth();
  const lang = (language || 'fr') as 'fr' | 'en';

  const targetUserId = userId || user?.id;

  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [boosts, setBoosts] = useState<EngagementBoost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger le score
  const loadScore = useCallback(async () => {
    if (!targetUserId) {
      setMetrics(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Charger le score et les boosts en parallèle
      const [scoreResult, boostsResult] = await Promise.all([
        engagementScoreService.getEngagementScore(targetUserId),
        engagementScoreService.getActiveBoosts(targetUserId),
      ]);

      if (scoreResult.error) {
        setError(scoreResult.error);
      } else {
        setMetrics(scoreResult.metrics);
        setError(null);
      }

      setBoosts(boostsResult.boosts);
    } catch (err) {
      setError('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId]);

  // Chargement initial
  useEffect(() => {
    loadScore();
  }, [loadScore]);

  // Enregistrer une activité
  const recordActivity = useCallback(
    async (type: 'message_sent' | 'message_replied' | 'meeting_proposed' | 'meeting_accepted' | 'session_start') => {
      if (!targetUserId) return;
      await engagementScoreService.recordActivity(targetUserId, type);
    },
    [targetUserId]
  );

  // Valeurs calculées
  const totalScore = metrics?.totalScore || 50;
  const level = getEngagementLevel(totalScore);
  const levelDisplay = getEngagementLevelDisplay(level, lang);

  const hasEnoughData = (metrics?.dataPoints || 0) >= 5;
  const isNewUser = level === 'new';

  // Calculer le multiplicateur total de boost
  const totalBoostMultiplier = boosts.reduce(
    (acc, boost) => acc * boost.multiplier,
    1
  );

  return {
    metrics,
    boosts,
    isLoading,
    error,
    totalScore,
    level,
    levelDisplay,
    responsivenessScore: metrics?.responsivenessScore || 50,
    conversationScore: metrics?.conversationScore || 50,
    meetingScore: metrics?.meetingScore || 50,
    activityScore: metrics?.activityScore || 50,
    hasEnoughData,
    isNewUser,
    totalBoostMultiplier,
    refresh: loadScore,
    recordActivity,
  };
}

export default useEngagementScore;
