import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useOnboarding } from '../../src/contexts/OnboardingContext';
import { FaceVerificationCamera } from '../../src/components/verification/FaceVerificationCamera';
import { Button } from '../../src/components/ui/Button';

type ScreenState = 'intro' | 'verification' | 'success';

export default function FaceVerificationScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [screenState, setScreenState] = useState<ScreenState>('intro');

  const handleStartVerification = () => {
    if (!data.photoUri) {
      Alert.alert(
        'Photo requise',
        'Vous devez d\'abord ajouter une photo de profil.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }
    setScreenState('verification');
  };

  const handleVerificationComplete = (verified: boolean, capturedUris: string[]) => {
    if (verified) {
      updateData({ isVerified: true, verificationPhotos: capturedUris });
      setScreenState('success');
    } else {
      Alert.alert(
        'Verification echouee',
        'Le visage detecte ne correspond pas a votre photo de profil. Veuillez reessayer.',
        [{ text: 'Reessayer', onPress: () => setScreenState('intro') }]
      );
    }
  };

  const handleContinue = () => {
    router.push('/(onboarding)/basic-info');
  };

  const handleSkip = () => {
    Alert.alert(
      'Ignorer la verification ?',
      'Votre profil ne sera pas verifie et pourrait avoir moins de visibilite.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Ignorer',
          style: 'destructive',
          onPress: () => {
            updateData({ isVerified: false });
            router.push('/(onboarding)/basic-info');
          },
        },
      ]
    );
  };

  // Ecran de verification camera
  if (screenState === 'verification') {
    return (
      <FaceVerificationCamera
        referencePhotoUri={data.photoUri || ''}
        onVerificationComplete={handleVerificationComplete}
        onCancel={() => setScreenState('intro')}
      />
    );
  }

  // Ecran de succes
  if (screenState === 'success') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>✓</Text>
          </View>

          <Text style={styles.successTitle}>Profil verifie !</Text>
          <Text style={styles.successText}>
            Votre identite a ete confirmee. Vous aurez un badge de verification
            sur votre profil.
          </Text>

          <View style={styles.badgePreview}>
            <View style={styles.badgeContainer}>
              {data.photoUri && (
                <Image source={{ uri: data.photoUri }} style={styles.previewPhoto} />
              )}
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>✓</Text>
              </View>
            </View>
            <Text style={styles.badgeLabel}>Badge de verification</Text>
          </View>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🛡️</Text>
              <Text style={styles.benefitText}>
                Les autres utilisateurs sauront que vous etes authentique
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>💕</Text>
              <Text style={styles.benefitText}>
                Plus de chances d'obtenir des matchs
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>⭐</Text>
              <Text style={styles.benefitText}>
                Priorite dans les resultats de recherche
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Button title="Continuer" onPress={handleContinue} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Ecran d'introduction
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.progress}>
          <View style={styles.progressDot} />
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>

        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔐</Text>
        </View>

        <Text style={styles.title}>Verifiez votre identite</Text>
        <Text style={styles.subtitle}>
          Protegez-vous et les autres des faux profils
        </Text>

        {/* Photo preview */}
        {data.photoUri && (
          <View style={styles.photoPreview}>
            <Image source={{ uri: data.photoUri }} style={styles.previewImage} />
            <Text style={styles.photoLabel}>Votre photo de profil</Text>
          </View>
        )}

        {/* How it works */}
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>Comment ca marche ?</Text>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepLabel}>Regardez la camera</Text>
              <Text style={styles.stepDescription}>
                Positionnez votre visage dans le cadre
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepLabel}>Suivez les instructions</Text>
              <Text style={styles.stepDescription}>
                Tournez la tete a gauche, puis a droite
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepLabel}>Verification automatique</Text>
              <Text style={styles.stepDescription}>
                On verifie que c'est bien vous sur la photo
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Button title="Commencer la verification" onPress={handleStartVerification} />
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Plus tard</Text>
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  photoPreview: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  photoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  stepsContainer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  stepsTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    ...typography.bodyMedium,
    color: colors.textLight,
  },
  stepInfo: {
    flex: 1,
  },
  stepLabel: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  stepDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    marginTop: 'auto',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skipButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  // Success screen
  successIcon: {
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  successEmoji: {
    fontSize: 50,
    color: colors.textLight,
  },
  successTitle: {
    ...typography.h2,
    color: colors.success,
    textAlign: 'center',
  },
  successText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  badgePreview: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  badgeContainer: {
    position: 'relative',
  },
  previewPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.success,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  verifiedBadgeText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  badgeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  benefitsList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  benefitIcon: {
    fontSize: 24,
  },
  benefitText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
});
