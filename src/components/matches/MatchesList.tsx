import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import type { MatchWithProfile } from '../../types/match';
import { LikesCard, NewMatchCard, MessageRow } from './MatchCard';

// =============================================================================
// EmptyState
// =============================================================================

interface EmptyStateProps {
  t: (key: string) => string;
}

/**
 * Etat vide
 */
export function EmptyState({ t }: EmptyStateProps) {
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
// MatchesList
// =============================================================================

interface MatchesListProps {
  newMatches: MatchWithProfile[];
  activeConversations: MatchWithProfile[];
  likesCount: number;
  onConnectionPress: (connection: MatchWithProfile) => void;
  onLikesPress: () => void;
  t: (key: string) => string;
}

/**
 * Liste rendering avec sections (nouveaux matchs, messages)
 */
export function MatchesList({
  newMatches,
  activeConversations,
  likesCount,
  onConnectionPress,
  onLikesPress,
  t,
}: MatchesListProps) {
  return (
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
              <LikesCard count={likesCount} onPress={onLikesPress} t={t} />
            )}
            {/* Nouveaux matchs sans conversation */}
            {newMatches.map((match) => (
              <NewMatchCard
                key={match.id}
                match={match}
                onPress={() => onConnectionPress(match)}
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
              onPress={() => onConnectionPress(connection)}
              t={t}
            />
          ))
        )}
      </View>
    </>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
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
  newMatchesScroll: {
    paddingRight: spacing.lg,
    gap: spacing.md,
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
