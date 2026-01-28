import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { INTENTIONS, IntentionId } from '../../constants/intentions';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface IntentionBadgeProps {
  intention: IntentionId;
  size?: 'small' | 'medium';
}

export function IntentionBadge({ intention, size = 'medium' }: IntentionBadgeProps) {
  const config = INTENTIONS[intention];

  if (!config) return null;

  return (
    <View style={[styles.container, styles[size], { backgroundColor: config.color + '20' }]}>
      <Text style={styles.emoji}>
        {intention === 'social' && '💬'}
        {intention === 'dating' && '❤️'}
        {intention === 'amical' && '🤝'}
        {intention === 'local' && '📍'}
      </Text>
      <Text style={[styles.text, styles[`${size}Text`], { color: config.color }]}>
        {config.labelShort}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  medium: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  emoji: {
    fontSize: 14,
  },
  text: {
    fontWeight: '600',
  },
  smallText: {
    ...typography.caption,
  },
  mediumText: {
    ...typography.labelSmall,
  },
});

export default IntentionBadge;
