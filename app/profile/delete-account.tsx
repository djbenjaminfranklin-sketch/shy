import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useAuth } from '../../src/contexts/AuthContext';
import { Button } from '../../src/components/ui/Button';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { deleteAccount } = useAuth();

  const [confirmation, setConfirmation] = useState('');
  const [reason, setReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = confirmation.toLowerCase() === 'supprimer';

  const handleDelete = async () => {
    if (!canDelete) return;

    Alert.alert(
      'Confirmer la suppression',
      'Cette action est irréversible. Toutes vos données seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { error } = await deleteAccount();
              if (error) {
                Alert.alert('Erreur', error);
                setIsDeleting(false);
              } else {
                router.replace('/(auth)/welcome');
              }
            } catch (err) {
              Alert.alert('Erreur', 'Une erreur est survenue');
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
        <Text style={styles.headerTitle}>Supprimer le compte</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⚠️</Text>
        </View>

        <Text style={styles.title}>Supprimer votre compte</Text>

        <Text style={styles.description}>
          La suppression de votre compte entraîne :
        </Text>

        <View style={styles.list}>
          <Text style={styles.listItem}>• Suppression de votre profil</Text>
          <Text style={styles.listItem}>• Suppression de tous vos matchs</Text>
          <Text style={styles.listItem}>• Suppression de toutes vos conversations</Text>
          <Text style={styles.listItem}>• Suppression de vos photos</Text>
          <Text style={styles.listItem}>• Effacement de vos données personnelles</Text>
        </View>

        <Text style={styles.warning}>
          Cette action est irréversible et sera effective dans un délai de 30 jours.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>
            Raison de votre départ (optionnel)
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={reason}
            onChangeText={setReason}
            placeholder="Aidez-nous à nous améliorer..."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={500}
          />

          <Text style={styles.label}>
            Tapez "SUPPRIMER" pour confirmer
          </Text>
          <TextInput
            style={styles.input}
            value={confirmation}
            onChangeText={setConfirmation}
            placeholder="SUPPRIMER"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Annuler"
          onPress={() => router.back()}
          variant="outline"
          style={styles.button}
        />
        <Button
          title="Supprimer mon compte"
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
