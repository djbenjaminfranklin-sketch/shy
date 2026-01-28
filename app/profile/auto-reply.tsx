import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useAuth } from '../../src/contexts/AuthContext';
import { subscriptionsService } from '../../src/services/supabase/subscriptions';
import { AUTO_REPLY_TEMPLATES } from '../../src/constants/subscriptions';
import { AutoReplySettings } from '../../src/types/subscription';
import { Button } from '../../src/components/ui/Button';

export default function AutoReplyScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [canUseFeature, setCanUseFeature] = useState(false);
  const [settings, setSettings] = useState<AutoReplySettings>({
    enabled: false,
    templateId: null,
    customMessage: null,
    activeHoursOnly: false,
    startHour: 22,
    endHour: 8,
  });

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Vérifier si l'utilisateur a accès à cette fonctionnalité
      const featureCheck = await subscriptionsService.checkFeature(user.id, 'autoReply');
      setCanUseFeature(featureCheck.allowed);

      // Charger les paramètres existants
      const { settings: loadedSettings } = await subscriptionsService.getAutoReplySettings(user.id);
      if (loadedSettings) {
        setSettings(loadedSettings);
      }
    } catch (error) {
      console.error('Error loading auto-reply settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = AUTO_REPLY_TEMPLATES.find((t) => t.id === templateId);
    setSettings({
      ...settings,
      templateId,
      customMessage: templateId === 'custom' ? settings.customMessage : template?.message || null,
    });
  };

  const handleSave = async () => {
    if (!user) return;

    if (!canUseFeature) {
      router.push('/profile/subscription' as any);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await subscriptionsService.saveAutoReplySettings(user.id, settings);

      if (error) {
        Alert.alert('Erreur', error);
      } else {
        Alert.alert('Succès', 'Vos paramètres ont été enregistrés', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Header info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💬</Text>
          <Text style={styles.infoText}>
            Configurez un message automatique qui sera envoyé lorsque quelqu'un vous
            écrit pour la première fois. Idéal pour accueillir vos nouveaux matchs !
          </Text>
        </View>

        {/* Feature lock */}
        {!canUseFeature && (
          <Pressable
            style={styles.upgradeBox}
            onPress={() => router.push('/profile/subscription' as any)}
          >
            <Text style={styles.upgradeIcon}>👑</Text>
            <View style={styles.upgradeInfo}>
              <Text style={styles.upgradeTitle}>Fonctionnalité Premium</Text>
              <Text style={styles.upgradeText}>
                Passez à Silver ou plus pour utiliser les réponses automatiques
              </Text>
            </View>
            <Text style={styles.upgradeArrow}>›</Text>
          </Pressable>
        )}

        {/* Enable toggle */}
        <View style={[styles.section, !canUseFeature && styles.sectionDisabled]}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Activer les réponses automatiques</Text>
              <Text style={styles.settingDescription}>
                Envoyez automatiquement un message de bienvenue
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => setSettings({ ...settings, enabled: value })}
              disabled={!canUseFeature}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={settings.enabled ? colors.primary : colors.surface}
            />
          </View>
        </View>

        {/* Template selection */}
        {settings.enabled && canUseFeature && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choisissez un modèle</Text>
              <View style={styles.templates}>
                {AUTO_REPLY_TEMPLATES.map((template) => (
                  <Pressable
                    key={template.id}
                    style={[
                      styles.templateItem,
                      settings.templateId === template.id && styles.templateItemSelected,
                    ]}
                    onPress={() => handleTemplateSelect(template.id)}
                  >
                    <View style={styles.templateRadio}>
                      {settings.templateId === template.id && (
                        <View style={styles.templateRadioInner} />
                      )}
                    </View>
                    <View style={styles.templateInfo}>
                      <Text style={styles.templateLabel}>{template.label}</Text>
                      {template.message && (
                        <Text style={styles.templatePreview} numberOfLines={2}>
                          {template.message}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Custom message */}
            {settings.templateId === 'custom' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Votre message personnalisé</Text>
                <TextInput
                  style={styles.textArea}
                  value={settings.customMessage || ''}
                  onChangeText={(text) => setSettings({ ...settings, customMessage: text })}
                  placeholder="Écrivez votre message de bienvenue..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  maxLength={300}
                />
                <Text style={styles.charCount}>
                  {(settings.customMessage || '').length}/300
                </Text>
              </View>
            )}

            {/* Active hours */}
            <View style={styles.section}>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Actif uniquement la nuit</Text>
                  <Text style={styles.settingDescription}>
                    Envoyer automatiquement seulement entre {settings.startHour}h et {settings.endHour}h
                  </Text>
                </View>
                <Switch
                  value={settings.activeHoursOnly}
                  onValueChange={(value) => setSettings({ ...settings, activeHoursOnly: value })}
                  trackColor={{ false: colors.border, true: colors.primary + '60' }}
                  thumbColor={settings.activeHoursOnly ? colors.primary : colors.surface}
                />
              </View>
            </View>

            {/* Preview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Aperçu</Text>
              <View style={styles.previewContainer}>
                <View style={styles.previewBubble}>
                  <Text style={styles.previewText}>
                    {settings.templateId === 'custom'
                      ? settings.customMessage || 'Votre message personnalisé...'
                      : AUTO_REPLY_TEMPLATES.find((t) => t.id === settings.templateId)?.message ||
                        'Sélectionnez un modèle'}
                  </Text>
                </View>
                <Text style={styles.previewLabel}>Réponse automatique</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={canUseFeature ? 'Enregistrer' : 'Passer à Premium'}
          onPress={handleSave}
          loading={isSaving}
          disabled={canUseFeature && settings.enabled && !settings.templateId}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '15',
    padding: spacing.md,
    margin: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
  },
  upgradeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '15',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  upgradeIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  upgradeInfo: {
    flex: 1,
  },
  upgradeTitle: {
    ...typography.bodyMedium,
    color: colors.warning,
  },
  upgradeText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  upgradeArrow: {
    ...typography.h2,
    color: colors.warning,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionDisabled: {
    opacity: 0.5,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  settingDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  templates: {
    gap: spacing.sm,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  templateRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.md,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  templateInfo: {
    flex: 1,
  },
  templateLabel: {
    ...typography.bodyMedium,
    color: colors.text,
    marginBottom: 4,
  },
  templatePreview: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
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
  previewContainer: {
    alignItems: 'flex-end',
  },
  previewBubble: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderBottomRightRadius: 4,
    maxWidth: '85%',
  },
  previewText: {
    ...typography.body,
    color: colors.textLight,
  },
  previewLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
