import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { MIN_AGE } from '../../src/constants';

export default function VerifyAgeScreen() {
  const router = useRouter();

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

        <Text style={styles.title}>Vérification d'âge</Text>
        <Text style={styles.description}>
          SHY est réservé aux personnes âgées de {MIN_AGE} ans et plus.
          {'\n\n'}
          En continuant, vous confirmez que vous avez au moins {MIN_AGE} ans et que
          vous acceptez nos conditions d'utilisation.
        </Text>

        <View style={styles.buttons}>
          <Pressable style={styles.primaryButton} onPress={handleConfirm}>
            <Text style={styles.primaryButtonText}>
              J'ai {MIN_AGE} ans ou plus
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleDecline}>
            <Text style={styles.secondaryButtonText}>
              J'ai moins de {MIN_AGE} ans
            </Text>
          </Pressable>
        </View>

        <Text style={styles.warning}>
          L'utilisation de cette application par des mineurs est strictement interdite.
          Tout compte suspecté d'appartenir à un mineur sera supprimé immédiatement.
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
