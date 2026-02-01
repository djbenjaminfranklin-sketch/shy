import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConnectionRhythm } from '../../hooks/useConnectionRhythm';
import { colors } from '../../theme/colors';

interface RhythmScoreCardProps {
  conversationId: string;
  compact?: boolean;
  onPress?: () => void;
}

export function RhythmScoreCard({ conversationId, compact = false, onPress }: RhythmScoreCardProps) {
  const { t } = useLanguage();
  const {
    isLoading,
    isValid,
    totalScore,
    messagesNeeded,
    progressPercent,
    display,
    trendDisplay,
  } = useConnectionRhythm(conversationId);

  if (isLoading) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('connectionRhythm.loading')}</Text>
        </View>
      </View>
    );
  }

  // Not enough messages yet
  if (!isValid) {
    return (
      <View style={[styles.container, compact && styles.containerCompact, styles.pendingContainer]}>
        <View style={styles.pendingContent}>
          <Ionicons name="chatbubbles-outline" size={compact ? 20 : 24} color={colors.textSecondary} />
          <View style={styles.pendingTextContainer}>
            <Text style={[styles.pendingTitle, compact && styles.pendingTitleCompact]}>
              {t('connectionRhythm.pendingTitle')}
            </Text>
            {!compact && (
              <Text style={styles.pendingSubtitle}>
                {t('connectionRhythm.pendingSubtitle', { count: messagesNeeded })}
              </Text>
            )}
          </View>
        </View>
        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
        </View>
      </View>
    );
  }

  // Valid score
  if (!display) return null;

  const CardContent = () => (
    <>
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <Text style={styles.icon}>{display.icon}</Text>
          <Text style={[styles.labelText, { color: display.color }]}>
            {display.labelText}
          </Text>
        </View>
        {trendDisplay && (
          <View style={styles.trendContainer}>
            <Text style={styles.trendIcon}>{trendDisplay.icon}</Text>
          </View>
        )}
      </View>

      {!compact && (
        <>
          {/* Score circle */}
          <View style={styles.scoreContainer}>
            <View style={[styles.scoreCircle, { borderColor: display.color }]}>
              <Text style={[styles.scoreValue, { color: display.color }]}>{totalScore}</Text>
              <Text style={styles.scorePercent}>%</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>{display.description}</Text>

          {/* Trend label */}
          {trendDisplay && (
            <Text style={styles.trendLabel}>{trendDisplay.label}</Text>
          )}

          {/* Info link */}
          <TouchableOpacity style={styles.infoLink}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{t('connectionRhythm.howItWorks')}</Text>
          </TouchableOpacity>
        </>
      )}

      {compact && (
        <View style={styles.compactScore}>
          <Text style={[styles.compactScoreValue, { color: display.color }]}>{totalScore}%</Text>
          {trendDisplay && (
            <Text style={styles.compactTrendIcon}>{trendDisplay.icon}</Text>
          )}
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[
          styles.container,
          compact && styles.containerCompact,
          { backgroundColor: display.backgroundColor },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        { backgroundColor: display.backgroundColor },
      ]}
    >
      <CardContent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  containerCompact: {
    padding: 12,
    marginVertical: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  pendingContainer: {
    backgroundColor: colors.backgroundSecondary,
  },
  pendingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pendingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  pendingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  pendingTitleCompact: {
    fontSize: 13,
  },
  pendingSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  labelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  trendContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
  },
  trendIcon: {
    fontSize: 14,
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    flexDirection: 'row',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  scorePercent: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  trendLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  infoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  compactScore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  compactScoreValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  compactTrendIcon: {
    fontSize: 14,
    marginLeft: 4,
  },
});

export default RhythmScoreCard;
