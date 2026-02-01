import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { IntentionBadge } from '../../src/components/profile/IntentionBadge';
import { ProfileMapView } from '../../src/components/map';
import { useLocation } from '../../src/contexts/LocationContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { profilesService } from '../../src/services/supabase/profiles';
import type { ProfileWithDistance } from '../../src/types/profile';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 2 - spacing.sm * 2) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

type ViewMode = 'map' | 'grid';

// Skeleton loading card
const SkeletonCard = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonImage} />
    </Animated.View>
  );
};

// Profile card component
interface ProfileCardProps {
  profile: ProfileWithDistance;
  onPress: () => void;
}

// Check if user was active in the last 5 minutes
const isUserOnline = (lastActiveAt: string | null | undefined): boolean => {
  if (!lastActiveAt) return false;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return new Date(lastActiveAt) > fiveMinutesAgo;
};

const ProfileCard = ({ profile, onPress }: ProfileCardProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const photoUrl = profile.photos?.[0] || 'https://via.placeholder.com/300x400';
  const isOnline = isUserOnline(profile.lastActiveAt);

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.cardTouchable}
      >
        <Image source={{ uri: photoUrl }} style={styles.cardImage} />

        {/* Online indicator */}
        {isOnline && (
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineDot} />
          </View>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.cardGradient}
        >
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>
              {profile.displayName}
            </Text>
            <Text style={styles.cardAge}>{profile.age} ans</Text>
            {profile.distance !== null && (
              <View style={styles.distanceRow}>
                <Ionicons name="location" size={10} color={colors.tabBarActive} />
                <Text style={styles.distanceText}>{profile.distance} km</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Intention badge */}
        <View style={styles.intentionBadgeContainer}>
          <IntentionBadge intention={profile.intention} size="small" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Section header component
interface SectionHeaderProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  count?: number;
}

const SectionHeader = ({ title, icon, color, count }: SectionHeaderProps) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionTitleRow}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.sectionTitle}>{title}</Text>
      {count !== undefined && (
        <View style={[styles.countBadge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.countText, { color }]}>{count}</Text>
        </View>
      )}
    </View>
  </View>
);

// Toggle button component
interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  t: (key: string) => string;
}

const ViewToggle = ({ mode, onChange, t }: ViewToggleProps) => (
  <View style={styles.toggleContainer}>
    <TouchableOpacity
      style={[styles.toggleButton, mode === 'map' && styles.toggleButtonActive]}
      onPress={() => onChange('map')}
    >
      <Ionicons
        name="map"
        size={20}
        color={mode === 'map' ? colors.white : colors.textSecondary}
      />
      <Text style={[styles.toggleText, mode === 'map' && styles.toggleTextActive]}>
        {t('explore.map')}
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.toggleButton, mode === 'grid' && styles.toggleButtonActive]}
      onPress={() => onChange('grid')}
    >
      <Ionicons
        name="grid"
        size={20}
        color={mode === 'grid' ? colors.white : colors.textSecondary}
      />
      <Text style={[styles.toggleText, mode === 'grid' && styles.toggleTextActive]}>
        {t('explore.grid')}
      </Text>
    </TouchableOpacity>
  </View>
);

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { latitude, longitude, searchRadius, isEnabled, city, getLocationDisplayName } = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileWithDistance[]>([]);

  // Position utilisateur (utiliser la vraie position si disponible)
  const userLocation = (latitude && longitude)
    ? { latitude, longitude }
    : null;

  // Charger les profils depuis Supabase
  useEffect(() => {
    const loadProfiles = async () => {
      if (!user) return;
      setIsLoading(true);

      const { profiles: loadedProfiles } = await profilesService.getDiscoverProfiles(
        user.id,
        {
          minAge: 18,
          maxAge: 99,
          genders: [],
          intentions: [],
          hairColors: [],
          languages: [],
          interests: [],
          searchRadius: searchRadius || 50,
        },
        latitude ?? undefined,
        longitude ?? undefined
      );

      if (loadedProfiles) {
        setProfiles(loadedProfiles);
      }
      setIsLoading(false);
    };

    loadProfiles();
  }, [user, latitude, longitude, searchRadius]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setIsRefreshing(true);

    const { profiles: loadedProfiles } = await profilesService.getDiscoverProfiles(
      user.id,
      {
        minAge: 18,
        maxAge: 99,
        genders: [],
        intentions: [],
        hairColors: [],
        languages: [],
        interests: [],
        searchRadius: searchRadius || 50,
      },
      latitude ?? undefined,
      longitude ?? undefined
    );

    if (loadedProfiles) {
      setProfiles(loadedProfiles);
    }
    setIsRefreshing(false);
  }, [user, latitude, longitude, searchRadius]);

  // Profile press handler
  const handleProfilePress = useCallback(
    (profile: ProfileWithDistance | { id: string }) => {
      router.push(`/profile/${profile.id}` as never);
    },
    [router]
  );

  // Render profile card
  const renderProfile = useCallback(
    ({ item }: { item: ProfileWithDistance }) => (
      <ProfileCard
        profile={item}
        onPress={() => handleProfilePress(item)}
      />
    ),
    [handleProfilePress]
  );

  // Render loading skeletons
  const renderSkeletons = () => (
    <View style={styles.skeletonContainer}>
      {[...Array(9)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );

  // Online profiles (active in the last 5 minutes)
  const onlineProfiles = profiles.filter((p) => isUserOnline(p.lastActiveAt));
  const nearbyProfiles = profiles.filter((p) => p.distance !== null && p.distance <= 5);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header avec toggle */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Explore</Text>
            <TouchableOpacity
              style={styles.locationRow}
              onPress={() => router.push('/profile/settings' as never)}
            >
              <Ionicons
                name={isEnabled ? "location" : "location-outline"}
                size={14}
                color={isEnabled ? colors.primary : colors.textTertiary}
              />
              <Text style={[styles.subtitle, isEnabled && styles.locationActive]}>
                {isEnabled ? (city || getLocationDisplayName()) : t('explore.locationDisabled')}
              </Text>
              <Ionicons name="chevron-forward" size={12} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>
        <ViewToggle mode={viewMode} onChange={setViewMode} t={t} />
      </View>

      {isLoading ? (
        renderSkeletons()
      ) : viewMode === 'map' ? (
        // Vue Carte avec fond pour la tab bar
        <View style={styles.mapContainer}>
          <ProfileMapView
            profiles={profiles}
            userLocation={userLocation}
            searchRadius={searchRadius || 25}
            onProfilePress={handleProfilePress}
            isLoading={isLoading}
          />
          {/* Fond pour la tab bar */}
          <View style={styles.mapBottomOverlay} />
        </View>
      ) : (
        // Vue Grille
        <FlatList
          data={profiles}
          renderItem={renderProfile}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.tabBarActive}
              colors={[colors.tabBarActive]}
            />
          }
          ListHeaderComponent={
            <View>
              {/* Online now section */}
              {onlineProfiles.length > 0 && (
                <SectionHeader
                  title={t('explore.onlineNow')}
                  icon="radio-button-on"
                  color={colors.online}
                  count={onlineProfiles.length}
                />
              )}

              {/* Nearby section */}
              <SectionHeader
                title={t('explore.nearbySection')}
                icon="location"
                color={colors.tabBarActive}
                count={nearbyProfiles.length}
              />
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="compass-outline" size={64} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>{t('explore.noOneNearby')}</Text>
              <Text style={styles.emptyText}>{t('explore.enableLocationHint')}</Text>
            </View>
          }
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  locationActive: {
    color: colors.primary,
  },

  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.white,
  },

  // Section header
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  countText: {
    ...typography.labelSmall,
    fontWeight: '700',
  },

  // Map container
  mapContainer: {
    flex: 1,
  },
  mapBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: colors.background,
  },

  // Grid
  gridContent: {
    paddingBottom: 120, // Space for tab bar
  },
  gridRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  // Card
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.card,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTouchable: {
    flex: 1,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  cardInfo: {
    gap: 1,
  },
  cardName: {
    ...typography.labelSmall,
    color: colors.textLight,
    fontWeight: '700',
    fontSize: 12,
  },
  cardAge: {
    ...typography.caption,
    color: colors.textLightSecondary,
    fontSize: 10,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  distanceText: {
    ...typography.caption,
    color: colors.tabBarActive,
    fontSize: 9,
    fontWeight: '600',
  },

  // Online indicator
  onlineIndicator: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.online,
  },

  // Intention badge
  intentionBadgeContainer: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
  },

  // Skeleton
  skeletonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  skeletonCard: {
    backgroundColor: colors.surface,
  },
  skeletonImage: {
    flex: 1,
    backgroundColor: colors.border,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
