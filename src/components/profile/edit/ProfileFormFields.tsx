import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing, borderRadius } from '../../../theme/spacing';

interface ProfileFormFieldsProps {
  displayName: string;
  onDisplayNameChange: (value: string) => void;
  bio: string;
  onBioChange: (value: string) => void;
}

export function ProfileFormFields({
  displayName,
  onDisplayNameChange,
  bio,
  onBioChange,
}: ProfileFormFieldsProps) {
  return (
    <>
      {/* Nom */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prenom ou pseudo</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={onDisplayNameChange}
          placeholder="Comment voulez-vous etre appele(e) ?"
          placeholderTextColor={colors.textTertiary}
          maxLength={30}
        />
      </View>

      {/* Bio */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>A propos de vous</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={onBioChange}
          placeholder="Parlez de vous..."
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={500}
        />
        <Text style={styles.charCount}>{bio.length}/500</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
});
