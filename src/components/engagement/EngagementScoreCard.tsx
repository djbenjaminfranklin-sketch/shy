import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useEngagementScore } from '../../hooks/useEngagementScore';
import { colors } from '../../theme/colors';

interface EngagementScoreCardProps {
  userId?: string;
  showDetails?: boolean;
}

export function EngagementScoreCard({
  userId,
  showDetails = true,
}: EngagementScoreCardProps) {
  const { t } = useLanguage();
  const {
    totalScore,
    levelDisplay,
    responsivenessScore,
    conversationScore,
    meetingScore,
    activityScore,
    isLoading,
    hasEnoughData,
    totalBoostMultiplier,
  } = useEngagementScore(userId);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: levelDisplay.color + '15' }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.levelInfo}>
          <Text style={styles.levelIcon}>{levelDisplay.icon}</Text>
          <View>
            <Text style={[styles.levelLabel, { color: levelDisplay.color }]}>
              {levelDisplay.label}
            </Text>
            <Text style={styles.levelDesc}>{levelDisplay.description}</Text>
          </View>
        </View>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreValue, { color: levelDisplay.color }]}>
            {totalScore}
          </Text>
        </View>
      </View>

      {/* Boost indicator */}
      {totalBoostMultiplier > 1 && (
        <View style={styles.boostBadge}>
          <Ionicons name="flash" size={14} color={colors.warning} />
          <Text style={styles.boostText}>
            {t('engagementScore.boostActive', { multiplier: Math.round((totalBoostMultiplier - 1) * 100) })}
          </Text>
        </View>
      )}

      {/* Details */}
      {showDetails && hasEnoughData && (
        <View style={styles.detailsContainer}>
          <ScoreBar
            label={t('engagementScore.responsiveness')}
            value={responsivenessScore}
            color={levelDisplay.color}
          />
          <ScoreBar
            label={t('engagementScore.conversation')}
            value={conversationScore}
            color={levelDisplay.color}
          />
          <ScoreBar
            label={t('engagementScore.meetings')}
            value={meetingScore}
            color={levelDisplay.color}
          />
          <ScoreBar
            label={t('engagementScore.activity')}
            value={activityScore}
            color={levelDisplay.color}
          />
        </View>
      )}

      {/* Info for new users */}
      {!hasEnoughData && (
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={18} color={colors.primary} />
          <Text style={styles.infoText}>{t('engagementScore.notEnoughData')}</Text>
        </View>
      )}

      {/* Explanation */}
      <View style={styles.explanationCard}>
        <Ionicons name="bulb-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.explanationText}>{t('engagementScore.explanation')}</Text>
      </View>
    </View>
  );
}

// Composant barre de score
function ScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.scoreBarContainer}>
      <View style={styles.scoreBarHeader}>
        <Text style={styles.scoreBarLabel}>{label}</Text>
        <Text style={[styles.scoreBarValue, { color }]}>{value}%</Text>
      </View>
      <View style={styles.scoreBarTrack}>
        <View
          style={[
            styles.scoreBarFill,
            { width: `${value}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  loadingText: {
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  levelIcon: {
    fontSize: 32,
  },
  levelLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  levelDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scoreCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  boostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 12,
  },
  boostText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
  },
  detailsContainer: {
    marginTop: 8,
    gap: 12,
  },
  scoreBarContainer: {
    gap: 4,
  },
  scoreBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBarLabel: {
    fontSize: 13,
    color: colors.text,
  },
  scoreBarValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  scoreBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  explanationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    gap: 8,
  },
  explanationText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});

export default EngagementScoreCard;
