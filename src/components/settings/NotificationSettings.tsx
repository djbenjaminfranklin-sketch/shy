import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { profilesService } from '../../services/supabase/profiles';
import { SettingsSection } from './SettingsSection';

interface NotificationToggleProps {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const NotificationToggle = ({ label, description, value, onValueChange }: NotificationToggleProps) => (
  <View style={styles.settingItem}>
    <View style={styles.settingInfo}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor={colors.white}
      ios_backgroundColor={colors.border}
    />
  </View>
);

export const NotificationSettings = () => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();

  const [notifInvitations, setNotifInvitations] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifSound, setNotifSound] = useState(true);

  // Update state when profile loads
  useEffect(() => {
    if (profile) {
      setNotifInvitations(profile.notificationInvitations ?? true);
      setNotifMessages(profile.notificationMessages ?? true);
      setNotifSound(profile.notificationSound ?? true);
    }
  }, [profile]);

  const handleNotifInvitationsChange = async (value: boolean) => {
    setNotifInvitations(value);
    if (user) {
      await profilesService.updateProfile(user.id, {
        notificationInvitations: value,
      });
    }
  };

  const handleNotifMessagesChange = async (value: boolean) => {
    setNotifMessages(value);
    if (user) {
      await profilesService.updateProfile(user.id, {
        notificationMessages: value,
      });
    }
  };

  const handleNotifSoundChange = async (value: boolean) => {
    setNotifSound(value);
    if (user) {
      await profilesService.updateProfile(user.id, {
        notificationSound: value,
      });
    }
  };

  return (
    <SettingsSection title={t('settings.notifications')}>
      <NotificationToggle
        label={t('settings.newInvitations')}
        description={t('settings.newInvitationsDesc')}
        value={notifInvitations}
        onValueChange={handleNotifInvitationsChange}
      />
      <NotificationToggle
        label={t('settings.messagesNotif')}
        description={t('settings.messagesNotifDesc')}
        value={notifMessages}
        onValueChange={handleNotifMessagesChange}
      />
      <NotificationToggle
        label={t('settings.soundVibration')}
        description={t('settings.soundVibrationDesc')}
        value={notifSound}
        onValueChange={handleNotifSoundChange}
      />
    </SettingsSection>
  );
};

const styles = StyleSheet.create({
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
});
