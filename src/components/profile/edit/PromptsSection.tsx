import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';
import {
  PROFILE_PROMPTS,
  PromptId,
  ProfilePromptAnswer,
} from '../../../constants/lifestyle';

interface PromptsSectionProps {
  prompts: ProfilePromptAnswer[];
  onPromptsChange: (prompts: ProfilePromptAnswer[]) => void;
}

export function PromptsSection({
  prompts,
  onPromptsChange,
}: PromptsSectionProps) {
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [editingPromptIndex, setEditingPromptIndex] = useState<number | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<PromptId | null>(null);
  const [promptAnswer, setPromptAnswer] = useState('');

  const usedPromptIds = prompts.map(p => p.promptId);
  const availablePrompts = PROFILE_PROMPTS.filter(p => !usedPromptIds.includes(p.id));

  const getPromptLabel = (promptId: PromptId): string => {
    return PROFILE_PROMPTS.find(p => p.id === promptId)?.label || '';
  };

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
      onPromptsChange(updated);
    } else {
      onPromptsChange([...prompts, newPrompt]);
    }

    setShowPromptModal(false);
    setSelectedPromptId(null);
    setPromptAnswer('');
  };

  const handleRemovePrompt = (index: number) => {
    onPromptsChange(prompts.filter((_, i) => i !== index));
  };

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parlez de vous</Text>
        <Text style={styles.sectionSubtitle}>
          Repondez a des questions pour montrer votre personnalite
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

      {/* Modal pour les prompts */}
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
                  style={styles.answerInput}
                  value={promptAnswer}
                  onChangeText={setPromptAnswer}
                  placeholder="Tapez votre reponse ici..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  maxLength={300}
                  textAlignVertical="top"
                  autoFocus
                />
                <Text style={styles.answerCharCount}>{promptAnswer.length}/300</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm },
  sectionSubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  promptCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  promptHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: spacing.xs,
  },
  promptQuestion: { ...typography.bodySmall, color: colors.primary, fontWeight: '600', flex: 1 },
  promptAnswer: { ...typography.body, color: colors.text },
  addPromptButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.lg, borderRadius: borderRadius.lg,
    borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed',
  },
  addPromptText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalCancel: { ...typography.body, color: colors.textSecondary },
  modalTitle: { ...typography.h4, color: colors.text },
  modalSave: { ...typography.body, color: colors.primary, fontWeight: '600' },
  modalSaveDisabled: { opacity: 0.5 },
  modalContent: { flex: 1, padding: spacing.lg },
  modalSectionTitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.md },
  promptsList: { gap: spacing.sm, marginBottom: spacing.xl },
  promptOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  promptOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  promptOptionText: { ...typography.body, color: colors.text, flex: 1 },
  promptOptionTextSelected: { color: colors.primary, fontWeight: '500' },
  answerSection: { marginTop: spacing.md },
  answerInput: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.md, padding: spacing.md, minHeight: 120,
    ...typography.body, color: colors.text,
  },
  answerCharCount: { ...typography.caption, color: colors.textTertiary, textAlign: 'right', marginTop: spacing.xs },
});
