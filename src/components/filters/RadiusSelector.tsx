import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { CustomSlider } from '../ui/CustomSlider';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import {
  SEARCH_RADIUS_OPTIONS,
  MAX_SEARCH_RADIUS,
  MIN_SEARCH_RADIUS,
  DEFAULT_SEARCH_RADIUS,
  SearchRadius,
} from '../../constants';
import { useLocation } from '../../contexts/LocationContext';

interface RadiusSelectorProps {
  /** Valeur initiale du rayon */
  initialRadius?: SearchRadius;
  /** Callback appele quand le rayon change */
  onRadiusChange?: (radius: SearchRadius) => void;
  /** Afficher le compteur de profils */
  showProfileCount?: boolean;
  /** Callback appele quand la sauvegarde reussit */
  onSave?: () => void;
  /** Afficher les boutons predefinis */
  showPresetButtons?: boolean;
  /** Style personnalise pour le conteneur */
  style?: object;
}

/**
 * Composant de selection du rayon de recherche
 *
 * Permet de selectionner un rayon de 5 a 100 km avec:
 * - Un slider visuel
 * - Des boutons predefinis (5, 10, 25, 50, 100 km)
 * - Un apercu du nombre de profils dans ce rayon
 */
export function RadiusSelector({
  initialRadius = DEFAULT_SEARCH_RADIUS,
  onRadiusChange,
  showProfileCount = true,
  onSave,
  showPresetButtons = true,
  style,
}: RadiusSelectorProps) {
  const { searchRadius, setSearchRadius, getProfilesInRadius, isEnabled } = useLocation();

  const [localRadius, setLocalRadius] = useState<number>(initialRadius);
  const [profileCount, setProfileCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialiser avec la valeur du contexte
  useEffect(() => {
    if (searchRadius) {
      setLocalRadius(searchRadius);
    }
  }, [searchRadius]);

  // Charger le nombre de profils
  const loadProfileCount = useCallback(async () => {
    if (!showProfileCount || !isEnabled) return;

    setIsLoadingCount(true);
    try {
      const { count, error: countError } = await getProfilesInRadius();
      if (!countError) {
        setProfileCount(count);
      }
    } catch (err) {
      // Ignorer les erreurs silencieusement
    } finally {
      setIsLoadingCount(false);
    }
  }, [showProfileCount, isEnabled, getProfilesInRadius]);

  // Charger le compte initial
  useEffect(() => {
    loadProfileCount();
  }, [loadProfileCount]);

  // Arrondir le slider a la valeur predefinie la plus proche
  const snapToNearestValue = (value: number): SearchRadius => {
    let closest: SearchRadius = SEARCH_RADIUS_OPTIONS[0];
    let minDiff = Math.abs(value - closest);

    for (const option of SEARCH_RADIUS_OPTIONS) {
      const diff = Math.abs(value - option);
      if (diff < minDiff) {
        minDiff = diff;
        closest = option;
      }
    }

    return closest;
  };

  // Gerer le changement du slider
  const handleSliderChange = (value: number) => {
    setLocalRadius(Math.round(value));
  };

  // Gerer la fin du drag du slider
  const handleSliderComplete = async (value: number) => {
    const snappedValue = snapToNearestValue(value);
    setLocalRadius(snappedValue);

    // Sauvegarder la valeur
    await saveRadius(snappedValue);
  };

  // Sauvegarder le rayon
  const saveRadius = async (radius: SearchRadius) => {
    setIsSaving(true);
    setError(null);

    try {
      const { error: saveError } = await setSearchRadius(radius);

      if (saveError) {
        setError(saveError);
        return;
      }

      onRadiusChange?.(radius);
      onSave?.();

      // Recharger le nombre de profils
      if (showProfileCount) {
        await loadProfileCount();
      }
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  // Selectionner un preset
  const handlePresetSelect = async (radius: SearchRadius) => {
    setLocalRadius(radius);
    await saveRadius(radius);
  };

  // Obtenir la couleur du preset
  const getPresetColor = (radius: SearchRadius) => {
    if (radius === localRadius) {
      return colors.primary;
    }
    return colors.border;
  };

  // Obtenir le texte descriptif
  const getRadiusDescription = () => {
    if (localRadius <= 5) return 'Tres proche';
    if (localRadius <= 10) return 'Proche';
    if (localRadius <= 25) return 'Dans le quartier';
    if (localRadius <= 50) return 'Dans la ville';
    return 'Dans la region';
  };

  return (
    <View style={[styles.container, style]}>
      {/* Titre et description */}
      <View style={styles.header}>
        <Text style={styles.title}>Rayon de recherche</Text>
        <Text style={styles.description}>{getRadiusDescription()}</Text>
      </View>

      {/* Affichage de la distance */}
      <View style={styles.distanceDisplay}>
        <Text style={styles.distanceValue}>{localRadius}</Text>
        <Text style={styles.distanceUnit}>km</Text>
      </View>

      {/* Slider */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>{MIN_SEARCH_RADIUS} km</Text>
        <CustomSlider
          style={styles.slider}
          minimumValue={MIN_SEARCH_RADIUS}
          maximumValue={MAX_SEARCH_RADIUS}
          value={localRadius}
          onValueChange={handleSliderChange}
          onSlidingComplete={handleSliderComplete}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
          step={1}
          disabled={isSaving}
        />
        <Text style={styles.sliderLabel}>{MAX_SEARCH_RADIUS} km</Text>
      </View>

      {/* Boutons predefinis */}
      {showPresetButtons && (
        <View style={styles.presetsContainer}>
          {SEARCH_RADIUS_OPTIONS.map((radius) => (
            <Pressable
              key={radius}
              style={[
                styles.presetButton,
                {
                  backgroundColor: radius === localRadius ? colors.primary : colors.background,
                  borderColor: getPresetColor(radius),
                },
              ]}
              onPress={() => handlePresetSelect(radius)}
              disabled={isSaving}
            >
              <Text
                style={[
                  styles.presetButtonText,
                  {
                    color: radius === localRadius ? colors.white : colors.text,
                  },
                ]}
              >
                {radius} km
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Compteur de profils */}
      {showProfileCount && isEnabled && (
        <View style={styles.profileCountContainer}>
          {isLoadingCount ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : profileCount !== null ? (
            <View style={styles.profileCountContent}>
              <Text style={styles.profileCountNumber}>{profileCount}</Text>
              <Text style={styles.profileCountLabel}>
                {profileCount === 1 ? 'profil' : 'profils'} dans ce rayon
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Message si geoloc desactivee */}
      {!isEnabled && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            Activez la geolocalisation pour voir les profils a proximite
          </Text>
        </View>
      )}

      {/* Indicateur de sauvegarde */}
      {isSaving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.savingText}>Enregistrement...</Text>
        </View>
      )}

      {/* Erreur */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  distanceDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  distanceValue: {
    fontSize: 64,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 72,
  },
  distanceUnit: {
    fontSize: typography.h2.fontSize,
    fontWeight: '500',
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: spacing.sm,
  },
  sliderLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textTertiary,
    width: 45,
    textAlign: 'center',
  },
  presetsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  presetButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    minWidth: 60,
    alignItems: 'center',
  },
  presetButtonText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  profileCountContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  profileCountContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  profileCountNumber: {
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    color: colors.success,
    marginRight: spacing.xs,
  },
  profileCountLabel: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  warningContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.md,
  },
  warningText: {
    fontSize: typography.caption.fontSize,
    color: colors.textWarm,
    textAlign: 'center',
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  savingText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  errorContainer: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.sm,
  },
  errorText: {
    fontSize: typography.caption.fontSize,
    color: colors.error,
    textAlign: 'center',
  },
});

export default RadiusSelector;
