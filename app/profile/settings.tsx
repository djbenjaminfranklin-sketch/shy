import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useLocation } from '../../src/contexts/LocationContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { SupportedLanguage } from '../../src/i18n';

const LANGUAGES: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export default function SettingsScreen() {
  const { isEnabled: locationEnabled, enableLocation, disableLocation, isLoading } = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const handleLocationToggle = async (value: boolean) => {
    if (value) {
      await enableLocation();
    } else {
      await disableLocation();
    }
  };

  const handleLanguageChange = (langCode: SupportedLanguage) => {
    setLanguage(langCode);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Langue / Language</Text>
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
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'fr' ? 'Localisation' : 'Location'}
          </Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>
                {language === 'fr' ? 'Activer la géolocalisation' : 'Enable location'}
              </Text>
              <Text style={styles.settingDescription}>
                {language === 'fr'
                  ? "Permet de voir et d'être vu par des personnes à proximité"
                  : 'Allows you to see and be seen by people nearby'}
              </Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={handleLocationToggle}
              disabled={isLoading}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={locationEnabled ? colors.primary : colors.surface}
            />
          </View>
          <Text style={styles.settingHint}>
            {language === 'fr'
              ? 'Seule une distance approximative est partagée, jamais votre adresse exacte.'
              : 'Only an approximate distance is shared, never your exact address.'}
          </Text>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'fr' ? 'Notifications' : 'Notifications'}
          </Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>
                {language === 'fr' ? 'Nouvelles invitations' : 'New invitations'}
              </Text>
              <Text style={styles.settingDescription}>
                {language === 'fr'
                  ? "Recevoir une notification lors d'une nouvelle invitation"
                  : 'Receive a notification when you get a new invitation'}
              </Text>
            </View>
            <Switch
              value={true}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={colors.primary}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Messages</Text>
              <Text style={styles.settingDescription}>
                {language === 'fr'
                  ? 'Recevoir une notification pour les nouveaux messages'
                  : 'Receive a notification for new messages'}
              </Text>
            </View>
            <Switch
              value={true}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={colors.primary}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>
                {language === 'fr' ? 'Son et vibration' : 'Sound and vibration'}
              </Text>
              <Text style={styles.settingDescription}>
                {language === 'fr'
                  ? 'Activer le son et la vibration pour les notifications'
                  : 'Enable sound and vibration for notifications'}
              </Text>
            </View>
            <Switch
              value={true}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={colors.primary}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'fr' ? 'Compte' : 'Account'}
          </Text>
          <Text style={styles.settingHint}>
            {language === 'fr'
              ? 'Pour modifier votre email ou mot de passe, utilisez la fonction "Mot de passe oublié" sur l\'écran de connexion.'
              : 'To change your email or password, use the "Forgot password" feature on the login screen.'}
          </Text>
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
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
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
});
