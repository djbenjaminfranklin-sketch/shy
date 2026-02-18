import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { InvitationCard, SentInvitationCard, InvitationSkeletonCard } from './InvitationCard';
import type { InvitationWithProfile } from '../../types/match';

type TabType = 'received' | 'sent';

// Empty state component
const EmptyState = ({ t }: { t: (key: string) => string }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconContainer}>
      <Text style={styles.emptyIcon}>{'💌'}</Text>
    </View>
    <Text style={styles.emptyTitle}>{t('invitations.noInvitations')}</Text>
    <Text style={styles.emptySubtitle}>{t('invitations.noInvitationsHint')}</Text>
    <TouchableOpacity
      style={styles.exploreButton}
      onPress={() => router.push('/(tabs)/discover')}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.exploreGradient}
      >
        <Text style={styles.exploreText}>{t('invitations.exploreProfiles')}</Text>
      </LinearGradient>
    </TouchableOpacity>
  </View>
);

interface InvitationsListProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  receivedInvitations: InvitationWithProfile[];
  sentInvitations: InvitationWithProfile[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onAccept: (id: string) => void;
  onRefuse: (id: string) => void;
  onRemove: (id: string) => void;
  t: (key: string) => string;
}

export const InvitationsList = ({
  activeTab,
  setActiveTab,
  receivedInvitations,
  sentInvitations,
  isLoading,
  isRefreshing,
  onRefresh,
  onAccept,
  onRefuse,
  onRemove,
  t,
}: InvitationsListProps) => {
  const visibleSentInvitations = sentInvitations.filter((inv) => inv.status === 'pending');
  const currentInvitations = activeTab === 'received' ? receivedInvitations : visibleSentInvitations;

  const renderReceivedItem = useCallback(
    ({ item }: { item: InvitationWithProfile }) => (
      <InvitationCard
        invitation={item}
        onAccept={onAccept}
        onRefuse={onRefuse}
        onRemove={() => onRemove(item.id)}
        t={t}
      />
    ),
    [onAccept, onRefuse, onRemove, t]
  );

  const renderSentItem = useCallback(
    ({ item }: { item: InvitationWithProfile }) => (
      <SentInvitationCard invitation={item} t={t} />
    ),
    [t]
  );

  const renderSkeleton = () => (
    <View style={styles.listContent}>
      <InvitationSkeletonCard />
      <InvitationSkeletonCard />
      <InvitationSkeletonCard />
    </View>
  );

  return (
    <>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && styles.tabActive]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[styles.tabText, activeTab === 'received' && styles.tabTextActive]}>
            {t('invitations.received')} ({receivedInvitations.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.tabActive]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.tabTextActive]}>
            {t('invitations.sent')} ({visibleSentInvitations.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        renderSkeleton()
      ) : currentInvitations.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          <EmptyState t={t} />
        </ScrollView>
      ) : (
        <FlatList
          data={currentInvitations}
          keyExtractor={(item) => item.id}
          renderItem={activeTab === 'received' ? renderReceivedItem : renderSentItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },

  // List
  listContent: {
    padding: spacing.lg,
  },
  separator: {
    height: spacing.md,
  },

  // Empty state
  emptyScrollContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyIcon: {
    fontSize: 56,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  exploreButton: {
    width: '100%',
    maxWidth: 280,
  },
  exploreGradient: {
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
