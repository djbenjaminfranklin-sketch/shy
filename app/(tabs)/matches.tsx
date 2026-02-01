import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { matchesService } from '../../src/services/supabase/matches';
import type { MatchWithProfile } from '../../src/types/match';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convertit une date ISO en temps relatif lisible
 */
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

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return t('time.weeksAgo').replace('{0}', String(diffInWeeks));
  }

  // Format date for older messages
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// =============================================================================
// Components
// =============================================================================

interface ConnectionCardProps {
  connection: MatchWithProfile;
  onPress: () => void;
  t: (key: string) => string;
}

/**
 * Carte de connexion - Grande et lisible
 */
function ConnectionCard({ connection, onPress, t }: ConnectionCardProps) {
  const { profile, lastMessage, lastMessageAt, unreadCount } = connection;
  const timeAgo = getTimeAgo(lastMessageAt, t);
  const hasPhoto = profile.photos && profile.photos.length > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {hasPhoto ? (
          <Image source={{ uri: profile.photos[0] }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={28} color={colors.textTertiary} />
          </View>
        )}

        {/* Badge messages non lus */}
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </View>

      {/* Contenu */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.name} numberOfLines={1}>
            {profile.displayName}, {profile.age}
          </Text>
          {timeAgo && (
            <Text style={styles.time}>{timeAgo}</Text>
          )}
        </View>

        <Text
          style={[
            styles.lastMessage,
            unreadCount > 0 && styles.lastMessageUnread,
          ]}
          numberOfLines={1}
        >
          {lastMessage || t('connections.startChatting')}
        </Text>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

/**
 * Etat vide - Pas de connexions
 */
function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="heart-outline" size={64} color={colors.primaryLight} />
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

/**
 * Etat de chargement
 */
function LoadingState({ t }: { t: (key: string) => string }) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>{t('common.loading')}</Text>
    </View>
  );
}

// =============================================================================
// Main Screen
// =============================================================================

export default function ConnectionsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [connections, setConnections] = useState<MatchWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Note: error state is tracked but not displayed in UI for now
  const [_error, setError] = useState<string | null>(null);

  /**
   * Charger les connexions depuis le backend
   */
  const loadConnections = useCallback(async () => {
    if (!user) {
      setConnections([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setError(null);
      const { matches, error: fetchError } = await matchesService.getMatches(user.id);

      if (fetchError) {
        console.error('Error loading connections:', fetchError);
        setError(fetchError);
        setConnections([]);
      } else {
        // Trier par dernier message (plus recent en premier)
        const sorted = [...matches].sort((a, b) => {
          const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return dateB - dateA;
        });
        setConnections(sorted);
      }
    } catch (err) {
      console.error('Error loading connections:', err);
      setError('Une erreur est survenue');
      setConnections([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Chargement initial
   */
  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  /**
   * Rafraichissement pull-to-refresh
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadConnections();
    setIsRefreshing(false);
  }, [loadConnections]);

  /**
   * Navigation vers le chat
   */
  const handleConnectionPress = useCallback((connection: MatchWithProfile) => {
    // Navigation vers le chat avec l'ID du match
    router.push(`/chat/${connection.id}` as never);
  }, []);

  /**
   * Compter les messages non lus
   */
  const totalUnread = connections.reduce((sum, c) => sum + c.unreadCount, 0);

  // Affichage du chargement
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('connections.title')}</Text>
        </View>
        <LoadingState t={t} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('connections.title')}</Text>
        {connections.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{connections.length}</Text>
          </View>
        )}
        {totalUnread > 0 && (
          <View style={styles.unreadTotalBadge}>
            <Ionicons name="chatbubble" size={14} color={colors.white} />
            <Text style={styles.unreadTotalText}>{totalUnread}</Text>
          </View>
        )}
      </View>

      {/* Liste des connexions */}
      <FlatList
        data={connections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConnectionCard
            connection={item}
            onPress={() => handleConnectionPress(item)}
            t={t}
          />
        )}
        contentContainerStyle={[
          styles.list,
          connections.length === 0 && styles.listEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={<EmptyState t={t} />}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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

  // Header
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
  countBadge: {
    marginLeft: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  unreadTotalBadge: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    gap: 4,
  },
  unreadTotalText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },

  // Liste
  list: {
    padding: spacing.lg,
  },
  listEmpty: {
    flexGrow: 1,
  },
  separator: {
    height: spacing.md,
  },

  // Card - Grande et touchable
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    // Shadow douce
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
    paddingHorizontal: 6,
  },
  unreadText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  time: {
    fontSize: 13,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
  lastMessage: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  lastMessageUnread: {
    color: colors.text,
    fontWeight: '500',
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
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
