import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useOnboarding } from '../../src/contexts/OnboardingContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import {
  DRINKING_OPTIONS,
  SMOKING_OPTIONS,
  CHILDREN_OPTIONS,
  PROFILE_PROMPTS,
  HEIGHT_RANGE,
  DrinkingId,
  SmokingId,
  ChildrenId,
  PromptId,
  ProfilePromptAnswer,
} from '../../src/constants/lifestyle';

export default function LifestyleScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const { t } = useLanguage();

  const [height, setHeight] = useState<number | null>(data.height || null);
  const [drinking, setDrinking] = useState<DrinkingId | null>(data.drinking || null);
  const [smoking, setSmoking] = useState<SmokingId | null>(data.smoking || null);
  const [children, setChildren] = useState<ChildrenId | null>(data.children || null);
  const [prompts, setPrompts] = useState<ProfilePromptAnswer[]>(data.prompts || []);

  const [showPromptModal, setShowPromptModal] = useState(false);
  const [editingPromptIndex, setEditingPromptIndex] = useState<number | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<PromptId | null>(null);
  const [promptAnswer, setPromptAnswer] = useState('');
  const answerInputRef = useRef<TextInput>(null);

  // Focus sur le champ de réponse quand une question est sélectionnée
  useEffect(() => {
    if (selectedPromptId && answerInputRef.current) {
      setTimeout(() => {
        answerInputRef.current?.focus();
      }, 100);
    }
  }, [selectedPromptId]);

  const handleAddPrompt = () => {
    setEditingPromptIndex(null);
    setSelectedPromptId(null);
    setPromptAnswer('');
    setShowPromptModal(true);
  };

  const handleEditPrompt = (index: number) => {
    const prompt = prompts[index];
    setEditingPromptIndex(index);
    setSelectedPromptId(prompt.promptId);
    setPromptAnswer(prompt.answer);
    setShowPromptModal(true);
  };

  const handleSavePrompt = () => {
    if (!selectedPromptId || !promptAnswer.trim()) return;

    const newPrompt: ProfilePromptAnswer = {
      promptId: selectedPromptId,
      answer: promptAnswer.trim(),
    };

    if (editingPromptIndex !== null) {
      const updated = [...prompts];
      updated[editingPromptIndex] = newPrompt;
      setPrompts(updated);
    } else {
      setPrompts([...prompts, newPrompt]);
    }

    setShowPromptModal(false);
    setSelectedPromptId(null);
    setPromptAnswer('');
  };

  const handleRemovePrompt = (index: number) => {
    setPrompts(prompts.filter((_, i) => i !== index));
  };

  const getPromptLabel = (promptId: PromptId): string => {
    return PROFILE_PROMPTS.find(p => p.id === promptId)?.label || '';
  };

  const usedPromptIds = prompts.map(p => p.promptId);
  const availablePrompts = PROFILE_PROMPTS.filter(p => !usedPromptIds.includes(p.id));

  const handleContinue = () => {
    updateData({
      height,
      drinking,
      smoking,
      children,
      prompts,
    });
    router.push('/(onboarding)/notification-consent');
  };

  const canContinue = prompts.length >= 1; // Au moins 1 prompt requis

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
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

        <Text style={styles.title}>Un peu plus sur vous</Text>
        <Text style={styles.subtitle}>
          Ces infos aident a trouver des personnes compatibles
        </Text>

        {/* Height */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Taille (optionnel)</Text>
          <View style={styles.heightContainer}>
            <Pressable
              style={styles.heightButton}
              onPress={() => setHeight(h => Math.max(HEIGHT_RANGE.min, (h || HEIGHT_RANGE.default) - 1))}
            >
              <Ionicons name="remove" size={24} color={colors.primary} />
            </Pressable>
            <View style={styles.heightDisplay}>
              <Text style={styles.heightValue}>
                {height ? `${height} cm` : '-- cm'}
              </Text>
            </View>
            <Pressable
              style={styles.heightButton}
              onPress={() => setHeight(h => Math.min(HEIGHT_RANGE.max, (h || HEIGHT_RANGE.default) + 1))}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
            </Pressable>
          </View>
          {!height && (
            <Pressable onPress={() => setHeight(HEIGHT_RANGE.default)}>
              <Text style={styles.setHeightLink}>Definir ma taille</Text>
            </Pressable>
          )}
        </View>

        {/* Drinking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alcool</Text>
          <View style={styles.optionsContainer}>
            {DRINKING_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.optionChip,
                  drinking === option.id && styles.optionChipSelected,
                ]}
                onPress={() => setDrinking(drinking === option.id ? null : option.id)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={18}
                  color={drinking === option.id ? colors.textLight : colors.text}
                />
                <Text
                  style={[
                    styles.optionText,
                    drinking === option.id && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Smoking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tabac</Text>
          <View style={styles.optionsContainer}>
            {SMOKING_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.optionChip,
                  smoking === option.id && styles.optionChipSelected,
                ]}
                onPress={() => setSmoking(smoking === option.id ? null : option.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    smoking === option.id && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Children */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enfants</Text>
          <View style={styles.optionsContainer}>
            {CHILDREN_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.optionChip,
                  children === option.id && styles.optionChipSelected,
                ]}
                onPress={() => setChildren(children === option.id ? null : option.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    children === option.id && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Prompts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parlez de vous</Text>
          <Text style={styles.sectionSubtitle}>
            Repondez a au moins 1 question pour montrer votre personnalite
          </Text>

          {prompts.map((prompt, index) => (
            <Pressable
              key={index}
              style={styles.promptCard}
              onPress={() => handleEditPrompt(index)}
            >
              <View style={styles.promptHeader}>
                <Text style={styles.promptQuestion}>{getPromptLabel(prompt.promptId)}</Text>
                <Pressable onPress={() => handleRemovePrompt(index)}>
                  <Ionicons name="close-circle" size={22} color={colors.textTertiary} />
                </Pressable>
              </View>
              <Text style={styles.promptAnswer}>{prompt.answer}</Text>
            </Pressable>
          ))}

          {prompts.length < 3 && (
            <Pressable style={styles.addPromptButton} onPress={handleAddPrompt}>
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              <Text style={styles.addPromptText}>
                Ajouter une reponse ({prompts.length}/3)
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

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

      {/* Prompt Modal */}
      <Modal
        visible={showPromptModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowPromptModal(false)}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Votre reponse</Text>
            <Pressable onPress={handleSavePrompt} disabled={!selectedPromptId || !promptAnswer.trim()}>
              <Text style={[
                styles.modalSave,
                (!selectedPromptId || !promptAnswer.trim()) && styles.modalSaveDisabled
              ]}>
                OK
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSectionTitle}>Choisissez une question</Text>
            <View style={styles.promptsList}>
              {availablePrompts.map((prompt) => (
                <Pressable
                  key={prompt.id}
                  style={[
                    styles.promptOption,
                    selectedPromptId === prompt.id && styles.promptOptionSelected,
                  ]}
                  onPress={() => setSelectedPromptId(prompt.id)}
                >
                  <Text
                    style={[
                      styles.promptOptionText,
                      selectedPromptId === prompt.id && styles.promptOptionTextSelected,
                    ]}
                  >
                    {prompt.label}
                  </Text>
                  {selectedPromptId === prompt.id && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>

            {selectedPromptId && (
              <View style={styles.answerSection}>
                <Text style={styles.modalSectionTitle}>Votre reponse</Text>
                <TextInput
                  ref={answerInputRef}
                  style={styles.answerInput}
                  value={promptAnswer}
                  onChangeText={setPromptAnswer}
                  placeholder="Tapez votre réponse ici pour activer OK..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  maxLength={300}
                  textAlignVertical="top"
                  autoFocus
                />
                <Text style={styles.charCount}>{promptAnswer.length}/300</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  heightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  heightButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heightDisplay: {
    width: 100,
    alignItems: 'center',
  },
  heightValue: {
    ...typography.h2,
    color: colors.text,
  },
  setHeightLink: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.textLight,
  },
  promptCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  promptQuestion: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  promptAnswer: {
    ...typography.body,
    color: colors.text,
  },
  addPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addPromptText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCancel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  modalTitle: {
    ...typography.h4,
    color: colors.text,
  },
  modalSave: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  modalSaveDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  modalSectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  promptsList: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  promptOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promptOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  promptOptionText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  promptOptionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  answerSection: {
    marginTop: spacing.md,
  },
  answerInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 120,
    ...typography.body,
    color: colors.text,
  },
  charCount: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
});
