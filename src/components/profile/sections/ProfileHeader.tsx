import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { router } from 'expo-router';
import { colors, spacing, borderRadius } from '../../../theme';
import { IntentionBadge, AvailabilityBadge } from '../index';
import type { Profile } from '../../../types/profile';
import type { User } from '@supabase/supabase-js';

// =============================================================================
// Types
// =============================================================================

interface ProfileStats {
  invitationsSent: number;
  invitationsReceived: number;
  connections: number;
}

interface ProfileHeaderProps {
  user: User | null;
  profile: Profile | null;
  stats: ProfileStats;
  t: (key: string) => string;
}

// =============================================================================
// ProfileHeader
// =============================================================================

/**
 * Avatar, name, badges, bio, video and stats section
 */
export function ProfileHeader({ user, profile, stats, t }: ProfileHeaderProps) {
  // Avatar par defaut si pas de photo
  const defaultAvatar = 'https://via.placeholder.com/120x120/FF6B6B/FFFFFF?text=' +
    (profile?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?');

  return (
    <>
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
                  onError={() => {}}
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

            {/* Video de profil */}
            {profile.videoUrl && (
              <View style={styles.videoContainer}>
                <Video
                  source={{ uri: profile.videoUrl }}
                  style={styles.profileVideo}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                  isLooping={false}
                  useNativeControls
                />
              </View>
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
    </>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
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
  videoContainer: {
    width: '100%',
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  profileVideo: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surface,
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
});
