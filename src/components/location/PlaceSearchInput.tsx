import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { googlePlacesService, PlacePrediction, PlaceResult } from '../../services/google';

interface PlaceSearchInputProps {
  placeholder?: string;
  onPlaceSelected: (place: PlaceResult) => void;
  currentLocation?: { latitude: number; longitude: number } | null;
  onClear?: () => void;
}

export function PlaceSearchInput({
  placeholder = 'Rechercher un lieu...',
  onPlaceSelected,
  currentLocation,
  onClear,
}: PlaceSearchInputProps) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchPlaces = useCallback(async (text: string) => {
    if (text.length < 2) {
      setPredictions([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    setShowResults(true);

    const { predictions: results } = await googlePlacesService.searchPlaces(text, {
      latitude: currentLocation?.latitude,
      longitude: currentLocation?.longitude,
      radius: 50000, // 50km
    });

    setPredictions(results);
    setIsLoading(false);
  }, [currentLocation]);

  const handleChangeText = useCallback((text: string) => {
    setQuery(text);

    // Debounce la recherche
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 300);
  }, [searchPlaces]);

  const handleSelectPrediction = useCallback(async (prediction: PlacePrediction) => {
    Keyboard.dismiss();
    setIsLoading(true);

    const { place, error } = await googlePlacesService.getPlaceDetails(prediction.placeId);

    setIsLoading(false);
    setShowResults(false);

    if (place && !error) {
      setQuery(prediction.mainText);
      onPlaceSelected(place);
    }
  }, [onPlaceSelected]);

  const handleClear = useCallback(() => {
    setQuery('');
    setPredictions([]);
    setShowResults(false);
    onClear?.();
  }, [onClear]);

  const handleUseCurrentLocation = useCallback(async () => {
    if (!currentLocation) return;

    Keyboard.dismiss();
    setIsLoading(true);

    const { result } = await googlePlacesService.reverseGeocode(
      currentLocation.latitude,
      currentLocation.longitude
    );

    setIsLoading(false);
    setShowResults(false);

    if (result) {
      setQuery(result.city || 'Position actuelle');
      onPlaceSelected({
        placeId: 'current_location',
        name: 'Position actuelle',
        address: result.formattedAddress,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        types: ['current_location'],
      });
    }
  }, [currentLocation, onPlaceSelected]);

  const renderPrediction = ({ item }: { item: PlacePrediction }) => (
    <TouchableOpacity
      style={styles.predictionItem}
      onPress={() => handleSelectPrediction(item)}
    >
      <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
      <View style={styles.predictionText}>
        <Text style={styles.predictionMain} numberOfLines={1}>
          {item.mainText}
        </Text>
        {item.secondaryText && (
          <Text style={styles.predictionSecondary} numberOfLines={1}>
            {item.secondaryText}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Ionicons name="search" size={20} color={colors.textTertiary} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          returnKeyType="search"
          autoCorrect={false}
          onFocus={() => query.length >= 2 && setShowResults(true)}
        />
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={handleClear}>
            <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {showResults && (
        <View style={styles.resultsContainer}>
          {/* Option position actuelle */}
          {currentLocation && (
            <TouchableOpacity
              style={styles.currentLocationItem}
              onPress={handleUseCurrentLocation}
            >
              <View style={styles.currentLocationIcon}>
                <Ionicons name="navigate" size={20} color={colors.primary} />
              </View>
              <Text style={styles.currentLocationText}>Utiliser ma position actuelle</Text>
            </TouchableOpacity>
          )}

          {/* Liste des prédictions */}
          {predictions.length > 0 ? (
            <FlatList
              data={predictions}
              renderItem={renderPrediction}
              keyExtractor={(item) => item.placeId}
              keyboardShouldPersistTaps="handled"
              style={styles.predictionsList}
            />
          ) : !isLoading && query.length >= 2 ? (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>Aucun résultat trouvé</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  resultsContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: 300,
  },
  currentLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  currentLocationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  predictionsList: {
    maxHeight: 200,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  predictionText: {
    flex: 1,
  },
  predictionMain: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  predictionSecondary: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  noResults: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default PlaceSearchInput;
