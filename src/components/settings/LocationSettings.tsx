import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useLocation } from '../../contexts/LocationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useTravelMode } from '../../hooks/useTravelMode';
import { TravelModeModal, TravelModeBadge } from '../travel';
import { SettingsSection } from './SettingsSection';

interface LocationSettingsProps {
  showTravelModal: boolean;
  setShowTravelModal: (show: boolean) => void;
}

export const LocationSettings = ({ showTravelModal, setShowTravelModal }: LocationSettingsProps) => {
  const router = useRouter();
  const { isEnabled: locationEnabled, enableLocation, disableLocation, isLoading } = useLocation();
  const { t } = useLanguage();
  const { refreshProfile } = useAuth();
  useSubscription();
  const {
    travelMode,
    canUseTravelMode,
    hasActiveTravelMode,
    isCurrentlyTraveling,
    activateTravelMode,
    deactivateTravelMode,
    searchCities,
  } = useTravelMode();

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

  return (
    <>
      {/* Location Section */}
      <SettingsSection title={t('settings.locationSection')}>
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
      </SettingsSection>

      {/* Travel Mode Section (Premium) */}
      <SettingsSection title="">
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('settings.travelMode')}</Text>
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
                  t('settings.travelModeDeactivateTitle'),
                  t('settings.travelModeDeactivateMessage'),
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    { text: t('settings.travelModeDeactivate'), style: 'destructive', onPress: deactivateTravelMode },
                  ]
                );
              }}
            >
              <Text style={styles.deactivateText}>{t('settings.travelModeDeactivate')}</Text>
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
                {t('settings.travelModeActivate')}
              </Text>
              <Text style={styles.travelButtonSubtitle}>
                {canUseTravelMode
                  ? t('settings.travelModeExplore')
                  : t('settings.travelModeUpgrade')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </SettingsSection>

      {/* Travel Mode Modal */}
      <TravelModeModal
        visible={showTravelModal}
        onClose={() => setShowTravelModal(false)}
        onActivate={activateTravelMode}
        searchCities={searchCities}
      />
    </>
  );
};

const styles = StyleSheet.create({
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
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
});
