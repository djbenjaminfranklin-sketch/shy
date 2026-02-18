import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, Pressable, Keyboard, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { Button } from '../../src/components/ui/Button';
import { DismissKeyboard } from '../../src/components/ui/DismissKeyboard';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { deleteAccount } = useAuth();
  const { t } = useLanguage();

  const [confirmation, setConfirmation] = useState('');
  const [reason, setReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const confirmationInputRef = useRef<TextInput>(null);

  const confirmationWord = t('profile.deleteAccountScreen.confirmationWord');
  const canDelete = confirmation.toLowerCase() === confirmationWord.toLowerCase();

  const handleDelete = async () => {
    if (!canDelete) return;

    Alert.alert(
      t('profile.deleteAccountScreen.confirmTitle'),
      t('profile.deleteAccountScreen.confirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { error } = await deleteAccount();
              if (error) {
                Alert.alert(t('common.error'), error);
                setIsDeleting(false);
              } else {
                router.replace('/(auth)/welcome');
              }
            } catch (err) {
              Alert.alert(t('common.error'), t('profile.deleteAccountScreen.errorOccurred'));
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('profile.deleteAccountScreen.headerTitle')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <DismissKeyboard>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>⚠️</Text>
          </View>

          <Text style={styles.title}>{t('profile.deleteAccountScreen.title')}</Text>

          <Text style={styles.description}>
            {t('profile.deleteAccountScreen.description')}
          </Text>

          <View style={styles.list}>
            <Text style={styles.listItem}>• {t('profile.deleteAccountScreen.consequence1')}</Text>
            <Text style={styles.listItem}>• {t('profile.deleteAccountScreen.consequence2')}</Text>
            <Text style={styles.listItem}>• {t('profile.deleteAccountScreen.consequence3')}</Text>
            <Text style={styles.listItem}>• {t('profile.deleteAccountScreen.consequence4')}</Text>
            <Text style={styles.listItem}>• {t('profile.deleteAccountScreen.consequence5')}</Text>
          </View>

          <Text style={styles.warning}>
            {t('profile.deleteAccountScreen.warning')}
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>
              {t('profile.deleteAccountScreen.reasonLabel')}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder={t('profile.deleteAccountScreen.reasonPlaceholder')}
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={500}
              returnKeyType="next"
              blurOnSubmit={true}
              onSubmitEditing={() => confirmationInputRef.current?.focus()}
            />

            <Text style={styles.label}>
              {t('profile.deleteAccountScreen.typeToConfirm').replace('{word}', confirmationWord.toUpperCase())}
            </Text>
            <TextInput
              ref={confirmationInputRef}
              style={styles.input}
              value={confirmation}
              onChangeText={setConfirmation}
              placeholder={confirmationWord.toUpperCase()}
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>
        </ScrollView>
      </DismissKeyboard>

      <View style={styles.footer}>
        <Button
          title={t('common.cancel')}
          onPress={() => router.back()}
          variant="outline"
          style={styles.button}
        />
        <Button
          title={t('profile.deleteAccountScreen.deleteButton')}
          onPress={handleDelete}
          variant="danger"
          disabled={!canDelete}
          loading={isDeleting}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: spacing.lg,
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    ...typography.h2,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  list: {
    marginBottom: spacing.md,
  },
  listItem: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  warning: {
    ...typography.bodyMedium,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.error + '10',
    borderRadius: borderRadius.md,
  },
  form: {
    gap: spacing.md,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
  },
});
