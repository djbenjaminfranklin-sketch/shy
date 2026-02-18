import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AVAILABILITY_OPTIONS, AvailabilityId } from '../../constants/availability';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface AvailabilityBadgeProps {
  availability: AvailabilityId | null;
  size?: 'small' | 'medium' | 'large';
}

export function AvailabilityBadge({ availability, size = 'medium' }: AvailabilityBadgeProps) {
  if (!availability) return null;

  const config = AVAILABILITY_OPTIONS[availability];
  if (!config) return null;

  return (
    <View style={[styles.container, styles[`${size}Container`]]}>
      <View style={[styles.dot, styles[`${size}Dot`]]} />
      <Text style={[styles.text, styles[`${size}Text`]]}>{config.labelShort}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  smallContainer: {
    gap: 3,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  mediumContainer: {
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  largeContainer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  dot: {
    backgroundColor: colors.success,
  },
  smallDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  mediumDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  largeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    color: colors.success,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    ...typography.caption,
  },
  largeText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AvailabilityBadge;
