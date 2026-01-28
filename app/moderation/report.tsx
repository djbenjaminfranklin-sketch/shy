import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useAuth } from '../../src/contexts/AuthContext';
import { moderationService } from '../../src/services/supabase/moderation';
import { REPORT_REASON_LIST, ReportReasonId } from '../../src/constants/moderation';
import { Button } from '../../src/components/ui/Button';

export default function ReportScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [selectedReason, setSelectedReason] = useState<ReportReasonId | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !userId || !selectedReason) return;

    setIsSubmitting(true);
    try {
      const { error } = await moderationService.reportUser(
        user.id,
        userId,
        selectedReason,
        details || undefined
      );

      if (error) {
        Alert.alert('Erreur', error);
      } else {
        Alert.alert(
          'Signalement envoyé',
          'Merci pour votre signalement. Notre équipe va examiner ce profil.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (err) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Signaler ce profil</Text>
          <Text style={styles.subtitle}>
            Aidez-nous à maintenir une communauté sûre et respectueuse
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Raison du signalement</Text>
          <View style={styles.reasonsList}>
            {REPORT_REASON_LIST.map((reason) => (
              <Pressable
                key={reason.id}
                style={[
                  styles.reasonItem,
                  selectedReason === reason.id && styles.reasonItemSelected,
                ]}
                onPress={() => setSelectedReason(reason.id)}
              >
                <View style={styles.reasonRadio}>
                  {selectedReason === reason.id && (
                    <View style={styles.reasonRadioInner} />
                  )}
                </View>
                <View style={styles.reasonInfo}>
                  <Text style={styles.reasonLabel}>{reason.label}</Text>
                  <Text style={styles.reasonDescription}>{reason.description}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails supplémentaires (optionnel)</Text>
          <TextInput
            style={styles.textArea}
            value={details}
            onChangeText={setDetails}
            placeholder="Décrivez le problème en détail..."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={1000}
          />
          <Text style={styles.charCount}>{details.length}/1000</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Votre signalement est confidentiel. L'utilisateur signalé ne saura
            pas que vous l'avez signalé. Nous examinerons ce profil dans les
            plus brefs délais.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Annuler"
          onPress={() => router.back()}
          variant="outline"
          style={styles.button}
        />
        <Button
          title="Envoyer"
          onPress={handleSubmit}
          variant="danger"
          disabled={!selectedReason}
          loading={isSubmitting}
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  reasonsList: {
    gap: spacing.sm,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reasonItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  reasonRadio: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.md,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonRadioInner: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  reasonInfo: {
    flex: 1,
  },
  reasonLabel: {
    ...typography.bodyMedium,
    color: colors.text,
    marginBottom: 2,
  },
  reasonDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  textArea: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '10',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
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
