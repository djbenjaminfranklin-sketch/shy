import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Chip } from '../ui/Chip';
import { profilesService } from '../../services/supabase/profiles';
import { GENDER_LIST, GenderId } from '../../constants/genders';
import { MIN_AGE, MAX_AGE } from '../../constants';
import { SettingsSection } from './SettingsSection';

export const PreferencesSettings = () => {
  const { t } = useLanguage();
  const { user, profile, refreshProfile } = useAuth();

  // Filter states
  const [searchRadius, setSearchRadius] = useState<number>(profile?.searchRadius || 25);
  const [minAge, setMinAge] = useState(profile?.minAgeFilter || MIN_AGE);
  const [maxAge, setMaxAge] = useState(profile?.maxAgeFilter || MAX_AGE);
  const [genderFilter, setGenderFilter] = useState<GenderId[]>(profile?.genderFilter || []);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update state when profile loads
  useEffect(() => {
    if (profile) {
      setSearchRadius(profile.searchRadius || 25);
      setMinAge(profile.minAgeFilter || MIN_AGE);
      setMaxAge(profile.maxAgeFilter || MAX_AGE);
      setGenderFilter(profile.genderFilter || []);
    }
  }, [profile]);

  // Track changes
  useEffect(() => {
    if (profile) {
      const changed =
        searchRadius !== profile.searchRadius ||
        minAge !== profile.minAgeFilter ||
        maxAge !== profile.maxAgeFilter ||
        JSON.stringify(genderFilter.sort()) !== JSON.stringify((profile.genderFilter || []).sort());
      setHasChanges(changed);
    }
  }, [searchRadius, minAge, maxAge, genderFilter, profile]);

  const toggleGender = (gender: GenderId) => {
    setGenderFilter((prev) =>
      prev.includes(gender) ? prev.filter((g) => g !== gender) : [...prev, gender]
    );
  };

  const savePreferences = async () => {
    if (!user || !hasChanges) return;

    setIsSaving(true);
    try {
      const { error } = await profilesService.updateProfile(user.id, {
        searchRadius,
        minAgeFilter: minAge,
        maxAgeFilter: maxAge,
        genderFilter,
      });

      if (error) {
        Alert.alert(t('alerts.errorTitle'), error);
      } else {
        await refreshProfile();
        setHasChanges(false);
        Alert.alert(t('alerts.successTitle'), t('settings.preferencesSaved'));
      }
    } catch (err) {
      Alert.alert(t('alerts.errorTitle'), t('errors.somethingWrong'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsSection title={t('settings.searchPreferences')}>
      {/* Distance Slider */}
      <View style={styles.filterItem}>
        <Text style={styles.filterLabel}>
          {t('settings.maxDistance')}: {searchRadius} km
        </Text>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderValue}>5 km</Text>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={100}
            value={searchRadius}
            step={1}
            onValueChange={(value) => setSearchRadius(Math.round(value))}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <Text style={styles.sliderValue}>100 km</Text>
        </View>
      </View>

      {/* Age Range */}
      <View style={styles.filterItem}>
        <Text style={styles.filterLabel}>
          {t('settings.ageRange')}: {minAge} - {maxAge} {t('common.years')}
        </Text>
        <Text style={styles.filterHint}>{t('settings.minAge')}</Text>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderValue}>{MIN_AGE}</Text>
          <Slider
            style={styles.slider}
            minimumValue={MIN_AGE}
            maximumValue={MAX_AGE}
            value={minAge}
            step={1}
            onValueChange={(value) => {
              const newMin = Math.round(value);
              setMinAge(newMin);
              if (newMin > maxAge) setMaxAge(newMin);
            }}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <Text style={styles.sliderValue}>{MAX_AGE}</Text>
        </View>
        <Text style={styles.filterHint}>{t('settings.maxAge')}</Text>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderValue}>{MIN_AGE}</Text>
          <Slider
            style={styles.slider}
            minimumValue={MIN_AGE}
            maximumValue={MAX_AGE}
            value={maxAge}
            step={1}
            onValueChange={(value) => {
              const newMax = Math.round(value);
              setMaxAge(newMax);
              if (newMax < minAge) setMinAge(newMax);
            }}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <Text style={styles.sliderValue}>{MAX_AGE}</Text>
        </View>
      </View>

      {/* Gender Filter */}
      <View style={styles.filterItem}>
        <Text style={styles.filterLabel}>{t('settings.lookingFor')}</Text>
        <Text style={styles.filterHint}>{t('settings.lookingForHint')}</Text>
        <View style={styles.chipContainer}>
          {GENDER_LIST.map((gender) => (
            <Chip
              key={gender.id}
              label={gender.label}
              selected={genderFilter.includes(gender.id)}
              onPress={() => toggleGender(gender.id)}
            />
          ))}
        </View>
      </View>

      {/* Save Button */}
      {hasChanges && (
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={savePreferences}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? t('settings.saving') : t('settings.savePreferences')}
          </Text>
        </TouchableOpacity>
      )}
    </SettingsSection>
  );
};

const styles = StyleSheet.create({
  filterItem: {
    marginBottom: spacing.lg,
  },
  filterLabel: {
    ...typography.bodyMedium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  filterHint: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sliderValue: {
    ...typography.caption,
    color: colors.textSecondary,
    width: 60,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.bodyMedium,
    color: colors.white,
    fontWeight: '600',
  },
});
