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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../../src/theme';
import { IntentionBadge } from '../../src/components/profile';
import { useAuth } from '../../src/contexts/AuthContext';
import { Profile } from '../../src/types/profile';
// import { invitationsService } from '../../src/services/supabase';

const { width } = Dimensions.get('window');

// Types
interface Invitation {
  id: string;
  senderId: string;
  receiverId: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  sentAt: string;
  expiresAt: string;
  senderProfile: Profile;
}

// Helper function pour calculer le temps écoulé
const getTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "A l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return `Il y a ${Math.floor(diffDays / 7)} sem.`;
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
}

const InvitationCard = ({ invitation, onAccept, onRefuse, onRemove }: InvitationCardProps) => {
  const profile = invitation.senderProfile;
  const timeAgo = getTimeAgo(invitation.sentAt);
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
      'Refuser cette invitation ?',
      `Voulez-vous vraiment refuser l'invitation de ${profile.displayName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
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
          {invitation.message && (
            <Text style={styles.message} numberOfLines={2}>
              "{invitation.message}"
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.refuseButton} onPress={handleRefuse} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
          <Text style={styles.refuseText}>Refuser</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.acceptButton} onPress={handleAccept} activeOpacity={0.8}>
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.acceptGradient}
          >
            <Ionicons name="checkmark" size={24} color={colors.white} />
            <Text style={styles.acceptText}>Accepter</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Empty state component
const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconContainer}>
      <Text style={styles.emptyIcon}>💌</Text>
    </View>
    <Text style={styles.emptyTitle}>Pas encore d'invitations</Text>
    <Text style={styles.emptySubtitle}>
      Les personnes interessees par votre profil apparaitront ici. Continuez a explorer !
    </Text>
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
        <Text style={styles.exploreText}>Explorer les profils</Text>
      </LinearGradient>
    </TouchableOpacity>
  </View>
);

// Main screen component
export default function InvitationsScreen() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  // Mock data pour le developpement
  const mockInvitations: Invitation[] = [
    {
      id: '1',
      senderId: 'user1',
      receiverId: user?.id || '',
      message: 'Salut ! Ton profil a attiré mon attention 😊',
      status: 'pending',
      sentAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      senderProfile: {
        id: 'user1',
        displayName: 'Lucas',
        birthDate: '1995-05-15',
        age: 28,
        gender: 'male',
        hairColor: 'brown',
        bio: 'Passionné de voyage et de photographie',
        intention: 'dating',
        availability: 'today',
        languages: ['french'],
        interests: ['travel', 'photography'],
        photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'],
        locationEnabled: false,
        latitude: null,
        longitude: null,
        locationUpdatedAt: null,
        searchRadius: 25,
        minAgeFilter: 18,
        maxAgeFilter: 35,
        genderFilter: ['female'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    {
      id: '2',
      senderId: 'user2',
      receiverId: user?.id || '',
      message: null,
      status: 'pending',
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3h ago
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      senderProfile: {
        id: 'user2',
        displayName: 'Thomas',
        birthDate: '1992-08-22',
        age: 31,
        gender: 'male',
        hairColor: 'black',
        bio: 'Amateur de musique et de concerts',
        intention: 'social',
        availability: 'evening',
        languages: ['french', 'english'],
        interests: ['music', 'concerts'],
        photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'],
        locationEnabled: false,
        latitude: null,
        longitude: null,
        locationUpdatedAt: null,
        searchRadius: 50,
        minAgeFilter: 18,
        maxAgeFilter: 40,
        genderFilter: ['female'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    {
      id: '3',
      senderId: 'user3',
      receiverId: user?.id || '',
      message: 'Hey ! On a les memes centres d\'interet, ca te dit qu\'on discute ?',
      status: 'pending',
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      senderProfile: {
        id: 'user3',
        displayName: 'Mathieu',
        birthDate: '1998-02-10',
        age: 25,
        gender: 'male',
        hairColor: 'blonde',
        bio: 'Sportif et foodie',
        intention: 'amical',
        availability: 'weekend',
        languages: ['french'],
        interests: ['sport', 'food'],
        photos: ['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'],
        locationEnabled: false,
        latitude: null,
        longitude: null,
        locationUpdatedAt: null,
        searchRadius: 25,
        minAgeFilter: 20,
        maxAgeFilter: 30,
        genderFilter: ['female', 'male'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  ];

  const loadInvitations = useCallback(async () => {
    try {
      // TODO: Remplacer par l'appel API reel
      // const data = await invitationsService.getReceivedInvitations(user?.id);
      // setInvitations(data);

      // Simulation du chargement
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setInvitations(mockInvitations);
    } catch (error) {
      console.error('Error loading invitations:', error);
      Alert.alert('Erreur', 'Impossible de charger les invitations');
    }
  }, [user?.id]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadInvitations();
      setIsLoading(false);
    };
    load();
  }, [loadInvitations]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setRemovedIds(new Set());
    await loadInvitations();
    setIsRefreshing(false);
  }, [loadInvitations]);

  const handleAccept = useCallback(
    async (invitationId: string) => {
      try {
        // TODO: Remplacer par l'appel API reel
        // await invitationsService.acceptInvitation(invitationId);

        // Trouver l'invitation pour avoir les infos du sender
        const invitation = invitations.find((inv) => inv.id === invitationId);
        if (invitation) {
          // Rediriger vers la conversation
          router.push(`/chat/${invitation.senderId}` as never);
        }
      } catch (error) {
        console.error('Error accepting invitation:', error);
        Alert.alert('Erreur', "Impossible d'accepter l'invitation");
      }
    },
    [invitations]
  );

  const handleRefuse = useCallback(async (invitationId: string) => {
    try {
      // TODO: Remplacer par l'appel API reel
      // await invitationsService.declineInvitation(invitationId);
      console.log('Invitation refused:', invitationId);
    } catch (error) {
      console.error('Error refusing invitation:', error);
      Alert.alert('Erreur', "Impossible de refuser l'invitation");
    }
  }, []);

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
      />
    ),
    [handleAccept, handleRefuse, handleRemove]
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
        <Text style={styles.title}>Invitations</Text>
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
        <EmptyState />
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
  message: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
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
