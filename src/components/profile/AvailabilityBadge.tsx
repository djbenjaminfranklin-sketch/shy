import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AVAILABILITY_OPTIONS, AvailabilityId } from '../../constants/availability';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface AvailabilityBadgeProps {
  availability: AvailabilityId | null;
}

export function AvailabilityBadge({ availability }: AvailabilityBadgeProps) {
  if (!availability) return null;

  const config = AVAILABILITY_OPTIONS[availability];
  if (!config) return null;

  return (
    <View style={styles.container}>
      <View style={styles.dot} />
      <Text style={styles.text}>{config.labelShort}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.success + '20',
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  text: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
});

export default AvailabilityBadge;
