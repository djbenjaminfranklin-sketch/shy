import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { INTENTION_LIST, IntentionId } from '../../src/constants/intentions';
import { useOnboarding } from '../../src/contexts/OnboardingContext';

export default function IntentionScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [selectedIntention, setSelectedIntention] = useState<IntentionId | null>(
    (data.intention as IntentionId) || null
  );

  const handleContinue = () => {
    if (!selectedIntention) return;
    updateData({ intention: selectedIntention });
    router.push('/(onboarding)/interests');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.progress}>
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>

        <Text style={styles.title}>Quelle est votre intention ?</Text>
        <Text style={styles.subtitle}>
          Cela aide les autres a comprendre ce que vous recherchez
        </Text>

        <View style={styles.intentions}>
          {INTENTION_LIST.map((intention) => (
            <Pressable
              key={intention.id}
              style={[
                styles.intentionCard,
                selectedIntention === intention.id && styles.intentionCardSelected,
                { borderColor: intention.color },
              ]}
              onPress={() => setSelectedIntention(intention.id)}
            >
              <View
                style={[
                  styles.intentionIcon,
                  { backgroundColor: intention.color + '20' },
                ]}
              >
                <Text style={styles.intentionEmoji}>
                  {intention.id === 'social' && '💬'}
                  {intention.id === 'dating' && '❤️'}
                  {intention.id === 'amical' && '🤝'}
                  {intention.id === 'local' && '📍'}
                </Text>
              </View>
              <View style={styles.intentionText}>
                <Text style={styles.intentionLabel}>{intention.label}</Text>
                <Text style={styles.intentionDescription}>
                  {intention.description}
                </Text>
              </View>
              {selectedIntention === intention.id && (
                <View style={[styles.checkmark, { backgroundColor: intention.color }]}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </Pressable>
          <Pressable
            style={[styles.button, !selectedIntention && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!selectedIntention}
          >
            <Text style={styles.buttonText}>Continuer</Text>
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
    marginBottom: spacing.xl,
  },
  intentions: {
    gap: spacing.md,
  },
  intentionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  intentionCardSelected: {
    backgroundColor: colors.surface,
  },
  intentionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  intentionEmoji: {
    fontSize: 24,
  },
  intentionText: {
    flex: 1,
  },
  intentionLabel: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  intentionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 'auto',
    marginBottom: spacing.lg,
  },
  backButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    ...typography.button,
    color: colors.text,
  },
  button: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...typography.button,
    color: colors.textLight,
  },
});
