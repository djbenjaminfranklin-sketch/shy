import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getModeConfig } from '../../constants/availabilityModes';
import { useLanguage } from '../../contexts/LanguageContext';
import { colors } from '../../theme/colors';
import type { AvailabilityModeType } from '../../types/availabilityMode';

interface ActiveModeIndicatorProps {
  modeType: AvailabilityModeType;
  remainingTime: string;
  isExpiringSoon?: boolean;
  onPress?: () => void;
  onDeactivate?: () => void;
}

export function ActiveModeIndicator({
  modeType,
  remainingTime,
  isExpiringSoon = false,
  onPress,
  onDeactivate,
}: ActiveModeIndicatorProps) {
  const { t } = useLanguage();
  const config = getModeConfig(modeType);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderColor: isExpiringSoon ? colors.warning : config.color,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <Text style={styles.emoji}>{config.emoji}</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.modeLabel, { color: config.color }]}>
            {t('availabilityModes.modeActive')}
          </Text>
          <View style={styles.timeRow}>
            <Ionicons
              name="time-outline"
              size={12}
              color={isExpiringSoon ? colors.warning : 'rgba(255,255,255,0.7)'}
            />
            <Text
              style={[
                styles.timeText,
                isExpiringSoon && styles.timeTextWarning,
              ]}
            >
              {remainingTime}
            </Text>
          </View>
        </View>
      </View>
      {onDeactivate && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onDeactivate}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 18,
  },
  textContainer: {
    gap: 2,
  },
  modeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  timeTextWarning: {
    color: colors.warning,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

export default ActiveModeIndicator;
