import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { GENDER_LIST, GenderId } from '../../src/constants/genders';
import { HAIR_COLOR_LIST, HairColorId } from '../../src/constants/hairColors';
import { useOnboarding } from '../../src/contexts/OnboardingContext';

export default function BasicInfoScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  const [displayName, setDisplayName] = useState(data.displayName);
  const [birthDateStr, setBirthDateStr] = useState('');
  const [gender, setGender] = useState<GenderId | ''>(data.gender as GenderId || '');
  const [hairColor, setHairColor] = useState<HairColorId | null>(null);

  // Format birth date from context
  useEffect(() => {
    if (data.birthDate) {
      const d = data.birthDate;
      setBirthDateStr(
        `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
      );
    }
  }, []);

  // Parse date string to Date object
  const parseBirthDate = (str: string): Date | null => {
    if (str.length !== 10) return null;
    const [day, month, year] = str.split('/').map(Number);
    if (!day || !month || !year) return null;
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return null;

    // Check if 18+
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    const dayDiff = today.getDate() - date.getDate();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (actualAge < 18) return null;
    return date;
  };

  const birthDate = parseBirthDate(birthDateStr);
  const isValid = displayName.length >= 2 && birthDate && gender;

  const handleContinue = () => {
    if (!isValid || !birthDate) return;

    updateData({
      displayName,
      birthDate,
      gender: gender as GenderId,
    });

    router.push('/(onboarding)/intention');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progress}>
          <View style={styles.progressDot} />
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>

        <Text style={styles.title}>Parlez-nous de vous</Text>
        <Text style={styles.subtitle}>
          Ces informations seront visibles sur votre profil
        </Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Prenom ou pseudo *</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Comment voulez-vous etre appele(e) ?"
              placeholderTextColor={colors.textTertiary}
              maxLength={30}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date de naissance *</Text>
            <TextInput
              style={styles.input}
              value={birthDateStr}
              onChangeText={setBirthDateStr}
              placeholder="JJ/MM/AAAA"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              maxLength={10}
            />
            <Text style={styles.hint}>Vous devez avoir 18 ans ou plus</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Genre *</Text>
            <View style={styles.chipContainer}>
              {GENDER_LIST.map((g) => (
                <Pressable
                  key={g.id}
                  style={[styles.chip, gender === g.id && styles.chipSelected]}
                  onPress={() => setGender(g.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      gender === g.id && styles.chipTextSelected,
                    ]}
                  >
                    {g.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Couleur de cheveux</Text>
            <View style={styles.chipContainer}>
              {HAIR_COLOR_LIST.map((h) => (
                <Pressable
                  key={h.id}
                  style={[styles.chip, hairColor === h.id && styles.chipSelected]}
                  onPress={() => setHairColor(h.id)}
                >
                  <View
                    style={[styles.colorDot, { backgroundColor: h.color }]}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      hairColor === h.id && styles.chipTextSelected,
                    ]}
                  >
                    {h.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </Pressable>
          <Pressable
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!isValid}
          >
            <Text style={styles.buttonText}>Continuer</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
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
  form: {
    gap: spacing.lg,
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
  hint: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.textLight,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
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
