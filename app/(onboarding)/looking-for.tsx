import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useOnboarding } from '../../src/contexts/OnboardingContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { GenderId } from '../../src/constants/genders';

const LOOKING_FOR_OPTIONS: { id: GenderId; label: string; icon: string }[] = [
  { id: 'femme', label: 'Femmes', icon: 'female' },
  { id: 'homme', label: 'Hommes', icon: 'male' },
  { id: 'non-binaire', label: 'Non-genre', icon: 'transgender' },
];

export default function LookingForScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const { t } = useLanguage();
  const [selected, setSelected] = useState<GenderId[]>(data.genderFilter || []);

  const toggleOption = (id: GenderId) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    updateData({ genderFilter: selected });
    router.push('/(onboarding)/interests');
  };

  const canContinue = selected.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.progress}>
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>

        <View style={styles.iconContainer}>
          <Text style={styles.icon}>💕</Text>
        </View>

        <Text style={styles.title}>Qui recherchez-vous ?</Text>
        <Text style={styles.subtitle}>
          Selectionnez une ou plusieurs options
        </Text>

        <View style={styles.optionsContainer}>
          {LOOKING_FOR_OPTIONS.map((option) => {
            const isSelected = selected.includes(option.id);
            return (
              <Pressable
                key={option.id}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => toggleOption(option.id)}
              >
                <View style={[styles.iconCircle, isSelected && styles.iconCircleSelected]}>
                  <Ionicons
                    name={option.icon as any}
                    size={32}
                    color={isSelected ? colors.textLight : colors.text}
                  />
                </View>
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </Pressable>
          <Pressable
            style={[styles.button, !canContinue && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!canContinue}
          >
            <Text style={styles.buttonText}>{t('common.continue')}</Text>
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
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconCircleSelected: {
    backgroundColor: colors.primary,
  },
  optionLabel: {
    ...typography.h4,
    color: colors.text,
    flex: 1,
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  checkmark: {
    marginLeft: spacing.sm,
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
