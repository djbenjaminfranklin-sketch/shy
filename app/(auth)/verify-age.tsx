import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { MIN_AGE } from '../../src/constants';
import { useLanguage } from '../../src/contexts/LanguageContext';

export default function VerifyAgeScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const handleConfirm = () => {
    router.replace('/(onboarding)/profile-photo');
  };

  const handleDecline = () => {
    router.replace('/(auth)/welcome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>18+</Text>
        </View>

        <Text style={styles.title}>{t('verifyAge.title')}</Text>
        <Text style={styles.description}>
          {t('verifyAge.description').replace(/{minAge}/g, String(MIN_AGE))}
        </Text>

        <View style={styles.buttons}>
          <Pressable style={styles.primaryButton} onPress={handleConfirm}>
            <Text style={styles.primaryButtonText}>
              {t('verifyAge.iAmOldEnough').replace('{minAge}', String(MIN_AGE))}
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleDecline}>
            <Text style={styles.secondaryButtonText}>
              {t('verifyAge.iAmTooYoung').replace('{minAge}', String(MIN_AGE))}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.warning}>
          {t('verifyAge.warning')}
        </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  icon: {
    ...typography.h1,
    fontSize: 48,
    color: colors.textLight,
    fontWeight: '800',
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  buttons: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.textLight,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  warning: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
