import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { IntentionBadge } from '../profile';
import type { InvitationWithProfile } from '../../types/match';

const { width } = Dimensions.get('window');

// Helper function pour calculer le temps ecoule
export const getTimeAgo = (dateString: string, t: (key: string) => string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return t('invitations.justNow');
  if (diffMins < 60) return t('invitations.minutesAgo').replace('{0}', String(diffMins));
  if (diffHours < 24) return t('invitations.hoursAgo').replace('{0}', String(diffHours));
  if (diffDays === 1) return t('invitations.yesterday');
  if (diffDays < 7) return t('invitations.daysAgo').replace('{0}', String(diffDays));
  return t('invitations.weeksAgo').replace('{0}', String(Math.floor(diffDays / 7)));
};

// Skeleton loader component
export const InvitationSkeletonCard = () => (
  <View style={styles.card}>
    <View style={styles.cardContent}>
      <View style={[styles.avatar, styles.skeleton]} />
      <View style={styles.info}>
        <View style={[styles.skeletonText, { width: 120 }]} />
        <View style={[styles.skeletonText, { width: 80, marginTop: 8 }]} />
        <View style={[styles.skeletonText, { width: 60, marginTop: 4 }]} />
      </View>
    </View>
    <View style={styles.actions}>
      <View style={[styles.refuseButton, styles.skeleton]} />
      <View style={[styles.acceptButtonSkeleton, styles.skeleton]} />
    </View>
  </View>
);

// Invitation Card component avec animation
interface InvitationCardProps {
  invitation: InvitationWithProfile;
  onAccept: (id: string) => void;
  onRefuse: (id: string) => void;
  onRemove: () => void;
  t: (key: string) => string;
}

export const InvitationCard = ({ invitation, onAccept, onRefuse, onRemove, t }: InvitationCardProps) => {
  const profile = invitation.senderProfile;
  const timeAgo = getTimeAgo(invitation.sentAt, t);

  // Guard against missing profile
  if (!profile) {
    return null;
  }
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  const animateOut = (direction: 'left' | 'right', callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: direction === 'left' ? -width : width,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      onRemove();
    });
  };

  const handleAccept = () => {
    animateOut('right', () => onAccept(invitation.id));
  };

  const handleRefuse = () => {
    Alert.alert(
      t('invitations.refuseTitle'),
      t('invitations.refuseMessage').replace('{0}', profile.displayName),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('invitations.decline'),
          style: 'destructive',
          onPress: () => animateOut('left', () => onRefuse(invitation.id)),
        },
      ]
    );
  };

  const handleViewProfile = () => {
    router.push(`/profile/${profile.id}?from=likes` as never);
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [{ translateX }],
        },
      ]}
    >
      <TouchableOpacity style={styles.cardContent} onPress={handleViewProfile} activeOpacity={0.7}>
        {profile.photos && profile.photos[0] ? (
          <Image source={{ uri: profile.photos[0] }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarPlaceholderText}>
              {profile.displayName?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {profile.displayName}, {profile.age}
          </Text>
          <IntentionBadge intention={profile.intention} size="small" />
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.refuseButton} onPress={handleRefuse} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
          <Text style={styles.refuseText}>{t('invitations.decline')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.acceptButton} onPress={handleAccept} activeOpacity={0.8}>
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.acceptGradient}
          >
            <Ionicons name="checkmark" size={24} color={colors.white} />
            <Text style={styles.acceptText}>{t('invitations.accept')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Sent invitation card (simpler, no accept/refuse)
interface SentInvitationCardProps {
  invitation: InvitationWithProfile;
  t: (key: string) => string;
}

export const SentInvitationCard = ({ invitation, t }: SentInvitationCardProps) => {
  const profile = invitation.receiverProfile;
  const timeAgo = getTimeAgo(invitation.sentAt, t);

  if (!profile) return null;

  const handleViewProfile = () => {
    router.push(`/profile/${profile.id}?from=likes` as never);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardContent} onPress={handleViewProfile} activeOpacity={0.7}>
        {profile.photos && profile.photos[0] ? (
          <Image source={{ uri: profile.photos[0] }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarPlaceholderText}>
              {profile.displayName?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {profile.displayName}, {profile.age}
          </Text>
          <IntentionBadge intention={profile.intention} size="small" />
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {invitation.status === 'accepted' ? '\u2713 Accept\u00e9' : '\u23f3 En attente'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Card
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  // Avatar
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  avatarPlaceholderText: {
    ...typography.h2,
    color: colors.white,
  },

  // Info
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  timeAgo: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  refuseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: spacing.sm,
  },
  refuseText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  acceptButton: {
    flex: 1,
  },
  acceptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  acceptText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButtonSkeleton: {
    flex: 1,
    height: 56,
    borderRadius: borderRadius.lg,
  },

  // Status badge for sent invitations
  statusBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  // Skeleton
  skeleton: {
    backgroundColor: colors.surface,
  },
  skeletonText: {
    height: 16,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
  },
});
