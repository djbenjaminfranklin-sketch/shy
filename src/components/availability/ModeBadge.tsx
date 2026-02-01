import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getModeConfig } from '../../constants/availabilityModes';
import { useLanguage } from '../../contexts/LanguageContext';
import type { AvailabilityModeType } from '../../types/availabilityMode';

interface ModeBadgeProps {
  modeType: AvailabilityModeType;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: object;
}

export function ModeBadge({ modeType, showLabel = true, size = 'medium', style }: ModeBadgeProps) {
  const { t } = useLanguage();
  const config = getModeConfig(modeType);
  const badgeText = t(`availabilityModes.${modeType}Badge`);

  const sizeStyles = {
    small: {
      paddingHorizontal: 6,
      paddingVertical: 3,
      fontSize: 10,
      emojiSize: 10,
      borderRadius: 8,
    },
    medium: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      fontSize: 12,
      emojiSize: 12,
      borderRadius: 12,
    },
    large: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      fontSize: 14,
      emojiSize: 14,
      borderRadius: 16,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
          borderRadius: currentSize.borderRadius,
        },
        style,
      ]}
    >
      <Text style={[styles.emoji, { fontSize: currentSize.emojiSize }]}>{config.emoji}</Text>
      {showLabel && (
        <Text
          style={[
            styles.label,
            {
              color: config.color,
              fontSize: currentSize.fontSize,
            },
          ]}
        >
          {badgeText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  emoji: {
    lineHeight: 16,
  },
  label: {
    fontWeight: '600',
  },
});

export default ModeBadge;
