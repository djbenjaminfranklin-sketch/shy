import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface InterestChipsProps {
  interests: string[];
  maxDisplay?: number;
}

export function InterestChips({ interests, maxDisplay = 5 }: InterestChipsProps) {
  const displayedInterests = interests.slice(0, maxDisplay);
  const remaining = interests.length - maxDisplay;

  return (
    <View style={styles.container}>
      {displayedInterests.map((interest, index) => (
        <View key={index} style={styles.chip}>
          <Text style={styles.chipText}>{interest}</Text>
        </View>
      ))}
      {remaining > 0 && (
        <View style={[styles.chip, styles.moreChip]}>
          <Text style={styles.moreText}>+{remaining}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    ...typography.caption,
    color: colors.text,
  },
  moreChip: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  moreText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default InterestChips;
