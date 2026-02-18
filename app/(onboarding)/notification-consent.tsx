import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { supabase } from '../../src/services/supabase/client';
import { useAuth } from '../../src/contexts/AuthContext';

export default function NotificationConsentScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const registerPushToken = async () => {
    if (!user) return;

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      // Sauvegarder le token dans le profil
      await supabase
        .from('profiles')
        .update({ push_token: token.data })
        .eq('id', user.id);
    } catch (error) {
      // Silently fail - token registration is not critical
    }
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        await registerPushToken();
      }

      // Continuer vers l'écran suivant que la permission soit accordée ou non
      router.replace('/(onboarding)/location-consent');
    } catch (error) {
      Alert.alert(
        t('alerts.errorTitle'),
        t('errors.somethingWrong'),
        [{ text: t('common.ok'), onPress: () => router.replace('/(onboarding)/location-consent') }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipNotifications = () => {
    router.replace('/(onboarding)/location-consent');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.progress}>
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressDot} />
        </View>

        <View style={styles.iconContainer}>
          <Ionicons name="notifications" size={48} color={colors.primary} />
        </View>

        <Text style={styles.title}>{t('notificationConsent.title')}</Text>
        <Text style={styles.description}>{t('notificationConsent.description')}</Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="heart" size={24} color={colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{t('notificationConsent.newMatches')}</Text>
              <Text style={styles.featureDescription}>{t('notificationConsent.newMatchesDesc')}</Text>
            </View>
          </View>

          <View style={styles.feature}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="chatbubble" size={24} color={colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{t('notificationConsent.newMessages')}</Text>
              <Text style={styles.featureDescription}>{t('notificationConsent.newMessagesDesc')}</Text>
            </View>
          </View>

          <View style={styles.feature}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="person-add" size={24} color={colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{t('notificationConsent.invitations')}</Text>
              <Text style={styles.featureDescription}>{t('notificationConsent.invitationsDesc')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.privacyNote}>
          <Ionicons name="shield-checkmark" size={20} color={colors.success} />
          <Text style={styles.privacyNoteText}>{t('notificationConsent.privacyNote')}</Text>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleEnableNotifications}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.textLight} size="small" />
                <Text style={styles.primaryButtonText}>{t('common.loading')}</Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>{t('notificationConsent.enable')}</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={handleSkipNotifications}
            disabled={isLoading}
          >
            <Text style={[styles.secondaryButtonText, isLoading && styles.textDisabled]}>
              {t('notificationConsent.skip')}
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
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
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
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  privacyNoteText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
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
