import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { ProfileMapView } from '../../src/components/map';
import { useLocation } from '../../src/contexts/LocationContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useTravelMode } from '../../src/hooks/useTravelMode';
import { profilesService } from '../../src/services/supabase/profiles';
import { adminService } from '../../src/services/supabase/admin';
import {
  ProfileGridCard,
  ViewToggle,
  SectionHeader,
  SkeletonCard,
  isUserOnline,
} from '../../src/components/explore';
import type { ViewMode } from '../../src/components/explore';
import type { ProfileWithDistance } from '../../src/types/profile';

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { latitude, longitude, searchRadius, isEnabled, city, getLocationDisplayName } = useLocation();
  const { travelMode, hasActiveTravelMode } = useTravelMode();
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileWithDistance[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verifier si l'utilisateur est admin
  useEffect(() => {
    if (user) {
      adminService.isAdmin(user.id).then((admin) => {
        setIsAdmin(admin);
      });
    }
  }, [user]);

  // Position effective (mode voyage si actif, sinon position reelle, sinon Paris par defaut)
  const DEFAULT_LAT = 48.8566; // Paris
  const DEFAULT_LNG = 2.3522;

  const effectiveLatitude = hasActiveTravelMode && travelMode
    ? travelMode.destination.latitude
    : (latitude || DEFAULT_LAT);
  const effectiveLongitude = hasActiveTravelMode && travelMode
    ? travelMode.destination.longitude
    : (longitude || DEFAULT_LNG);
  const effectiveCity = hasActiveTravelMode && travelMode
    ? travelMode.destination.city
    : city;

  // Position utilisateur pour la map
  const userLocation = (effectiveLatitude && effectiveLongitude)
    ? { latitude: effectiveLatitude, longitude: effectiveLongitude }
    : null;

  // Fonction pour charger les profils
  const loadProfiles = useCallback(async (showLoading = true) => {
    if (!user) return;
    if (showLoading) setIsLoading(true);

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
        searchRadius: isAdmin ? 50000 : (searchRadius || 50), // Admin: rayon mondial
      },
      effectiveLatitude ?? undefined,
      effectiveLongitude ?? undefined,
      null, // activeMode
      isAdmin // Permet de voir tous les profils sans limite de distance
    );

    if (loadedProfiles) {
      setProfiles(loadedProfiles);
    }
    if (showLoading) setIsLoading(false);
  }, [user, effectiveLatitude, effectiveLongitude, searchRadius, isAdmin]);

  // Charger les profils au demarrage
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Rafraichir quand on revient sur l'ecran (apres envoi d'invitation)
  useFocusEffect(
    useCallback(() => {
      // Rafraichir sans afficher le loading
      loadProfiles(false);
    }, [loadProfiles])
  );

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadProfiles(false);
    setIsRefreshing(false);
  }, [loadProfiles]);

  // Profile press handler
  const handleProfilePress = useCallback(
    (profile: ProfileWithDistance | { id: string }) => {
      router.push(`/profile/${profile.id}?from=explore` as never);
    },
    [router]
  );

  // Render profile card
  const renderProfile = useCallback(
    ({ item }: { item: ProfileWithDistance }) => (
      <ProfileGridCard
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
                name={hasActiveTravelMode ? "airplane" : isEnabled ? "location" : "location-outline"}
                size={14}
                color={hasActiveTravelMode ? colors.primary : isEnabled ? colors.primary : colors.textTertiary}
              />
              <Text style={[styles.subtitle, (isEnabled || hasActiveTravelMode) && styles.locationActive]}>
                {hasActiveTravelMode
                  ? `\u2708\ufe0f ${effectiveCity}`
                  : isEnabled
                    ? (city || getLocationDisplayName())
                    : t('explore.locationDisabled')}
              </Text>
              <Ionicons name="chevron-forward" size={12} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>
        <ViewToggle mode={viewMode} onChange={setViewMode} t={t} />
      </View>

      {viewMode === 'map' ? (
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
      ) : isLoading ? (
        renderSkeletons()
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

  // Skeleton
  skeletonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
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
