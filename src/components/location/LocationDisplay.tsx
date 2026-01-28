import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { useLocation } from '../../contexts/LocationContext';

interface LocationDisplayProps {
  onPress?: () => void;
  compact?: boolean;
}

export function LocationDisplay({ onPress, compact = false }: LocationDisplayProps) {
  const { isEnabled, city, neighborhood, getLocationDisplayName, isLoading } = useLocation();

  if (!isEnabled) {
    return (
      <TouchableOpacity style={styles.disabledContainer} onPress={onPress}>
        <Ionicons name="location-outline" size={16} color={colors.textTertiary} />
        <Text style={styles.disabledText}>Position désactivée</Text>
      </TouchableOpacity>
    );
  }

  const displayName = getLocationDisplayName();

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={onPress}>
        <Ionicons name="location" size={14} color={colors.primary} />
        <Text style={styles.compactText} numberOfLines={1}>
          {isLoading ? 'Localisation...' : displayName}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name="location" size={20} color={colors.primary} />
      </View>
      <View style={styles.textContainer}>
        {neighborhood && (
          <Text style={styles.neighborhood}>{neighborhood}</Text>
        )}
        <Text style={styles.city} numberOfLines={1}>
          {isLoading ? 'Localisation en cours...' : city || displayName}
        </Text>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  neighborhood: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  city: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  disabledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  disabledText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
});

export default LocationDisplay;
