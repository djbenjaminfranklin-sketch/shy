import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Pressable, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useLocation } from '../../src/contexts/LocationContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { SupportedLanguage } from '../../src/i18n';
import { Chip } from '../../src/components/ui/Chip';
import { profilesService } from '../../src/services/supabase/profiles';
import { GENDER_LIST, GenderId } from '../../src/constants/genders';
import { MIN_AGE, MAX_AGE } from '../../src/constants';
import { useSubscription } from '../../src/contexts/SubscriptionContext';
import { useTravelMode } from '../../src/hooks/useTravelMode';
import { TravelModeModal, TravelModeBadge } from '../../src/components/travel';

const LANGUAGES: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { isEnabled: locationEnabled, enableLocation, disableLocation, isLoading } = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { user, profile, refreshProfile } = useAuth();
  useSubscription(); // Pour vérifier l'accès aux features
  const {
    travelMode,
    canUseTravelMode,
    hasActiveTravelMode,
    isCurrentlyTraveling,
    activateTravelMode,
    deactivateTravelMode,
    searchCities,
  } = useTravelMode();
  const [showTravelModal, setShowTravelModal] = useState(false);

  // Filter states
  const [searchRadius, setSearchRadius] = useState<number>(profile?.searchRadius || 25);
  const [minAge, setMinAge] = useState(profile?.minAgeFilter || MIN_AGE);
  const [maxAge, setMaxAge] = useState(profile?.maxAgeFilter || MAX_AGE);
  const [genderFilter, setGenderFilter] = useState<GenderId[]>(profile?.genderFilter || []);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Notification states (local pour l'instant - à connecter au backend plus tard)
  const [notifInvitations, setNotifInvitations] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifSound, setNotifSound] = useState(true);

  // Update state when profile loads
  useEffect(() => {
    if (profile) {
      setSearchRadius(profile.searchRadius || 25);
      setMinAge(profile.minAgeFilter || MIN_AGE);
      setMaxAge(profile.maxAgeFilter || MAX_AGE);
      setGenderFilter(profile.genderFilter || []);
      // Load notification preferences from profile
      setNotifInvitations(profile.notificationInvitations ?? true);
      setNotifMessages(profile.notificationMessages ?? true);
      setNotifSound(profile.notificationSound ?? true);
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

  const handleLocationToggle = async (value: boolean) => {
    try {
      if (value) {
        const { error } = await enableLocation();
        if (error) {
          Alert.alert(t('alerts.errorTitle'), error);
          return;
        }
      } else {
        const { error } = await disableLocation();
        if (error) {
          Alert.alert(t('alerts.errorTitle'), error);
          return;
        }
      }
      // Refresh profile to ensure sync between contexts
      await refreshProfile();
    } catch (err) {
      Alert.alert(t('alerts.errorTitle'), t('errors.somethingWrong'));
    }
  };

  const handleLanguageChange = (langCode: SupportedLanguage) => {
    setLanguage(langCode);
  };

  const toggleGender = (gender: GenderId) => {
    setGenderFilter((prev) =>
      prev.includes(gender) ? prev.filter((g) => g !== gender) : [...prev, gender]
    );
  };

  // Notification handlers - save immediately to database
  const handleNotifInvitationsChange = async (value: boolean) => {
    setNotifInvitations(value);
    if (user) {
      await profilesService.updateProfile(user.id, {
        notificationInvitations: value,
      });
    }
  };

  const handleNotifMessagesChange = async (value: boolean) => {
    setNotifMessages(value);
    if (user) {
      await profilesService.updateProfile(user.id, {
        notificationMessages: value,
      });
    }
  };

  const handleNotifSoundChange = async (value: boolean) => {
    setNotifSound(value);
    if (user) {
      await profilesService.updateProfile(user.id, {
        notificationSound: value,
      });
    }
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.replace('/(tabs)/profile')}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scrollView}>
        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.languageSection')}</Text>
          <View style={styles.languageOptions}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  language === lang.code && styles.languageOptionActive,
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.languageLabel,
                    language === lang.code && styles.languageLabelActive,
                  ]}
                >
                  {lang.label}
                </Text>
                {language === lang.code && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.locationSection')}</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.enableLocation')}</Text>
              <Text style={styles.settingDescription}>{t('settings.locationDescription')}</Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={handleLocationToggle}
              disabled={isLoading}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={locationEnabled ? colors.white : '#F4F4F4'}
              ios_backgroundColor={colors.border}
            />
          </View>
          <Text style={styles.settingHint}>{t('settings.locationHint')}</Text>
        </View>

        {/* Travel Mode Section (Premium) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mode Voyage</Text>
            {!canUseTravelMode && (
              <View style={styles.premiumBadge}>
                <Ionicons name="diamond" size={12} color={colors.white} />
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            )}
          </View>

          {hasActiveTravelMode && travelMode ? (
            <View style={styles.travelActiveContainer}>
              <TravelModeBadge
                city={travelMode.destination.city}
                arrivalDate={travelMode.arrivalDate}
                isCurrentlyTraveling={isCurrentlyTraveling}
              />
              <TouchableOpacity
                style={styles.deactivateButton}
                onPress={() => {
                  Alert.alert(
                    'Désactiver le Mode Voyage',
                    'Voulez-vous revenir à votre localisation réelle ?',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Désactiver', style: 'destructive', onPress: deactivateTravelMode },
                    ]
                  );
                }}
              >
                <Text style={styles.deactivateText}>Désactiver</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.travelButton, !canUseTravelMode && styles.travelButtonDisabled]}
              onPress={() => {
                if (canUseTravelMode) {
                  setShowTravelModal(true);
                } else {
                  router.push('/profile/subscription');
                }
              }}
            >
              <Ionicons name="airplane" size={20} color={canUseTravelMode ? colors.primary : colors.textSecondary} />
              <View style={styles.travelButtonContent}>
                <Text style={[styles.travelButtonTitle, !canUseTravelMode && styles.travelButtonTitleDisabled]}>
                  Activer le Mode Voyage
                </Text>
                <Text style={styles.travelButtonSubtitle}>
                  {canUseTravelMode
                    ? 'Explorez une ville avant d\'y arriver'
                    : 'Passez à Premium pour débloquer'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.searchPreferences')}</Text>

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
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.newInvitations')}</Text>
              <Text style={styles.settingDescription}>{t('settings.newInvitationsDesc')}</Text>
            </View>
            <Switch
              value={notifInvitations}
              onValueChange={handleNotifInvitationsChange}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.border}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.messagesNotif')}</Text>
              <Text style={styles.settingDescription}>{t('settings.messagesNotifDesc')}</Text>
            </View>
            <Switch
              value={notifMessages}
              onValueChange={handleNotifMessagesChange}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.border}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.soundVibration')}</Text>
              <Text style={styles.settingDescription}>{t('settings.soundVibrationDesc')}</Text>
            </View>
            <Switch
              value={notifSound}
              onValueChange={handleNotifSoundChange}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.accountSection')}</Text>
          <Text style={styles.settingHint}>{t('settings.accountHint')}</Text>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Légal</Text>
          <TouchableOpacity
            style={styles.legalItem}
            onPress={() => router.push('/legal/terms')}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.legalItemText}>Conditions d'utilisation</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.legalItem}
            onPress={() => router.push('/legal/privacy-policy')}
          >
            <Ionicons name="shield-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.legalItemText}>Politique de confidentialité</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.legalItem}
            onPress={() => router.push('/legal/disclaimer')}
          >
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.legalItemText}>Mentions légales</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Help Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aide</Text>
          <TouchableOpacity
            style={styles.legalItem}
            onPress={() => Linking.openURL('https://shydating.eu/help')}
          >
            <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.legalItemText}>Centre d'aide</Text>
            <Ionicons name="open-outline" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.legalItem}
            onPress={() => Linking.openURL('mailto:contact@shydating.eu')}
          >
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.legalItemText}>Nous contacter</Text>
            <Ionicons name="open-outline" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Travel Mode Modal */}
      <TravelModeModal
        visible={showTravelModal}
        onClose={() => setShowTravelModal(false)}
        onActivate={activateTravelMode}
        searchCities={searchCities}
      />
    </SafeAreaView>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.text,
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  settingDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingHint: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },

  // Language selector
  languageOptions: {
    gap: spacing.sm,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  languageLabel: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.text,
  },
  languageLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Filter styles
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
  // Travel Mode styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  premiumBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  travelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  travelButtonDisabled: {
    opacity: 0.7,
  },
  travelButtonContent: {
    flex: 1,
  },
  travelButtonTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  travelButtonTitleDisabled: {
    color: colors.textSecondary,
  },
  travelButtonSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  travelActiveContainer: {
    gap: spacing.md,
  },
  deactivateButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
  },
  deactivateText: {
    ...typography.body,
    color: colors.error,
  },
  // Legal items
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  legalItemText: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
});
