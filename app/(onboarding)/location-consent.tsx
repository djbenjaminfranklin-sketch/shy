import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useOnboarding } from '../../src/contexts/OnboardingContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';

export default function LocationConsentScreen() {
  const router = useRouter();
  const { updateData, completeOnboarding, isSubmitting } = useOnboarding();
  const { refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const finishOnboarding = async (withLocation: boolean, coords?: { latitude: number; longitude: number }) => {
    // Update context with location data
    updateData({
      locationEnabled: withLocation,
      latitude: coords?.latitude || null,
      longitude: coords?.longitude || null,
    });

    // Complete onboarding (upload photo + create profile)
    const { success, error } = await completeOnboarding();

    if (success) {
      // Rafraichir le profil dans AuthContext pour que hasCompletedOnboarding soit mis a jour
      await refreshProfile();
      router.replace('/(tabs)/discover');
    } else {
      Alert.alert(
        t('alerts.errorTitle'),
        error || t('onboarding.profileCreationError'),
        [{ text: t('common.ok') }]
      );
    }
  };

  const enableLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        // Get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        await finishOnboarding(true, {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } else {
        // Permission denied, continue without location
        await finishOnboarding(false);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      // Continue without location on error
      await finishOnboarding(false);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const skipLocation = async () => {
    await finishOnboarding(false);
  };

  const isLoading = isLoadingLocation || isSubmitting;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.progress}>
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={[styles.progressDot, styles.progressActive]} />
        </View>

        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📍</Text>
        </View>

        <Text style={styles.title}>{t('onboarding.enableLocationTitle')}</Text>
        <Text style={styles.description}>{t('onboarding.enableLocationDesc')}</Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🔒</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{t('onboarding.approxLocation')}</Text>
              <Text style={styles.featureDescription}>{t('onboarding.approxLocationDesc')}</Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>👁️</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{t('onboarding.fullControl')}</Text>
              <Text style={styles.featureDescription}>{t('onboarding.fullControlDesc')}</Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🚫</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{t('onboarding.disabledByDefault')}</Text>
              <Text style={styles.featureDescription}>{t('onboarding.disabledByDefaultDesc')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={enableLocation}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.textLight} size="small" />
                <Text style={styles.primaryButtonText}>
                  {isSubmitting ? t('onboarding.creatingProfile') : t('onboarding.gettingLocation')}
                </Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>{t('onboarding.authorizeLocation')}</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={skipLocation}
            disabled={isLoading}
          >
            <Text style={[styles.secondaryButtonText, isLoading && styles.textDisabled]}>
              {t('onboarding.maybeLater')}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border,
  },
  progressActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  iconContainer: {
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  features: {
    gap: spacing.md,
  },
  feature: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  featureDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    marginTop: 'auto',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.textLight,
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  textDisabled: {
    opacity: 0.5,
  },
});
