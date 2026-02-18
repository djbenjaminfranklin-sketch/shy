import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface SectionHeaderProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  count?: number;
}

export const SectionHeader = ({ title, icon, color, count }: SectionHeaderProps) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionTitleRow}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.sectionTitle}>{title}</Text>
      {count !== undefined && (
        <View style={[styles.countBadge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.countText, { color }]}>{count}</Text>
        </View>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  countText: {
    ...typography.labelSmall,
    fontWeight: '700',
  },
});
