import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, spacing, borderRadius } from '../../src/theme';
import { IntentionBadge, AvailabilityBadge } from '../../src/components/profile';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { adminService } from '../../src/services/supabase/admin';
import { supabase } from '../../src/services/supabase/client';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const { t } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);
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

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;

      // Compter les invitations envoyées
      const { count: sentCount } = await supabase
        .from('invitations')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', user.id);

      // Compter les invitations reçues
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
    };

    loadStats();
  }, [user]);

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
                    // TODO: Appeler le service de suppression
                    // await deleteAccount();
                    Alert.alert(
                      t('profile.deleteConfirm.successTitle'),
                      t('profile.deleteConfirm.successMessage'),
                      [{ text: t('common.ok'), onPress: signOut }]
                    );
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  // Avatar par défaut si pas de photo
  const defaultAvatar = 'https://via.placeholder.com/120x120/FF6B6B/FFFFFF?text=' +
    (profile?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?');

  // Debug: log photo URL
  console.log('Profile photos:', profile?.photos);
  console.log('Avatar URL used:', profile?.photos?.[0] || defaultAvatar);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header avec photo */}
        <View style={styles.header}>
          {profile ? (
            <>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarWrapper}>
                  <Image
                    source={{ uri: profile.photos?.[0] || defaultAvatar }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                    onError={(e) => console.log('Profile avatar error:', e.nativeEvent.error)}
                  />
                </View>
              </View>

              <Text style={styles.name}>
                {profile.displayName}, {profile.age}
              </Text>

              <View style={styles.badges}>
                <IntentionBadge intention={profile.intention} />
                {profile.availability && (
                  <AvailabilityBadge availability={profile.availability} />
                )}
              </View>

              {profile.bio && (
                <Text style={styles.bio}>{profile.bio}</Text>
              )}
            </>
          ) : (
            <>
              <View style={styles.avatarContainer}>
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={60} color={colors.textTertiary} />
                </View>
              </View>

              <Text style={styles.name}>
                {user?.email?.split('@')[0] || t('profile.user')}
              </Text>

              <TouchableOpacity
                style={styles.completeProfileButton}
                onPress={() => router.push('/(onboarding)/profile-photo')}
              >
                <Text style={styles.completeProfileText}>
                  {t('profile.completeProfile')}
                </Text>
                <Ionicons name="arrow-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{stats.invitationsSent}</Text>
            <Text style={styles.statLabel}>{t('profile.stats.sent')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{stats.invitationsReceived}</Text>
            <Text style={styles.statLabel}>{t('profile.stats.received')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{stats.connections}</Text>
            <Text style={styles.statLabel}>{t('profile.stats.connections')}</Text>
          </View>
        </View>

        {/* Bouton modifier profil - GROS */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push('/profile/edit')}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            style={styles.editGradient}
          >
            <Ionicons name="create" size={24} color={colors.white} />
            <Text style={styles.editText}>{t('profile.editProfile')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Menu items - GROS boutons */}
        <View style={styles.menu}>
          {menuItems.slice(1).map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon} size={24} color={colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Admin Panel - Only visible for admins */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => router.push('/admin')}
          >
            <LinearGradient
              colors={['#1a1a2e', '#16213e']}
              style={styles.adminGradient}
            >
              <Ionicons name="shield" size={24} color="#00d4ff" />
              <Text style={styles.adminText}>{t('profile.adminPanel')}</Text>
              <Ionicons name="chevron-forward" size={20} color="#00d4ff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Actions du compte */}
        <View style={styles.accountActions}>
          {/* Deconnexion */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={24} color={colors.text} />
            <Text style={styles.logoutText}>{t('profile.logout')}</Text>
          </TouchableOpacity>

          {/* Supprimer le compte - OBLIGATOIRE APPLE */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={24} color={colors.error} />
            <Text style={styles.deleteText}>{t('profile.deleteAccount')}</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={styles.version}>SHY v1.0.1</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.primary,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  completeProfileText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.card,
    borderRadius: 14,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bio: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    // Shadow
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },

  // Edit button - GROS
  editButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  editGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  editText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },

  // Menu - GROS items
  menu: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 60, // GROS
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: 17,
    color: colors.text,
    fontWeight: '500',
  },

  // Account actions
  accountActions: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 60,
  },
  logoutText: {
    fontSize: 17,
    color: colors.text,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    minHeight: 60,
  },
  deleteText: {
    fontSize: 17,
    color: colors.error,
    fontWeight: '500',
  },

  // Admin button
  adminButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  adminGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  adminText: {
    flex: 1,
    color: '#00d4ff',
    fontSize: 18,
    fontWeight: '600',
  },

  // Version
  version: {
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: 13,
    marginVertical: spacing.lg,
  },
});
