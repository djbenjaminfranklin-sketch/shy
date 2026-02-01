import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import type { TravelLocation, TravelModeFormData } from '../../types/travelMode';
import { POPULAR_CITIES } from '../../types/travelMode';

interface TravelModeModalProps {
  visible: boolean;
  onClose: () => void;
  onActivate: (formData: TravelModeFormData) => Promise<{ success: boolean; error: string | null }>;
  searchCities: (query: string) => Promise<TravelLocation[]>;
}

// Options de date prédéfinies
const DATE_OPTIONS = [
  { label: 'Demain', days: 1 },
  { label: 'Dans 2 jours', days: 2 },
  { label: 'Dans 3 jours', days: 3 },
  { label: 'Dans 1 semaine', days: 7 },
  { label: 'Dans 2 semaines', days: 14 },
];

export function TravelModeModal({
  visible,
  onClose,
  onActivate,
  searchCities,
}: TravelModeModalProps) {
  const [selectedCity, setSelectedCity] = useState<TravelLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TravelLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number>(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recherche de villes
  useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const results = await searchCities(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    };

    const timeout = setTimeout(search, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, searchCities]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedCity(null);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedDays(1);
      setError(null);
    }
  }, [visible]);

  const handleSelectCity = (city: TravelLocation) => {
    setSelectedCity(city);
    setSearchQuery(city.city);
    setSearchResults([]);
  };

  const handleSubmit = async () => {
    if (!selectedCity) {
      setError('Veuillez sélectionner une destination');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + selectedDays);

    const formData: TravelModeFormData = {
      city: selectedCity.city,
      country: selectedCity.country,
      latitude: selectedCity.latitude,
      longitude: selectedCity.longitude,
      arrivalDate,
      departureDate: undefined,
    };

    const result = await onActivate(formData);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Une erreur est survenue');
    }

    setIsSubmitting(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Mode Voyage</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Description */}
            <View style={styles.descriptionBox}>
              <Ionicons name="airplane" size={24} color={colors.primary} />
              <Text style={styles.description}>
                Explorez les profils d'une ville avant d'y arriver. Parfait pour préparer un voyage !
              </Text>
            </View>

            {/* Recherche de ville */}
            <Text style={styles.label}>Destination</Text>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher une ville..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {isSearching && <ActivityIndicator size="small" color={colors.primary} />}
            </View>

            {/* Résultats de recherche */}
            {searchResults.length > 0 && (
              <View style={styles.resultsContainer}>
                {searchResults.map((city, index) => (
                  <TouchableOpacity
                    key={`${city.city}-${index}`}
                    style={styles.resultItem}
                    onPress={() => handleSelectCity(city)}
                  >
                    <Ionicons name="location" size={18} color={colors.primary} />
                    <Text style={styles.resultText}>
                      {city.city}, {city.country}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Villes populaires */}
            {!selectedCity && searchResults.length === 0 && (
              <>
                <Text style={styles.sectionTitle}>Villes populaires</Text>
                <View style={styles.popularCities}>
                  {POPULAR_CITIES.slice(0, 8).map((city, index) => (
                    <TouchableOpacity
                      key={`${city.city}-${index}`}
                      style={styles.popularCity}
                      onPress={() => handleSelectCity(city)}
                    >
                      <Text style={styles.popularCityText}>{city.city}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Ville sélectionnée */}
            {selectedCity && (
              <View style={styles.selectedCity}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.selectedCityText}>
                  {selectedCity.city}, {selectedCity.country}
                </Text>
                <TouchableOpacity onPress={() => setSelectedCity(null)}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Date d'arrivée */}
            <Text style={styles.label}>Quand arrivez-vous ?</Text>
            <View style={styles.dateOptions}>
              {DATE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.days}
                  style={[
                    styles.dateOption,
                    selectedDays === option.days && styles.dateOptionSelected,
                  ]}
                  onPress={() => setSelectedDays(option.days)}
                >
                  <Text
                    style={[
                      styles.dateOptionText,
                      selectedDays === option.days && styles.dateOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Erreur */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>

          {/* Bouton d'activation */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.activateButton, (!selectedCity || isSubmitting) && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={!selectedCity || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="airplane" size={20} color={colors.white} />
                  <Text style={styles.activateButtonText}>Activer le Mode Voyage</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: spacing.xs,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: spacing.lg,
  },
  descriptionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary + '15',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  description: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  resultsContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xs,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultText: {
    ...typography.body,
    color: colors.text,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  popularCities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  popularCity: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  popularCityText: {
    ...typography.body,
    color: colors.text,
  },
  selectedCity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success + '15',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  selectedCityText: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.text,
  },
  dateOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dateOption: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  dateOptionText: {
    ...typography.body,
    color: colors.text,
  },
  dateOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error + '15',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  activateButtonText: {
    ...typography.bodyMedium,
    color: colors.white,
  },
});

export default TravelModeModal;
