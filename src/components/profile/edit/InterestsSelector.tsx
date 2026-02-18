import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';
import { INTEREST_CATEGORIES } from '../../../constants/interests';

interface InterestsSelectorProps {
  interests: string[];
  onToggleInterest: (interest: string) => void;
}

export function InterestsSelector({
  interests,
  onToggleInterest,
}: InterestsSelectorProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Centres d'interet ({interests.length}/10)</Text>
      {Object.values(INTEREST_CATEGORIES).map((category) => (
        <View key={category.id} style={styles.interestCategory}>
          <Text style={styles.categoryLabel}>{category.label}</Text>
          <View style={styles.chipContainer}>
            {category.interests.map((interest) => (
              <Pressable
                key={interest}
                style={[
                  styles.interestChip,
                  interests.includes(interest) && styles.interestChipSelected,
                ]}
                onPress={() => onToggleInterest(interest)}
              >
                <Text
                  style={[
                    styles.interestText,
                    interests.includes(interest) && styles.interestTextSelected,
                  ]}
                >
                  {interest}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  interestCategory: {
    marginBottom: spacing.md,
  },
  categoryLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  interestChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  interestChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  interestText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  interestTextSelected: {
    color: colors.textLight,
  },
});
