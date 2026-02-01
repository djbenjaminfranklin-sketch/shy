import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface TravelModeBadgeProps {
  city: string;
  arrivalDate: string;
  isCurrentlyTraveling?: boolean;
  compact?: boolean;
}

export function TravelModeBadge({
  city,
  arrivalDate,
  isCurrentlyTraveling = false,
  compact = false,
}: TravelModeBadgeProps) {
  const formatArrival = () => {
    const arrival = new Date(arrivalDate);
    const now = new Date();
    const diffDays = Math.ceil((arrival.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return 'Actuellement';
    } else if (diffDays === 1) {
      return 'Demain';
    } else if (diffDays <= 7) {
      return `Dans ${diffDays} jours`;
    } else {
      return arrival.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Ionicons name="airplane" size={12} color={colors.white} />
        <Text style={styles.compactText}>{city}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isCurrentlyTraveling && styles.containerTraveling]}>
      <Ionicons
        name={isCurrentlyTraveling ? 'location' : 'airplane'}
        size={16}
        color={isCurrentlyTraveling ? colors.success : colors.primary}
      />
      <View style={styles.textContainer}>
        <Text style={styles.city}>{city}</Text>
        <Text style={styles.date}>
          {isCurrentlyTraveling ? 'En visite' : formatArrival()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  containerTraveling: {
    backgroundColor: colors.success + '20',
  },
  textContainer: {
    flex: 1,
  },
  city: {
    ...typography.bodyMedium,
    color: colors.text,
    fontSize: 13,
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  compactText: {
    ...typography.caption,
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
});

export default TravelModeBadge;
