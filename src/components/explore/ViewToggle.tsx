import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

export type ViewMode = 'map' | 'grid';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  t: (key: string) => string;
}

export const ViewToggle = ({ mode, onChange, t }: ViewToggleProps) => (
  <View style={styles.toggleContainer}>
    <TouchableOpacity
      style={[styles.toggleButton, mode === 'map' && styles.toggleButtonActive]}
      onPress={() => onChange('map')}
    >
      <Ionicons
        name="map"
        size={20}
        color={mode === 'map' ? colors.white : colors.textSecondary}
      />
      <Text style={[styles.toggleText, mode === 'map' && styles.toggleTextActive]}>
        {t('explore.map')}
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.toggleButton, mode === 'grid' && styles.toggleButtonActive]}
      onPress={() => onChange('grid')}
    >
      <Ionicons
        name="grid"
        size={20}
        color={mode === 'grid' ? colors.white : colors.textSecondary}
      />
      <Text style={[styles.toggleText, mode === 'grid' && styles.toggleTextActive]}>
        {t('explore.grid')}
      </Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.white,
  },
});
