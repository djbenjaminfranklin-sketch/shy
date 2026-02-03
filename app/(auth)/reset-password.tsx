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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { supabase } from '../../src/services/supabase/client';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);

  // Extraire le token de l'URL et vérifier avec Supabase
  useEffect(() => {
    const handleDeepLink = async () => {
      try {
        console.log('[ResetPassword] Params:', params);

        // Récupérer le token depuis les query params
        const token = params.token as string;
        const tokenHash = params.token_hash as string;
        const accessToken = params.access_token as string;
        const type = params.type as string;

        console.log('[ResetPassword] Token:', token);
        console.log('[ResetPassword] TokenHash:', tokenHash);
        console.log('[ResetPassword] AccessToken:', accessToken);
        console.log('[ResetPassword] Type:', type);

        // Si on a un token_hash (nouveau format Supabase), l'utiliser
        if (tokenHash) {
          console.log('[ResetPassword] Verifying with token_hash...');
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });

          if (verifyError) {
            console.error('[ResetPassword] Verify error:', verifyError);
            setError('Lien de réinitialisation invalide ou expiré.');
          } else if (data.session) {
            console.log('[ResetPassword] Session established via token_hash!');
            setIsSessionReady(true);
          }
          return;
        }

        // Si on a un token simple, l'utiliser avec verifyOtp
        if (token) {
          console.log('[ResetPassword] Verifying with token...');
          // Pour le token simple, on a besoin de l'email - essayer de récupérer depuis la session ou params
          const email = params.email as string;

          if (email) {
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
              email: email,
              token: token,
              type: 'recovery',
            });

            if (verifyError) {
              console.error('[ResetPassword] Verify error:', verifyError);
              setError('Lien de réinitialisation invalide ou expiré.');
            } else if (data.session) {
              console.log('[ResetPassword] Session established via token!');
              setIsSessionReady(true);
            }
          } else {
            setError('Email manquant dans le lien.');
          }
          return;
        }

        // Si on a un access_token direct (ancien format)
        if (accessToken) {
          const refreshToken = params.refresh_token as string;
          if (refreshToken) {
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error('[ResetPassword] Session error:', sessionError);
              setError('Lien de réinitialisation invalide ou expiré.');
            } else if (data.session) {
              console.log('[ResetPassword] Session established via access_token!');
              setIsSessionReady(true);
            }
            return;
          }
        }

        // Pas de tokens valides trouvés, vérifier si une session existe déjà
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsSessionReady(true);
        } else {
          // Attendre un peu et réessayer
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              setIsSessionReady(true);
            } else {
              setError('Lien de réinitialisation invalide ou expiré. Veuillez réessayer.');
            }
          }, 2000);
        }
      } catch (err) {
        console.error('[ResetPassword] Error:', err);
        setError('Une erreur est survenue.');
      }
    };

    handleDeepLink();

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[ResetPassword] Auth state change:', event);
      if (event === 'PASSWORD_RECOVERY' && session) {
        setIsSessionReady(true);
      }
      if (event === 'SIGNED_IN' && session) {
        setIsSessionReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [params]);

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
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
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

  if (!isSessionReady && !error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Vérification du lien...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !isSessionReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContent}>
          <View style={[styles.iconContainer, styles.errorIcon]}>
            <Text style={styles.icon}>✕</Text>
          </View>
          <Text style={styles.title}>Lien invalide</Text>
          <Text style={styles.description}>{error}</Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace('/(auth)/forgot-password')}
          >
            <Text style={styles.primaryButtonText}>Réessayer</Text>
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
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  successContent: {
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
  errorIcon: {
    backgroundColor: colors.error,
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
});
