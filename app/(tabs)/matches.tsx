import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { matchesService } from '../../src/services/supabase/matches';
import type { MatchWithProfile } from '../../src/types/match';
import { MatchesList, EmptyState } from '../../src/components/matches';

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

  // Separer les nouveaux matchs (sans message) et les conversations actives
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
        setConnections([]);
      } else {
        // Trier par dernier message (plus recent en premier)
        const sorted = [...matches].sort((a, b) => {
          const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
          const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
        setConnections(sorted);
      }

      // Charger le nombre de likes recus
      const { likes } = await matchesService.getReceivedLikes(user.id);
      setLikesCount(likes.length);
    } catch (err) {
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
          <MatchesList
            newMatches={newMatches}
            activeConversations={activeConversations}
            likesCount={likesCount}
            onConnectionPress={handleConnectionPress}
            onLikesPress={handleLikesPress}
            t={t}
          />
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
});
