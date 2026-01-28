import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface LimitIndicatorProps {
  type: 'likes' | 'messages';
  used: number;
  total: number;
  onPress?: () => void;
}

export function LimitIndicator({ type, used, total, onPress }: LimitIndicatorProps) {
  const remaining = Math.max(0, total - used);
  const isUnlimited = total === -1;
  const percentage = isUnlimited ? 100 : Math.min(100, (used / total) * 100);
  const isLow = !isUnlimited && remaining <= 3 && remaining > 0;
  const isEmpty = !isUnlimited && remaining === 0;

  const icon = type === 'likes' ? '❤️' : '💬';
  const label = type === 'likes' ? 'Likes' : 'Messages';

  return (
    <Pressable
      style={[
        styles.container,
        isEmpty && styles.containerEmpty,
        isLow && styles.containerLow,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.icon}>{icon}</Text>

      <View style={styles.info}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${100 - percentage}%` },
              isEmpty && styles.progressFillEmpty,
              isLow && styles.progressFillLow,
            ]}
          />
        </View>
      </View>

      <View style={styles.countContainer}>
        {isUnlimited ? (
          <Text style={styles.unlimited}>∞</Text>
        ) : (
          <>
            <Text style={[styles.count, isEmpty && styles.countEmpty, isLow && styles.countLow]}>
              {remaining}
            </Text>
            <Text style={styles.countTotal}>/{total}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  containerLow: {
    backgroundColor: colors.warning + '15',
  },
  containerEmpty: {
    backgroundColor: colors.error + '15',
  },
  icon: {
    fontSize: 18,
  },
  info: {
    flex: 1,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressFillLow: {
    backgroundColor: colors.warning,
  },
  progressFillEmpty: {
    backgroundColor: colors.error,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  count: {
    ...typography.h4,
    color: colors.text,
  },
  countLow: {
    color: colors.warning,
  },
  countEmpty: {
    color: colors.error,
  },
  countTotal: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  unlimited: {
    ...typography.h3,
    color: colors.primary,
  },
});

export default LimitIndicator;
