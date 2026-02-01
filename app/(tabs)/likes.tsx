import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../../src/theme';
import { IntentionBadge } from '../../src/components/profile';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { invitationsService } from '../../src/services/supabase/invitations';
import { useFocusEffect } from 'expo-router';
import type { InvitationWithProfile } from '../../src/types/match';

const { width } = Dimensions.get('window');

// Type alias for clarity
type Invitation = InvitationWithProfile;

// Helper function pour calculer le temps ecoule
const getTimeAgo = (dateString: string, t: (key: string) => string): string => {
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
const SkeletonCard = () => (
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
  invitation: Invitation;
  onAccept: (id: string) => void;
  onRefuse: (id: string) => void;
  onRemove: () => void;
  t: (key: string) => string;
}

const InvitationCard = ({ invitation, onAccept, onRefuse, onRemove, t }: InvitationCardProps) => {
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
    router.push(`/profile/${profile.id}` as never);
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

// Empty state component
const EmptyState = ({ t }: { t: (key: string) => string }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconContainer}>
      <Text style={styles.emptyIcon}>💌</Text>
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

// Main screen component
export default function InvitationsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const loadInvitations = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { invitations: data, error } = await invitationsService.getReceivedInvitations(user.id);

      if (error) {
        console.error('Error loading invitations:', error);
        Alert.alert(t('alerts.errorTitle'), t('errors.unableToLoadInvitations'));
        return;
      }

      setInvitations(data);
    } catch (error) {
      console.error('Error loading invitations:', error);
      Alert.alert(t('alerts.errorTitle'), t('errors.unableToLoadInvitations'));
    }
  }, [user?.id, t]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadInvitations();
      setIsLoading(false);
    };
    load();
  }, [loadInvitations]);

  // Marquer les invitations comme vues quand l'écran devient visible
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        // Marquer comme vues après un petit délai pour s'assurer que la liste est affichée
        const timer = setTimeout(() => {
          invitationsService.markInvitationsAsSeen(user.id);
        }, 500);
        return () => clearTimeout(timer);
      }
    }, [user?.id])
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setRemovedIds(new Set());
    await loadInvitations();
    setIsRefreshing(false);
  }, [loadInvitations]);

  const handleAccept = useCallback(
    async (invitationId: string) => {
      if (!user?.id) return;

      try {
        const { conversationId, error } = await invitationsService.acceptInvitation(invitationId, user.id);

        if (error) {
          Alert.alert(t('alerts.errorTitle'), error);
          return;
        }

        if (conversationId) {
          // Retirer de la liste locale
          setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
          // Naviguer vers le chat
          router.push(`/chat/${conversationId}` as never);
        }
      } catch (error) {
        console.error('Error accepting invitation:', error);
        Alert.alert(t('alerts.errorTitle'), t('errors.unableToAccept'));
      }
    },
    [user?.id, t]
  );

  const handleRefuse = useCallback(async (invitationId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await invitationsService.refuseInvitation(invitationId, user.id);

      if (error) {
        Alert.alert(t('alerts.errorTitle'), error);
        return;
      }

      // Retirer l'invitation de la liste locale
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (error) {
      console.error('Error refusing invitation:', error);
      Alert.alert(t('alerts.errorTitle'), t('errors.unableToRefuse'));
    }
  }, [user?.id, t]);

  const handleRemove = useCallback((invitationId: string) => {
    setRemovedIds((prev) => new Set([...prev, invitationId]));
  }, []);

  // Filtrer les invitations supprimées
  const visibleInvitations = invitations.filter((inv) => !removedIds.has(inv.id));

  const renderItem = useCallback(
    ({ item }: { item: Invitation }) => (
      <InvitationCard
        invitation={item}
        onAccept={handleAccept}
        onRefuse={handleRefuse}
        onRemove={() => handleRemove(item.id)}
        t={t}
      />
    ),
    [handleAccept, handleRefuse, handleRemove, t]
  );

  const renderSkeleton = () => (
    <View style={styles.listContent}>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('invitations.title')}</Text>
        {visibleInvitations.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{visibleInvitations.length}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        renderSkeleton()
      ) : visibleInvitations.length === 0 ? (
        <EmptyState t={t} />
      ) : (
        <FlatList
          data={visibleInvitations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginLeft: spacing.md,
    minWidth: 32,
    alignItems: 'center',
  },
  badgeText: {
    ...typography.labelSmall,
    color: colors.white,
    fontWeight: '700',
  },

  // List
  listContent: {
    padding: spacing.lg,
  },
  separator: {
    height: spacing.md,
  },

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

  // Empty state
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
