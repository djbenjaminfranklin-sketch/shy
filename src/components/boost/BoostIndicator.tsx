import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useBoostCountdown } from '../../hooks/useBoostCountdown';

interface BoostIndicatorProps {
  expiresAt: string | null;
  onExpire?: () => void;
  compact?: boolean;
}

export function BoostIndicator({ expiresAt, onExpire, compact = false }: BoostIndicatorProps) {
  const { formattedTime, isExpired } = useBoostCountdown(expiresAt, onExpire);

  if (!expiresAt || isExpired) {
    return null;
  }

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Ionicons name="flash" size={14} color={colors.boost} />
        <Text style={styles.compactTime}>{formattedTime}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="flash" size={16} color={colors.white} />
      </View>
      <Text style={styles.time}>{formattedTime}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.boost,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    shadowColor: colors.boost,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    ...typography.labelSmall,
    color: colors.white,
    fontWeight: '700',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.boost + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  compactTime: {
    ...typography.caption,
    color: colors.boost,
    fontWeight: '600',
  },
});

export default BoostIndicator;
