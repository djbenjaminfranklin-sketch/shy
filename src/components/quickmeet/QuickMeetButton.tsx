import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { colors } from '../../theme/colors';

interface QuickMeetButtonProps {
  onPress: () => void;
  hasActiveProposal?: boolean;
  isRecipient?: boolean;
  disabled?: boolean;
}

export function QuickMeetButton({
  onPress,
  hasActiveProposal = false,
  isRecipient = false,
  disabled = false,
}: QuickMeetButtonProps) {
  const { t } = useLanguage();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        hasActiveProposal && styles.buttonActive,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Ionicons
        name="cafe-outline"
        size={20}
        color={hasActiveProposal ? colors.primary : colors.text}
      />
      <Text
        style={[
          styles.buttonText,
          hasActiveProposal && styles.buttonTextActive,
        ]}
      >
        {hasActiveProposal
          ? isRecipient
            ? t('quickMeet.viewProposal')
            : t('quickMeet.proposalSent')
          : t('quickMeet.button')}
      </Text>
      {hasActiveProposal && isRecipient && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>1</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  buttonActive: {
    backgroundColor: colors.primaryLight,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  buttonTextActive: {
    color: colors.primary,
  },
  badge: {
    backgroundColor: colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default QuickMeetButton;
