import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useBoost } from '../../src/contexts/BoostContext';
import { adminService } from '../../src/services/supabase/admin';
import { supabase } from '../../src/services/supabase/client';
import { IceBreakerModal } from '../../src/components/icebreaker/IceBreakerModal';
import { ProfileHeader } from '../../src/components/profile/sections/ProfileHeader';
import { ProfileMenuSection } from '../../src/components/profile/sections/ProfileMenuSection';

export default function ProfileScreen() {
  const { user, profile, signOut, deleteAccount } = useAuth();
  const { t } = useLanguage();
  const {
    boostsAvailable,
    isBoostActive,
    activeBoostExpiresAt,
    refresh: refreshBoost,
  } = useBoost();
  const [showIceBreakerModal, setShowIceBreakerModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    invitationsSent: 0,
    invitationsReceived: 0,
    connections: 0,
  });

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const admin = await adminService.isAdmin(user.id);
        setIsAdmin(admin);
      }
    };
    checkAdmin();
  }, [user]);

  const loadStats = useCallback(async () => {
    if (!user) return;

    // Compter les invitations envoyees
    const { count: sentCount } = await supabase
      .from('invitations')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', user.id);

    // Compter les invitations recues
    const { count: receivedCount } = await supabase
      .from('invitations')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    // Compter les connexions
    const { count: connectionsCount } = await supabase
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    setStats({
      invitationsSent: sentCount || 0,
      invitationsReceived: receivedCount || 0,
      connections: connectionsCount || 0,
    });
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadStats(), refreshBoost()]);
    setIsRefreshing(false);
  }, [loadStats, refreshBoost]);

  const menuItems = [
    { icon: 'create-outline' as const, label: t('profile.editProfile'), route: '/profile/edit' },
    { icon: 'card-outline' as const, label: t('profile.subscription'), route: '/profile/subscription' },
    { icon: 'settings-outline' as const, label: t('profile.settings'), route: '/profile/settings' },
    { icon: 'lock-closed-outline' as const, label: t('profile.privacy'), route: '/profile/privacy' },
  ];

  const handleSignOut = () => {
    Alert.alert(
      t('profile.logoutConfirm.title'),
      t('profile.logoutConfirm.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('profile.logout'), style: 'destructive', onPress: signOut },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profile.deleteConfirm.title'),
      t('profile.deleteConfirm.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            // Deuxieme confirmation pour Apple
            Alert.alert(
              t('profile.deleteConfirm.finalTitle'),
              t('profile.deleteConfirm.finalMessage'),
              [
                { text: t('profile.deleteConfirm.keepAccount'), style: 'cancel' },
                {
                  text: t('profile.deleteConfirm.confirmDelete'),
                  style: 'destructive',
                  onPress: async () => {
                    const { error } = await deleteAccount();
                    if (error) {
                      Alert.alert(t('alerts.errorTitle'), error);
                    } else {
                      Alert.alert(
                        t('profile.deleteConfirm.successTitle'),
                        t('profile.deleteConfirm.successMessage')
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <ProfileHeader
          user={user}
          profile={profile}
          stats={stats}
          t={t}
        />

        <ProfileMenuSection
          menuItems={menuItems}
          isAdmin={isAdmin}
          isBoostActive={isBoostActive}
          boostsAvailable={boostsAvailable}
          activeBoostExpiresAt={activeBoostExpiresAt}
          refreshBoost={refreshBoost}
          onBoostPress={() => setShowIceBreakerModal(true)}
          onSignOut={handleSignOut}
          onDeleteAccount={handleDeleteAccount}
          t={t}
        />
      </ScrollView>

      {/* Ice Breaker modal */}
      <IceBreakerModal
        visible={showIceBreakerModal}
        onClose={() => setShowIceBreakerModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
