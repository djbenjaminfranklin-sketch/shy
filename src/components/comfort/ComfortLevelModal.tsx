import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useComfortLevel } from '../../hooks/useComfortLevel';
import { colors } from '../../theme/colors';
import { Button } from '../ui/Button';
import type { ComfortLevelType } from '../../types/comfortLevel';

interface ComfortLevelModalProps {
  visible: boolean;
  onClose: () => void;
  conversationId: string;
  otherUserName: string;
}

export function ComfortLevelModal({
  visible,
  onClose,
  conversationId,
  otherUserName,
}: ComfortLevelModalProps) {
  const { t } = useLanguage();
  const {
    myLevel,
    unlockedLevel,
    isMutual,
    otherUserHigher,
    setLevel,
    reset,
    getAllLevels,
    isLoading,
    state,
  } = useComfortLevel(conversationId);

  const [selectedLevel, setSelectedLevel] = useState<ComfortLevelType>(myLevel);
  const [isSaving, setIsSaving] = useState(false);

  const levels = getAllLevels();

  const handleSave = async () => {
    if (selectedLevel === myLevel) {
      onClose();
      return;
    }

    setIsSaving(true);
    const success = await setLevel(selectedLevel);
    setIsSaving(false);

    if (success) {
      onClose();
    } else {
      Alert.alert(t('common.error'), t('comfortLevel.updateError'));
    }
  };

  const handleReset = () => {
    Alert.alert(
      t('comfortLevel.resetTitle'),
      t('comfortLevel.resetMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            await reset();
            setSelectedLevel('chatting');
            setIsSaving(false);
          },
        },
      ]
    );
  };

  const otherUserLevel = state?.user2Level || 'chatting';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('comfortLevel.title')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Explanation */}
            <View style={styles.explanationCard}>
              <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
              <Text style={styles.explanationText}>
                {t('comfortLevel.explanation')}
              </Text>
            </View>

            {/* Current state info */}
            {otherUserHigher && (
              <View style={styles.infoCard}>
                <Text style={styles.infoIcon}>✨</Text>
                <Text style={styles.infoText}>
                  {t('comfortLevel.otherUserAt', { name: otherUserName })}
                </Text>
              </View>
            )}

            {isMutual && myLevel !== 'chatting' && (
              <View style={[styles.infoCard, styles.mutualCard]}>
                <Text style={styles.infoIcon}>🤝</Text>
                <Text style={styles.infoText}>
                  {t('comfortLevel.mutualLevel')}
                </Text>
              </View>
            )}

            {/* Level selection */}
            <Text style={styles.sectionTitle}>{t('comfortLevel.selectLevel')}</Text>

            {levels.map((level, index) => {
              const isSelected = selectedLevel === level.level;
              const isUnlocked = index <= levels.findIndex(l => l.level === unlockedLevel);
              const isOtherUserLevel = level.level === otherUserLevel;

              return (
                <TouchableOpacity
                  key={level.level}
                  style={[
                    styles.levelCard,
                    isSelected && styles.levelCardSelected,
                    isSelected && { borderColor: level.color },
                  ]}
                  onPress={() => setSelectedLevel(level.level)}
                  activeOpacity={0.7}
                >
                  <View style={styles.levelHeader}>
                    <Text style={styles.levelIcon}>{level.icon}</Text>
                    <View style={styles.levelInfo}>
                      <View style={styles.levelTitleRow}>
                        <Text style={[styles.levelLabel, { color: level.color }]}>
                          {level.label}
                        </Text>
                        {isOtherUserLevel && !isMutual && (
                          <View style={[styles.badge, { backgroundColor: level.color }]}>
                            <Text style={styles.badgeText}>{otherUserName}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.levelDescription}>{level.description}</Text>
                    </View>
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </View>

                  {/* Features */}
                  <View style={styles.featuresContainer}>
                    {level.unlockedFeatures.map((feature, fIndex) => (
                      <View key={fIndex} style={styles.featureRow}>
                        <Ionicons
                          name={isUnlocked ? 'checkmark-circle' : 'lock-closed'}
                          size={16}
                          color={isUnlocked ? colors.success : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.featureText,
                            !isUnlocked && styles.featureTextLocked,
                          ]}
                        >
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Safety info */}
            <View style={styles.safetyCard}>
              <Text style={styles.safetyTitle}>{t('comfortLevel.safetyTitle')}</Text>
              <Text style={styles.safetyText}>{t('comfortLevel.safetyText')}</Text>
              <TouchableOpacity onPress={handleReset} style={styles.resetLink}>
                <Ionicons name="refresh" size={16} color={colors.error} />
                <Text style={styles.resetText}>{t('comfortLevel.resetLevel')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              title={isSaving ? t('common.loading') : t('common.save')}
              onPress={handleSave}
              disabled={isSaving || isLoading}
              style={styles.saveButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  explanationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  explanationText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 10,
  },
  mutualCard: {
    backgroundColor: 'rgba(129, 199, 132, 0.15)',
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  levelCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  levelCardSelected: {
    backgroundColor: colors.background,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  levelIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
  },
  levelDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  featuresContainer: {
    marginTop: 12,
    marginLeft: 40,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: colors.text,
  },
  featureTextLocked: {
    color: colors.textSecondary,
  },
  safetyCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  safetyText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  resetLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resetText: {
    fontSize: 13,
    color: colors.error,
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    width: '100%',
  },
});

export default ComfortLevelModal;
