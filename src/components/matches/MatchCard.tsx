import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import type { MatchWithProfile } from '../../types/match';
import { IceBreakerBadgeCompact } from '../icebreaker/IceBreakerBadge';

/** Format a date string as relative time (e.g. "5 min ago") */
export function getTimeAgo(dateString: string | undefined, t: (key: string) => string): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return t('time.justNow');
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return t('time.minutesAgo').replace('{0}', String(diffInMinutes));
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return t('time.hoursAgo').replace('{0}', String(diffInHours));
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return t('time.daysAgo').replace('{0}', String(diffInDays));
  }

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

interface LikesCardProps {
  count: number;
  onPress: () => void;
  t: (key: string) => string;
}

/** Carte des likes recus (premiere carte dans la section horizontale) */
export function LikesCard({ count, onPress, t }: LikesCardProps) {
  return (
    <TouchableOpacity style={styles.likesCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={['#FFD700', '#FFA500']}
        style={styles.likesGradient}
      >
        <View style={styles.likesContent}>
          <Text style={styles.likesCount}>{count}</Text>
          <Ionicons name="heart" size={24} color="#fff" />
        </View>
        <Text style={styles.likesLabel}>{t('connections.likes')}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

interface NewMatchCardProps {
  match: MatchWithProfile;
  onPress: () => void;
}

/** Carte d'un nouveau match (section horizontale) */
export function NewMatchCard({ match, onPress }: NewMatchCardProps) {
  const hasPhoto = match.profile.photos && match.profile.photos.length > 0;

  return (
    <TouchableOpacity style={styles.newMatchCard} onPress={onPress} activeOpacity={0.8}>
      {hasPhoto ? (
        <Image source={{ uri: match.profile.photos[0] }} style={styles.newMatchPhoto} />
      ) : (
        <View style={[styles.newMatchPhoto, styles.newMatchPhotoPlaceholder]}>
          <Ionicons name="person" size={32} color={colors.textTertiary} />
        </View>
      )}
      <Text style={styles.newMatchName} numberOfLines={1}>
        {match.profile.displayName}
      </Text>
    </TouchableOpacity>
  );
}

interface MessageRowProps {
  connection: MatchWithProfile;
  onPress: () => void;
  t: (key: string) => string;
}

/** Ligne de message (section verticale) */
export function MessageRow({ connection, onPress, t }: MessageRowProps) {
  const { profile, lastMessage, lastMessageAt, unreadCount, hasIceBreakerMessages } = connection;
  const timeAgo = getTimeAgo(lastMessageAt, t);
  const hasPhoto = profile.photos && profile.photos.length > 0;

  return (
    <TouchableOpacity style={styles.messageRow} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar */}
      <View style={styles.messageAvatarContainer}>
        {hasPhoto ? (
          <Image source={{ uri: profile.photos[0] }} style={styles.messageAvatar} />
        ) : (
          <View style={[styles.messageAvatar, styles.messageAvatarPlaceholder]}>
            <Ionicons name="person" size={28} color={colors.textTertiary} />
          </View>
        )}
        {/* Point de notification */}
        {unreadCount > 0 && <View style={styles.onlineDot} />}
      </View>

      {/* Contenu */}
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <View style={styles.messageNameRow}>
            <Text style={[styles.messageName, unreadCount > 0 && styles.messageNameUnread]} numberOfLines={1}>
              {profile.displayName}
            </Text>
            {/* Ice Breaker badge */}
            {hasIceBreakerMessages && (
              <View style={styles.iceBreakerBadgeWrapper}>
                <IceBreakerBadgeCompact />
              </View>
            )}
          </View>
          {timeAgo ? (
            <Text style={styles.messageTime}>{timeAgo}</Text>
          ) : null}
        </View>
        <View style={styles.messagePreviewRow}>
          {lastMessage ? (
            <>
              <Ionicons name="return-down-forward" size={14} color={colors.textTertiary} style={styles.replyIcon} />
              <Text style={[styles.messagePreview, unreadCount > 0 && styles.messagePreviewUnread]} numberOfLines={1}>
                {lastMessage}
              </Text>
            </>
          ) : (
            <Text style={styles.messagePreviewNew}>{t('connections.startChatting')}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  likesCard: {
    width: 100,
    height: 140,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  likesGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  likesContent: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  likesCount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  likesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  newMatchCard: {
    width: 100,
    alignItems: 'center',
  },
  newMatchPhoto: {
    width: 100,
    height: 140,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  newMatchPhotoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  newMatchName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  messageAvatarContainer: {
    position: 'relative',
  },
  messageAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
  },
  messageAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
  },
  messageContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  messageName: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.text,
    flexShrink: 1,
  },
  iceBreakerBadgeWrapper: {
    marginLeft: spacing.xs,
  },
  messageNameUnread: {
    fontWeight: '700',
  },
  messageTime: {
    fontSize: 13,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
  messagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyIcon: {
    marginRight: 4,
  },
  messagePreview: {
    fontSize: 15,
    color: colors.textSecondary,
    flex: 1,
  },
  messagePreviewUnread: {
    color: colors.text,
    fontWeight: '500',
  },
  messagePreviewNew: {
    fontSize: 15,
    color: colors.primary,
    fontStyle: 'italic',
  },
});
