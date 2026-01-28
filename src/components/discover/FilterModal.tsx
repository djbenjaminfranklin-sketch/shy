import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { CustomSlider } from '../ui/CustomSlider';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { ProfileFilters } from '../../types/profile';
import { GENDER_LIST, GenderId } from '../../constants/genders';
import { INTENTION_LIST, IntentionId } from '../../constants/intentions';
import { SEARCH_RADIUS_OPTIONS, SearchRadius, MIN_AGE, MAX_AGE } from '../../constants';
import { Chip } from '../ui/Chip';
import { Button } from '../ui/Button';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: ProfileFilters;
  onApply: (filters: ProfileFilters) => void;
}

export function FilterModal({ visible, onClose, filters, onApply }: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<ProfileFilters>(filters);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({
      searchRadius: 25,
      minAge: MIN_AGE,
      maxAge: MAX_AGE,
      genders: [],
      intentions: [],
      hairColors: [],
      languages: [],
      interests: [],
    });
  };

  const toggleGender = (gender: GenderId) => {
    setLocalFilters((prev) => ({
      ...prev,
      genders: prev.genders.includes(gender)
        ? prev.genders.filter((g) => g !== gender)
        : [...prev.genders, gender],
    }));
  };

  const toggleIntention = (intention: IntentionId) => {
    setLocalFilters((prev) => ({
      ...prev,
      intentions: prev.intentions.includes(intention)
        ? prev.intentions.filter((i) => i !== intention)
        : [...prev.intentions, intention],
    }));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.cancelButton}>Annuler</Text>
          </Pressable>
          <Text style={styles.title}>Filtres</Text>
          <Pressable onPress={handleReset}>
            <Text style={styles.resetButton}>Réinit.</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Distance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distance maximum</Text>
            <View style={styles.radiusOptions}>
              {SEARCH_RADIUS_OPTIONS.map((radius) => (
                <Pressable
                  key={radius}
                  style={[
                    styles.radiusOption,
                    localFilters.searchRadius === radius && styles.radiusOptionSelected,
                  ]}
                  onPress={() => setLocalFilters((prev) => ({ ...prev, searchRadius: radius as SearchRadius }))}
                >
                  <Text
                    style={[
                      styles.radiusText,
                      localFilters.searchRadius === radius && styles.radiusTextSelected,
                    ]}
                  >
                    {radius} km
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Age */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Âge: {localFilters.minAge} - {localFilters.maxAge} ans
            </Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>{MIN_AGE}</Text>
              <CustomSlider
                style={styles.slider}
                minimumValue={MIN_AGE}
                maximumValue={MAX_AGE}
                value={localFilters.minAge}
                onValueChange={(value) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    minAge: Math.round(value),
                  }))
                }
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              <Text style={styles.sliderLabel}>{MAX_AGE}</Text>
            </View>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>{MIN_AGE}</Text>
              <CustomSlider
                style={styles.slider}
                minimumValue={MIN_AGE}
                maximumValue={MAX_AGE}
                value={localFilters.maxAge}
                onValueChange={(value) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    maxAge: Math.round(value),
                  }))
                }
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              <Text style={styles.sliderLabel}>{MAX_AGE}</Text>
            </View>
          </View>

          {/* Genre */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Genre</Text>
            <Text style={styles.sectionHint}>Laissez vide pour tout afficher</Text>
            <View style={styles.chipContainer}>
              {GENDER_LIST.map((gender) => (
                <Chip
                  key={gender.id}
                  label={gender.label}
                  selected={localFilters.genders.includes(gender.id)}
                  onPress={() => toggleGender(gender.id)}
                />
              ))}
            </View>
          </View>

          {/* Intention */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Intention</Text>
            <Text style={styles.sectionHint}>Laissez vide pour tout afficher</Text>
            <View style={styles.chipContainer}>
              {INTENTION_LIST.map((intention) => (
                <Chip
                  key={intention.id}
                  label={intention.labelShort}
                  selected={localFilters.intentions.includes(intention.id)}
                  onPress={() => toggleIntention(intention.id)}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Appliquer les filtres" onPress={handleApply} size="large" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelButton: {
    ...typography.body,
    color: colors.textSecondary,
  },
  title: {
    ...typography.h4,
    color: colors.text,
  },
  resetButton: {
    ...typography.body,
    color: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  radiusOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  radiusOption: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  radiusOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  radiusText: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  radiusTextSelected: {
    color: colors.primary,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    width: 30,
    textAlign: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default FilterModal;
