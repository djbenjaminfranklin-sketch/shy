import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export const SettingsSection = ({ title, children }: SettingsSectionProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
});
