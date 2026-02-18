import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { supabase } from '../../src/services/supabase/client';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const routerParams = useLocalSearchParams();

  // État pour le code OTP
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  // État pour le nouveau mot de passe
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);

  // Récupérer l'email depuis les params si disponible
  useEffect(() => {
    if (routerParams.email) {
      setEmail(routerParams.email as string);
    }
  }, [routerParams]);

  // Écouter les changements d'auth (au cas où un deep link fonctionne)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setIsSessionReady(true);
      }
      if (event === 'SIGNED_IN' && session) {
        setIsSessionReady(true);
      }
    });

    // Vérifier si une session existe déjà
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Vérifier si c'est une session de recovery
        setIsSessionReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Vérifier le code OTP
  const handleVerifyCode = async () => {
    if (!email) {
      setError('Veuillez entrer votre adresse email');
      return;
    }

    if (!otpCode || otpCode.length < 6) {
      setError('Veuillez entrer le code reçu par email');
      return;
    }

    setIsVerifyingCode(true);
    setError(null);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otpCode.trim(),
        type: 'recovery',
      });

      if (verifyError) {
        if (verifyError.message.includes('expired')) {
          setError('Le code a expiré. Veuillez demander un nouveau code.');
        } else if (verifyError.message.includes('invalid')) {
          setError('Code invalide. Vérifiez le code et réessayez.');
        } else {
          setError(verifyError.message);
        }
      } else if (data.session) {
        setIsSessionReady(true);
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Changer le mot de passe
  const handleResetPassword = async () => {
    if (!password) {
      setError('Veuillez entrer un nouveau mot de passe');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setIsSuccess(true);
        // Déconnecter après changement de mot de passe
        await supabase.auth.signOut();
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Écran de succès
  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>✓</Text>
          </View>
          <Text style={styles.title}>Mot de passe modifié !</Text>
          <Text style={styles.description}>
            Votre mot de passe a été réinitialisé avec succès.
            Vous pouvez maintenant vous connecter.
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.primaryButtonText}>Se connecter</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Écran de saisie du nouveau mot de passe (après vérification du code)
  if (isSessionReady) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Text style={styles.title}>Nouveau mot de passe</Text>
              <Text style={styles.subtitle}>
                Entrez votre nouveau mot de passe
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nouveau mot de passe</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  autoCapitalize="none"
                  onSubmitEditing={handleResetPassword}
                  returnKeyType="done"
                />
              </View>

              {error && <Text style={styles.error}>{error}</Text>}

              <Pressable
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.textLight} />
                ) : (
                  <Text style={styles.primaryButtonText}>Réinitialiser</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Écran de saisie du code OTP
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Vérification</Text>
            <Text style={styles.subtitle}>
              Collez le code reçu par email
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="votre@email.com"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Code de vérification</Text>
              <TextInput
                style={styles.input}
                value={otpCode}
                onChangeText={setOtpCode}
                placeholder="Collez le code ici"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              style={[styles.primaryButton, isVerifyingCode && styles.buttonDisabled]}
              onPress={handleVerifyCode}
              disabled={isVerifyingCode}
            >
              {isVerifyingCode ? (
                <ActivityIndicator color={colors.textLight} />
              ) : (
                <Text style={styles.primaryButtonText}>Vérifier le code</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.replace('/(auth)/forgot-password')}
            >
              <Text style={styles.secondaryButtonText}>
                Renvoyer le code
              </Text>
            </Pressable>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  centerContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
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
  codeInput: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    fontWeight: '600',
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
  },
  secondaryButtonText: {
    ...typography.body,
    color: colors.primary,
  },
});
