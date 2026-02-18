import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';
import {
  DRINKING_OPTIONS,
  SMOKING_OPTIONS,
  CHILDREN_OPTIONS,
  HEIGHT_RANGE,
  DrinkingId,
  SmokingId,
  ChildrenId,
} from '../../../constants/lifestyle';

interface LifestyleFieldsProps {
  height: number | null;
  onHeightChange: (value: number | null) => void;
  drinking: DrinkingId | null;
  onDrinkingChange: (value: DrinkingId | null) => void;
  smoking: SmokingId | null;
  onSmokingChange: (value: SmokingId | null) => void;
  children: ChildrenId | null;
  onChildrenChange: (value: ChildrenId | null) => void;
}

export function LifestyleFields({
  height,
  onHeightChange,
  drinking,
  onDrinkingChange,
  smoking,
  onSmokingChange,
  children,
  onChildrenChange,
}: LifestyleFieldsProps) {
  return (
    <>
      {/* Taille */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Taille (optionnel)</Text>
        <View style={styles.heightContainer}>
          <Pressable
            style={styles.heightButton}
            onPress={() => onHeightChange(Math.max(HEIGHT_RANGE.min, (height || HEIGHT_RANGE.default) - 1))}
          >
            <Ionicons name="remove" size={24} color={colors.primary} />
          </Pressable>
          <View style={styles.heightDisplay}>
            <Text style={styles.heightValue}>
              {height ? `${height} cm` : '-- cm'}
            </Text>
          </View>
          <Pressable
            style={styles.heightButton}
            onPress={() => onHeightChange(Math.min(HEIGHT_RANGE.max, (height || HEIGHT_RANGE.default) + 1))}
          >
            <Ionicons name="add" size={24} color={colors.primary} />
          </Pressable>
        </View>
        {!height && (
          <Pressable onPress={() => onHeightChange(HEIGHT_RANGE.default)}>
            <Text style={styles.setHeightLink}>Definir ma taille</Text>
          </Pressable>
        )}
      </View>

      {/* Alcool */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alcool</Text>
        <View style={styles.chipContainer}>
          {DRINKING_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              style={[
                styles.optionChip,
                drinking === option.id && styles.optionChipSelected,
              ]}
              onPress={() => onDrinkingChange(drinking === option.id ? null : option.id)}
            >
              <Ionicons
                name={option.icon as keyof typeof Ionicons.glyphMap}
                size={18}
                color={drinking === option.id ? colors.textLight : colors.text}
              />
              <Text
                style={[
                  styles.optionText,
                  drinking === option.id && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Tabac */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tabac</Text>
        <View style={styles.chipContainer}>
          {SMOKING_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              style={[
                styles.optionChip,
                smoking === option.id && styles.optionChipSelected,
              ]}
              onPress={() => onSmokingChange(smoking === option.id ? null : option.id)}
            >
              <Text
                style={[
                  styles.optionText,
                  smoking === option.id && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Enfants */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enfants</Text>
        <View style={styles.chipContainer}>
          {CHILDREN_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              style={[
                styles.optionChip,
                children === option.id && styles.optionChipSelected,
              ]}
              onPress={() => onChildrenChange(children === option.id ? null : option.id)}
            >
              <Text
                style={[
                  styles.optionText,
                  children === option.id && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </>
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
  heightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  heightButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heightDisplay: {
    width: 100,
    alignItems: 'center',
  },
  heightValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  setHeightLink: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.textLight,
  },
});
