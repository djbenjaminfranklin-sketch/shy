import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomSlider } from '../ui/CustomSlider';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { ProfileFilters } from '../../types/profile';
import { GENDER_LIST, GenderId } from '../../constants/genders';
import { INTENTION_LIST, IntentionId } from '../../constants/intentions';
import { SearchRadius, MIN_AGE, MAX_AGE } from '../../constants';
import { Chip } from '../ui/Chip';
import { Button } from '../ui/Button';
import type { TravelMode, TravelLocation } from '../../types/travelMode';
import { POPULAR_CITIES } from '../../types/travelMode';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: ProfileFilters;
  onApply: (filters: ProfileFilters) => void;
  // Travel Mode props
  travelMode?: TravelMode | null;
  canUseTravelMode?: boolean;
  onActivateTravelMode?: (city: TravelLocation, arrivalDate: Date) => Promise<{ success: boolean; error: string | null }>;
  onDeactivateTravelMode?: () => Promise<{ success: boolean; error: string | null }>;
  onUpgradeToPremium?: () => void;
}

export function FilterModal({
  visible,
  onClose,
  filters,
  onApply,
  travelMode,
  canUseTravelMode = false,
  onActivateTravelMode,
  onDeactivateTravelMode,
  onUpgradeToPremium,
}: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<ProfileFilters>(filters);

  // Travel Mode state
  const [showTravelSearch, setShowTravelSearch] = useState(false);
  const [travelSearchQuery, setTravelSearchQuery] = useState('');
  const [travelSearchResults, setTravelSearchResults] = useState<TravelLocation[]>([]);
  const [selectedTravelCity, setSelectedTravelCity] = useState<TravelLocation | null>(null);
  const [isTravelLoading, setIsTravelLoading] = useState(false);
  const [travelError, setTravelError] = useState<string | null>(null);

  // Search cities effect
  useEffect(() => {
    if (travelSearchQuery.length < 2) {
      setTravelSearchResults([]);
      return;
    }

    const normalizedQuery = travelSearchQuery.toLowerCase().trim();
    const results = POPULAR_CITIES.filter(
      (city) =>
        city.city.toLowerCase().includes(normalizedQuery) ||
        city.country.toLowerCase().includes(normalizedQuery)
    );
    setTravelSearchResults(results);
  }, [travelSearchQuery]);

  // Reset travel search when modal opens
  useEffect(() => {
    if (visible) {
      setShowTravelSearch(false);
      setTravelSearchQuery('');
      setTravelSearchResults([]);
      setSelectedTravelCity(null);
      setTravelError(null);
    }
  }, [visible]);

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

  // Handle travel mode activation
  const handleSelectTravelCity = (city: TravelLocation) => {
    setSelectedTravelCity(city);
    setTravelSearchQuery(city.city);
    setTravelSearchResults([]);
  };

  const handleActivateTravelMode = async () => {
    if (!selectedTravelCity || !onActivateTravelMode) return;

    setIsTravelLoading(true);
    setTravelError(null);

    // Default arrival date: tomorrow
    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + 1);

    const result = await onActivateTravelMode(selectedTravelCity, arrivalDate);

    if (result.success) {
      setShowTravelSearch(false);
      setSelectedTravelCity(null);
      setTravelSearchQuery('');
    } else {
      setTravelError(result.error || 'Une erreur est survenue');
    }

    setIsTravelLoading(false);
  };

  const handleDeactivateTravelMode = async () => {
    if (!onDeactivateTravelMode) return;

    setIsTravelLoading(true);
    const result = await onDeactivateTravelMode();
    if (!result.success) {
      setTravelError(result.error || 'Une erreur est survenue');
    }
    setIsTravelLoading(false);
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
          {/* Localisation */}
          <View style={styles.section}>
            <View style={styles.travelHeader}>
              <View style={styles.travelTitleRow}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Ma position</Text>
              </View>
              {!canUseTravelMode && (
                <TouchableOpacity
                  style={styles.premiumBadge}
                  onPress={onUpgradeToPremium}
                >
                  <Ionicons name="star" size={12} color={colors.white} />
                  <Text style={styles.premiumBadgeText}>Premium</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Bouton 1: Ma position actuelle (toujours visible) */}
            <TouchableOpacity
              style={[
                styles.locationOptionButton,
                !travelMode && styles.locationOptionButtonActive,
              ]}
              onPress={travelMode ? handleDeactivateTravelMode : undefined}
              disabled={isTravelLoading || !travelMode}
            >
              {isTravelLoading && travelMode ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons
                    name="navigate"
                    size={22}
                    color={!travelMode ? colors.primary : colors.textSecondary}
                  />
                  <View style={styles.locationOptionText}>
                    <Text style={[
                      styles.locationOptionTitle,
                      !travelMode && styles.locationOptionTitleActive,
                    ]}>
                      Ma position actuelle
                    </Text>
                    <Text style={styles.locationOptionSubtitle}>
                      Utiliser ma localisation GPS
                    </Text>
                  </View>
                  {!travelMode && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </>
              )}
            </TouchableOpacity>

            {/* Bouton 2: Mode Voyage (Premium) */}
            {canUseTravelMode ? (
              travelMode ? (
                // Mode voyage actif - afficher la destination
                <View style={[styles.locationOptionButton, styles.locationOptionButtonActive]}>
                  <Ionicons name="airplane" size={22} color={colors.primary} />
                  <View style={styles.locationOptionText}>
                    <Text style={styles.locationOptionTitleActive}>
                      {travelMode.destination.city}, {travelMode.destination.country}
                    </Text>
                    <Text style={styles.locationOptionSubtitle}>
                      Mode Voyage actif
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                </View>
              ) : (
                // Mode voyage inactif - permettre de choisir une ville
                <TouchableOpacity
                  style={styles.locationOptionButton}
                  onPress={() => setShowTravelSearch(true)}
                >
                  <Ionicons name="airplane" size={22} color={colors.textSecondary} />
                  <View style={styles.locationOptionText}>
                    <Text style={styles.locationOptionTitle}>Mode Voyage</Text>
                    <Text style={styles.locationOptionSubtitle}>
                      Explorer une autre ville
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              )
            ) : (
              // Premium requis
              <TouchableOpacity
                style={styles.locationOptionButton}
                onPress={onUpgradeToPremium}
              >
                <Ionicons name="airplane" size={22} color={colors.textTertiary} />
                <View style={styles.locationOptionText}>
                  <Text style={[styles.locationOptionTitle, { color: colors.textTertiary }]}>
                    Mode Voyage
                  </Text>
                  <Text style={styles.locationOptionSubtitle}>
                    Réservé aux abonnés Premium
                  </Text>
                </View>
                <Ionicons name="lock-closed" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}

            {/* Modal de recherche de ville */}
            {showTravelSearch && canUseTravelMode && (
              <View style={styles.travelSearchContainer}>
                <View style={styles.travelSearchInputRow}>
                  <Ionicons name="search" size={18} color={colors.textSecondary} />
                  <TextInput
                    style={styles.travelSearchInput}
                    placeholder="Rechercher une ville..."
                    placeholderTextColor={colors.textTertiary}
                    value={travelSearchQuery}
                    onChangeText={setTravelSearchQuery}
                    autoFocus
                  />
                  <TouchableOpacity onPress={() => {
                    setShowTravelSearch(false);
                    setTravelSearchQuery('');
                    setSelectedTravelCity(null);
                  }}>
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Résultats de recherche */}
                {travelSearchResults.length > 0 && (
                  <View style={styles.travelSearchResults}>
                    {travelSearchResults.slice(0, 6).map((city, index) => (
                      <TouchableOpacity
                        key={`${city.city}-${index}`}
                        style={styles.travelSearchResultItem}
                        onPress={() => handleSelectTravelCity(city)}
                      >
                        <Ionicons name="location" size={16} color={colors.primary} />
                        <Text style={styles.travelSearchResultText}>
                          {city.city}, {city.country}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Villes populaires */}
                {travelSearchQuery.length < 2 && (
                  <View style={styles.travelPopularCities}>
                    {POPULAR_CITIES.map((city, index) => (
                      <TouchableOpacity
                        key={`${city.city}-${index}`}
                        style={styles.travelPopularCity}
                        onPress={() => handleSelectTravelCity(city)}
                      >
                        <Text style={styles.travelPopularCityText}>{city.city}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Ville sélectionnée */}
                {selectedTravelCity && (
                  <TouchableOpacity
                    style={styles.travelConfirmButton}
                    onPress={handleActivateTravelMode}
                    disabled={isTravelLoading}
                  >
                    {isTravelLoading ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <Ionicons name="airplane" size={18} color={colors.white} />
                        <Text style={styles.travelConfirmButtonText}>
                          Aller à {selectedTravelCity.city}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {travelError && (
                  <Text style={styles.travelErrorText}>{travelError}</Text>
                )}
              </View>
            )}
          </View>

          {/* Distance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distance maximum : {localFilters.searchRadius} km</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>5</Text>
              <CustomSlider
                style={styles.slider}
                minimumValue={5}
                maximumValue={100}
                value={localFilters.searchRadius}
                onValueChange={(value) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    searchRadius: Math.round(value) as SearchRadius,
                  }))
                }
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
                step={1}
              />
              <Text style={styles.sliderLabel}>100</Text>
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
  // Location styles
  travelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  travelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  premiumBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 11,
  },
  locationOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  locationOptionButtonActive: {
    backgroundColor: colors.primary + '15',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  locationOptionText: {
    flex: 1,
  },
  locationOptionTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  locationOptionTitleActive: {
    color: colors.primary,
  },
  locationOptionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  travelSearchContainer: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  travelSearchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  travelSearchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  travelSearchResults: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    maxHeight: 200,
  },
  travelSearchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  travelSearchResultText: {
    ...typography.body,
    color: colors.text,
  },
  travelPopularCities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  travelPopularCity: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  travelPopularCityText: {
    ...typography.body,
    color: colors.text,
  },
  travelConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  travelConfirmButtonText: {
    ...typography.bodyMedium,
    color: colors.white,
  },
  travelErrorText: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
  },
});

export default FilterModal;
