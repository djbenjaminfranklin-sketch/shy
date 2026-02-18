import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, spacing, borderRadius } from '../../../theme';
import { BoostIndicator } from '../../boost/BoostIndicator';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
}

interface ProfileMenuSectionProps {
  menuItems: MenuItem[];
  isAdmin: boolean;
  isBoostActive: boolean;
  boostsAvailable: number;
  activeBoostExpiresAt: string | null;
  refreshBoost: () => Promise<void>;
  onBoostPress: () => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

/** Menu items, boost button, admin button, account actions, and version */
export function ProfileMenuSection({
  menuItems,
  isAdmin,
  isBoostActive,
  boostsAvailable,
  activeBoostExpiresAt,
  refreshBoost,
  onBoostPress,
  onSignOut,
  onDeleteAccount,
  t,
}: ProfileMenuSectionProps) {
  return (
    <>
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

      {/* Boost button */}
      <TouchableOpacity
        style={styles.boostButton}
        onPress={onBoostPress}
      >
        <LinearGradient
          colors={[colors.boost, colors.accentLight]}
          style={styles.boostGradient}
        >
          <View style={styles.boostContent}>
            <Ionicons name="flash" size={24} color={colors.white} />
            <View style={styles.boostTextContainer}>
              <Text style={styles.boostText}>{t('boost.title')}</Text>
              {isBoostActive ? (
                <BoostIndicator expiresAt={activeBoostExpiresAt} onExpire={refreshBoost} compact />
              ) : (
                <Text style={styles.boostSubtext}>
                  {boostsAvailable > 0
                    ? t('boost.remaining', { count: boostsAvailable })
                    : t('boost.noBoosts')}
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.white} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Menu items - GROS boutons */}
      <View style={styles.menu}>
        {menuItems.slice(1).map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => router.push(item.route as never)}
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
          onPress={onSignOut}
        >
          <Ionicons name="log-out-outline" size={24} color={colors.text} />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        {/* Supprimer le compte - OBLIGATOIRE APPLE */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDeleteAccount}
        >
          <Ionicons name="trash-outline" size={24} color={colors.error} />
          <Text style={styles.deleteText}>{t('profile.deleteAccount')}</Text>
        </TouchableOpacity>
      </View>

      {/* Version */}
      <Text style={styles.version}>SHY v1.0.1</Text>
    </>
  );
}

const styles = StyleSheet.create({
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

  boostButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  boostGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 70,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
  },
  boostContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  boostTextContainer: {
    gap: 2,
  },
  boostText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  boostSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },

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
    minHeight: 60,
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

  version: {
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: 13,
    marginVertical: spacing.lg,
  },
});
