import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    if (!email) {
      setError(t('forgotPasswordScreen.enterEmail'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: resetError } = await resetPassword(email);
      if (resetError) {
        setError(resetError);
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      setError(t('forgotPasswordScreen.errorOccurred'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContent}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>✓</Text>
          </View>
          <Text style={styles.title}>{t('forgotPasswordScreen.emailSent')}</Text>
          <Text style={styles.description}>
            {t('forgotPasswordScreen.codeSentTo').replace('{email}', email)}
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push({ pathname: '/(auth)/reset-password', params: { email } })}
          >
            <Text style={styles.primaryButtonText}>{t('forgotPasswordScreen.enterCode')}</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.secondaryButtonText}>{t('forgotPasswordScreen.backToLogin')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backText}>{t('forgotPasswordScreen.back')}</Text>
            </Pressable>
            <Text style={styles.title}>{t('forgotPasswordScreen.title')}</Text>
            <Text style={styles.subtitle}>
              {t('forgotPasswordScreen.subtitle')}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('forgotPasswordScreen.emailLabel')}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('forgotPasswordScreen.emailPlaceholder')}
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleReset}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.textLight} />
              ) : (
                <Text style={styles.primaryButtonText}>{t('forgotPasswordScreen.sendCode')}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  successContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backText: {
    ...typography.body,
    color: colors.primary,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 40,
    color: colors.textLight,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  inputContainer: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.textLight,
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  secondaryButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
