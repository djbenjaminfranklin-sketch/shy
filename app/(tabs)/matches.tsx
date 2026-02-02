import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { matchesService } from '../../src/services/supabase/matches';
import type { MatchWithProfile } from '../../src/types/match';

// =============================================================================
// Helper Functions
// =============================================================================

function getTimeAgo(dateString: string | undefined, t: (key: string) => string): string {
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

// =============================================================================
// Components
// =============================================================================

interface LikesCardProps {
  count: number;
  onPress: () => void;
  t: (key: string) => string;
}

/**
 * Carte des likes reçus (première carte dans la section horizontale)
 */
function LikesCard({ count, onPress, t }: LikesCardProps) {
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

/**
 * Carte d'un nouveau match (section horizontale)
 */
function NewMatchCard({ match, onPress }: NewMatchCardProps) {
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

/**
 * Ligne de message (section verticale)
 */
function MessageRow({ connection, onPress, t }: MessageRowProps) {
  const { profile, lastMessage, lastMessageAt, unreadCount } = connection;
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
          <Text style={[styles.messageName, unreadCount > 0 && styles.messageNameUnread]} numberOfLines={1}>
            {profile.displayName}
          </Text>
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

/**
 * État vide
 */
function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="chatbubbles-outline" size={64} color={colors.primaryLight} />
      </View>
      <Text style={styles.emptyTitle}>{t('connections.noConnections')}</Text>
      <Text style={styles.emptySubtitle}>{t('connections.noConnectionsHint')}</Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push('/(tabs)/discover')}
        activeOpacity={0.8}
      >
        <Ionicons name="compass-outline" size={20} color={colors.white} />
        <Text style={styles.emptyButtonText}>{t('connections.discoverProfiles')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// =============================================================================
// Main Screen
// =============================================================================

export default function MessagesScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [connections, setConnections] = useState<MatchWithProfile[]>([]);
  const [likesCount, setLikesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Séparer les nouveaux matchs (sans message) et les conversations actives
  const newMatches = connections.filter(c => !c.lastMessage);
  const activeConversations = connections.filter(c => c.lastMessage);

  const loadConnections = useCallback(async () => {
    if (!user) {
      setConnections([]);
      setIsLoading(false);
      return;
    }

    try {
      const { matches, error: fetchError } = await matchesService.getMatches(user.id);

      if (fetchError) {
        console.error('Error loading connections:', fetchError);
        setConnections([]);
      } else {
        // Trier par dernier message (plus récent en premier)
        const sorted = [...matches].sort((a, b) => {
          const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
          const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
        setConnections(sorted);
      }

      // Charger le nombre de likes reçus
      const { likes } = await matchesService.getReceivedLikes(user.id);
      setLikesCount(likes.length);
    } catch (err) {
      console.error('Error loading connections:', err);
      setConnections([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadConnections();
    setIsRefreshing(false);
  }, [loadConnections]);

  const handleConnectionPress = useCallback((connection: MatchWithProfile) => {
    router.push(`/chat/${connection.id}` as never);
  }, []);

  const handleLikesPress = useCallback(() => {
    router.push('/(tabs)/likes' as never);
  }, []);

  const totalUnread = connections.reduce((sum, c) => sum + c.unreadCount, 0);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('connections.messagesTitle')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('connections.messagesTitle')}</Text>
        {totalUnread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{totalUnread}</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {connections.length === 0 ? (
          <EmptyState t={t} />
        ) : (
          <>
            {/* Section: Nouveaux Matchs */}
            {(likesCount > 0 || newMatches.length > 0) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('connections.newMatches')}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.newMatchesScroll}
                >
                  {/* Carte des likes */}
                  {likesCount > 0 && (
                    <LikesCard count={likesCount} onPress={handleLikesPress} t={t} />
                  )}
                  {/* Nouveaux matchs sans conversation */}
                  {newMatches.map((match) => (
                    <NewMatchCard
                      key={match.id}
                      match={match}
                      onPress={() => handleConnectionPress(match)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Section: Messages */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('connections.messagesSection')}</Text>
              {activeConversations.length === 0 ? (
                <Text style={styles.noMessages}>{t('connections.noMessagesYet')}</Text>
              ) : (
                activeConversations.map((connection) => (
                  <MessageRow
                    key={connection.id}
                    connection={connection}
                    onPress={() => handleConnectionPress(connection)}
                    t={t}
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  unreadBadge: {
    marginLeft: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Section
  section: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },

  // Nouveaux Matchs - Scroll horizontal
  newMatchesScroll: {
    paddingRight: spacing.lg,
    gap: spacing.md,
  },
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

  // Messages - Liste verticale
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
  messageName: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
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
  noMessages: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 100,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
