import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { SupportedLanguage } from '../../src/i18n';
import {
  SettingsSection,
  LocationSettings,
  PreferencesSettings,
  NotificationSettings,
} from '../../src/components/settings';

const LANGUAGES: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'he', label: 'עברית', flag: '🇮🇱' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [showTravelModal, setShowTravelModal] = useState(false);

  const handleLanguageChange = (langCode: SupportedLanguage) => {
    setLanguage(langCode);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.replace('/(tabs)/profile')}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {/* Language Section */}
        <SettingsSection title={t('settings.languageSection')}>
          <View style={styles.languageOptions}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  language === lang.code && styles.languageOptionActive,
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.languageLabel,
                    language === lang.code && styles.languageLabelActive,
                  ]}
                >
                  {lang.label}
                </Text>
                {language === lang.code && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </SettingsSection>

        {/* Location & Travel Mode */}
        <LocationSettings
          showTravelModal={showTravelModal}
          setShowTravelModal={setShowTravelModal}
        />

        {/* Search Preferences */}
        <PreferencesSettings />

        {/* Notifications */}
        <NotificationSettings />

        {/* Account Section */}
        <SettingsSection title={t('settings.accountSection')}>
          <Text style={styles.settingHint}>{t('settings.accountHint')}</Text>

          {/* Privacy & Data */}
          <TouchableOpacity
            style={styles.legalItem}
            onPress={() => router.push('/profile/export-data')}
          >
            <Ionicons name="download-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.legalItemText}>{t('settings.exportData')}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          {/* Blocked Users */}
          <TouchableOpacity
            style={styles.legalItem}
            onPress={() => router.push('/profile/blocked-users')}
          >
            <Ionicons name="ban-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.legalItemText}>{t('settings.blockedUsers')}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          {/* Delete Account - Easy access as required by Apple */}
          <TouchableOpacity
            style={[styles.legalItem, styles.deleteAccountItem]}
            onPress={() => router.push('/profile/delete-account')}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={[styles.legalItemText, styles.deleteAccountText]}>{t('settings.deleteAccount')}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.error} />
          </TouchableOpacity>
        </SettingsSection>

        {/* Legal Section */}
        <SettingsSection title={t('settings.legalSection')}>
          <TouchableOpacity
            style={styles.legalItem}
            onPress={() => router.push('/legal/terms')}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.legalItemText}>{t('settings.termsOfUse')}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.legalItem}
            onPress={() => router.push('/legal/privacy-policy')}
          >
            <Ionicons name="shield-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.legalItemText}>{t('settings.privacyPolicy')}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.legalItem}
            onPress={() => router.push('/legal/disclaimer')}
          >
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.legalItemText}>{t('settings.legalNotice')}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </SettingsSection>

        {/* Help Section */}
        <SettingsSection title={t('settings.helpSection')}>
          <TouchableOpacity
            style={styles.legalItem}
            onPress={() => Linking.openURL('https://shydating.eu/help')}
          >
            <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.legalItemText}>{t('settings.helpCenter')}</Text>
            <Ionicons name="open-outline" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.legalItem}
            onPress={() => Linking.openURL('mailto:contact@shydating.eu')}
          >
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.legalItemText}>{t('settings.contactUs')}</Text>
            <Ionicons name="open-outline" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </SettingsSection>
      </ScrollView>
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
    ...typography.h4,
    color: colors.text,
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  settingHint: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },

  // Language selector
  languageOptions: {
    gap: spacing.sm,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  languageLabel: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.text,
  },
  languageLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Legal items
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  legalItemText: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  deleteAccountItem: {
    borderBottomWidth: 0,
    marginTop: spacing.sm,
  },
  deleteAccountText: {
    color: colors.error,
  },
});
