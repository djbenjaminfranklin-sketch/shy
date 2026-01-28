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
import { adminService } from '../../src/services/supabase/admin';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const admin = await adminService.isAdmin(user.id);
        setIsAdmin(admin);
      }
    };
    checkAdmin();
  }, [user]);

  // Stats (TODO: récupérer depuis l'API)
  const stats = {
    invitationsSent: 0,
    invitationsReceived: 0,
    connections: 0,
  };

  const menuItems = [
    { icon: 'create-outline' as const, label: 'Modifier mon profil', route: '/profile/edit' },
    { icon: 'shield-checkmark-outline' as const, label: 'Verification', route: '/profile/verification' },
    { icon: 'card-outline' as const, label: 'Abonnement', route: '/profile/subscription' },
    { icon: 'settings-outline' as const, label: 'Parametres', route: '/profile/settings' },
    { icon: 'lock-closed-outline' as const, label: 'Confidentialite', route: '/profile/privacy' },
    { icon: 'help-circle-outline' as const, label: 'Aide', route: '/profile/help' },
  ];

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes vos données, photos, conversations et connexions seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            // Deuxième confirmation pour Apple
            Alert.alert(
              'Confirmation finale',
              'Êtes-vous vraiment sûr(e) ? Votre compte sera supprimé dans les 30 jours.',
              [
                { text: 'Non, garder mon compte', style: 'cancel' },
                {
                  text: 'Oui, supprimer définitivement',
                  style: 'destructive',
                  onPress: async () => {
                    // TODO: Appeler le service de suppression
                    // await deleteAccount();
                    Alert.alert(
                      'Compte supprimé',
                      'Votre demande de suppression a été enregistrée. Votre compte sera supprimé sous 30 jours.',
                      [{ text: 'OK', onPress: signOut }]
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header avec photo */}
        <View style={styles.header}>
          {profile ? (
            <>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: profile.photos?.[0] || defaultAvatar }}
                  style={styles.avatar}
                />
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
                {user?.email?.split('@')[0] || 'Utilisateur'}
              </Text>

              <TouchableOpacity
                style={styles.completeProfileButton}
                onPress={() => router.push('/(onboarding)/profile-photo')}
              >
                <Text style={styles.completeProfileText}>
                  Compléter mon profil
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
            <Text style={styles.statLabel}>Envoyees</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{stats.invitationsReceived}</Text>
            <Text style={styles.statLabel}>Recues</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{stats.connections}</Text>
            <Text style={styles.statLabel}>Connexions</Text>
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
            <Text style={styles.editText}>Modifier mon profil</Text>
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
              <Text style={styles.adminText}>Admin Panel</Text>
              <Ionicons name="chevron-forward" size={20} color="#00d4ff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Actions du compte */}
        <View style={styles.accountActions}>
          {/* Déconnexion */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={24} color={colors.text} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>

          {/* Supprimer le compte - OBLIGATOIRE APPLE */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={24} color={colors.error} />
            <Text style={styles.deleteText}>Supprimer mon compte</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={styles.version}>SHY v1.0.0</Text>
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
