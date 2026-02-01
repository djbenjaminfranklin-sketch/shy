import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useLanguage } from '../../contexts/LanguageContext';
import { AVAILABILITY_MODES_LIST, MODE_DURATIONS } from '../../constants/availabilityModes';
import { Button } from '../ui/Button';
import type { AvailabilityModeType, ModeDuration } from '../../types/availabilityMode';

interface ModeActivationModalProps {
  visible: boolean;
  onClose: () => void;
  onActivate: (modeType: AvailabilityModeType, duration: ModeDuration) => Promise<void>;
  isLoading?: boolean;
  canUse72Hours?: boolean;
  hasRemainingActivations?: boolean;
  weeklyActivationsUsed?: number;
  weeklyActivationsLimit?: number;
  onUpgrade?: () => void;
}

export function ModeActivationModal({
  visible,
  onClose,
  onActivate,
  isLoading = false,
  canUse72Hours = false,
  hasRemainingActivations = true,
  weeklyActivationsUsed = 0,
  weeklyActivationsLimit = 1,
  onUpgrade,
}: ModeActivationModalProps) {
  const { t } = useLanguage();

  const [selectedMode, setSelectedMode] = useState<AvailabilityModeType | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<ModeDuration>(24);

  const handleActivate = async () => {
    if (!selectedMode) return;
    await onActivate(selectedMode, selectedDuration);
  };

  const limitText =
    weeklyActivationsLimit === -1
      ? t('availabilityModes.unlimited')
      : `${weeklyActivationsUsed}/${weeklyActivationsLimit}`;

  // Get mode label from translations
  const getModeLabel = (modeId: AvailabilityModeType) => {
    return t(`availabilityModes.${modeId}`);
  };

  // Get mode description from translations
  const getModeDescription = (modeId: AvailabilityModeType) => {
    return t(`availabilityModes.${modeId}Description`);
  };

  // Get duration label from translations
  const getDurationLabel = (duration: ModeDuration) => {
    return t(`availabilityModes.duration${duration}h`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('availabilityModes.activateTitle')}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Description */}
            <Text style={styles.description}>{t('availabilityModes.description')}</Text>

            {/* Weekly usage */}
            <View style={styles.usageContainer}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.usageText}>
                {t('availabilityModes.activationsThisWeek')}{' '}
                <Text style={styles.usageCount}>{limitText}</Text>
              </Text>
            </View>

            {/* Mode selection */}
            <Text style={styles.sectionTitle}>{t('availabilityModes.chooseMode')}</Text>

            <View style={styles.modesContainer}>
              {AVAILABILITY_MODES_LIST.map((mode) => (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.modeCard,
                    selectedMode === mode.id && {
                      borderColor: mode.color,
                      backgroundColor: mode.backgroundColor,
                    },
                  ]}
                  onPress={() => setSelectedMode(mode.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modeEmoji}>{mode.emoji}</Text>
                  <Text style={[styles.modeLabel, { color: mode.color }]}>
                    {getModeLabel(mode.id)}
                  </Text>
                  <Text style={styles.modeDescription}>{getModeDescription(mode.id)}</Text>
                  {selectedMode === mode.id && (
                    <View style={[styles.selectedCheck, { backgroundColor: mode.color }]}>
                      <Ionicons name="checkmark" size={14} color={colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Duration selection */}
            <Text style={styles.sectionTitle}>{t('availabilityModes.duration')}</Text>

            <View style={styles.durationsContainer}>
              {MODE_DURATIONS.map((duration) => {
                const isLocked = duration === 72 && !canUse72Hours;
                const isSelected = selectedDuration === duration;

                return (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationCard,
                      isSelected && styles.durationCardSelected,
                      isLocked && styles.durationCardLocked,
                    ]}
                    onPress={() => {
                      if (isLocked) {
                        onUpgrade?.();
                      } else {
                        setSelectedDuration(duration);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.durationLabel,
                        isSelected && styles.durationLabelSelected,
                        isLocked && styles.durationLabelLocked,
                      ]}
                    >
                      {getDurationLabel(duration)}
                    </Text>
                    {isLocked && (
                      <View style={styles.lockBadge}>
                        <Ionicons name="lock-closed" size={12} color={colors.warning} />
                        <Text style={styles.lockText}>{t('availabilityModes.premium')}</Text>
                      </View>
                    )}
                    {isSelected && !isLocked && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Warning for free users */}
            {!hasRemainingActivations && (
              <View style={styles.warningBox}>
                <Ionicons name="warning-outline" size={20} color={colors.warning} />
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>{t('availabilityModes.limitReached')}</Text>
                  <Text style={styles.warningText}>
                    {t('availabilityModes.limitReachedMessage')}
                  </Text>
                </View>
                <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
                  <Text style={styles.upgradeButtonText}>{t('availabilityModes.seeOffers')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            {isLoading ? (
              <View style={styles.loadingButton}>
                <ActivityIndicator color={colors.white} />
              </View>
            ) : (
              <Button
                title={t('availabilityModes.activateButton')}
                onPress={handleActivate}
                disabled={!selectedMode || !hasRemainingActivations}
                size="large"
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  usageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  usageText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  usageCount: {
    color: colors.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modesContainer: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: spacing.sm,
  },
  modeEmoji: {
    fontSize: 24,
  },
  modeLabel: {
    ...typography.bodyMedium,
    fontWeight: '600',
    minWidth: 80,
  },
  modeDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  selectedCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  durationCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: spacing.xs,
  },
  durationCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  durationCardLocked: {
    opacity: 0.7,
  },
  durationLabel: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '500',
  },
  durationLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  durationLabelLocked: {
    color: colors.textSecondary,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  lockText: {
    fontSize: 10,
    color: colors.warning,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '15',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    ...typography.bodyMedium,
    color: colors.warning,
    fontWeight: '600',
  },
  warningText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  upgradeButton: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  upgradeButtonText: {
    ...typography.labelSmall,
    color: colors.white,
    fontWeight: '600',
  },
  actions: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  loadingButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ModeActivationModal;
