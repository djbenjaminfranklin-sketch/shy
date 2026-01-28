import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface DistanceIndicatorProps {
  distance: number | null;
}

export function DistanceIndicator({ distance }: DistanceIndicatorProps) {
  if (distance === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.text}>Position masquée</Text>
      </View>
    );
  }

  const displayDistance = distance < 1 ? '< 1' : distance.toString();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📍</Text>
      <Text style={styles.text}>{displayDistance} km</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  icon: {
    fontSize: 14,
  },
  text: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});

export default DistanceIndicator;
