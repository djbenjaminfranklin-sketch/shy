import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Animated,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLocation } from '../../src/contexts/LocationContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { profilesService } from '../../src/services/supabase/profiles';
import { matchesService } from '../../src/services/supabase/matches';
import { invitationsService } from '../../src/services/supabase/invitations';
import { canSendDirectMessage } from '../../src/utils/messagingPermissions';
import { Profile, ProfileWithDistance } from '../../src/types/profile';
import { useAvailabilityMode } from '../../src/hooks/useAvailabilityMode';
import { useTravelMode } from '../../src/hooks/useTravelMode';
import { ActiveModeIndicator, ModeActivationModal } from '../../src/components/availability';
import { PaywallModal } from '../../src/components/subscription/PaywallModal';
import { FilterModal } from '../../src/components/discover/FilterModal';
import type { AvailabilityModeType, ModeDuration } from '../../src/types/availabilityMode';
import type { TravelLocation } from '../../src/types/travelMode';
import type { ProfileFilters } from '../../src/types/profile';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 300;

// Action Button Component
interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  glowColor: string;
  size?: number;
  onPress: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  color,
  glowColor,
  size = 60,
  onPress
}) => (
  <TouchableOpacity
    style={[
      styles.actionButton,
      {
        width: size,
        height: size,
        backgroundColor: colors.card,
        shadowColor: glowColor,
      }
    ]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Ionicons name={icon} size={size * 0.45} color={color} />
  </TouchableOpacity>
);

export default function DiscoverScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isEnabled: locationEnabled, city, getLocationDisplayName, latitude, longitude } = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'favorites' | 'nearby'>('favorites');
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<ProfileWithDistance[]>([]);
  const [imageError, setImageError] = useState(false);

  // Availability mode state
  const {
    activeMode,
    hasActiveMode,
    remainingTimeFormatted,
    isExpiringSoon,
    activateMode,
    deactivateMode,
    canUse72Hours,
    hasRemainingActivations,
    weeklyActivationsUsed,
    weeklyActivationsLimit,
    isLoading: isModeLoading,
  } = useAvailabilityMode();
  const [showModeModal, setShowModeModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Travel mode hook
  const {
    travelMode,
    canUseTravelMode,
    hasActiveTravelMode,
    activateTravelMode,
    deactivateTravelMode,
  } = useTravelMode();

  // Determine which coordinates to use for discovery
  // If travel mode is active, use travel destination coordinates
  const effectiveLatitude = hasActiveTravelMode && travelMode
    ? travelMode.destination.latitude
    : latitude;
  const effectiveLongitude = hasActiveTravelMode && travelMode
    ? travelMode.destination.longitude
    : longitude;
  const effectiveLocationName = hasActiveTravelMode && travelMode
    ? travelMode.destination.city
    : (city || getLocationDisplayName());

  // Charger mon profil pour connaitre mon genre
  useEffect(() => {
    if (user) {
      profilesService.getProfile(user.id).then(({ profile }) => {
        setMyProfile(profile);
      });
    }
  }, [user]);

  // Charger les profils depuis Supabase
  useEffect(() => {
    const loadProfiles = async () => {
      if (!user) return;
      // Si l'utilisateur a un mode actif, ne montrer que les profils avec le même mode
      const activeModeType = hasActiveMode && activeMode?.modeType ? activeMode.modeType : null;

      const { profiles: loadedProfiles } = await profilesService.getDiscoverProfiles(
        user.id,
        {
          minAge: myProfile?.minAgeFilter || 18,
          maxAge: myProfile?.maxAgeFilter || 99,
          genders: myProfile?.genderFilter || [],
          intentions: [],
          hairColors: [],
          languages: [],
          interests: [],
          searchRadius: myProfile?.searchRadius || 50,
        },
        effectiveLatitude ?? undefined,
        effectiveLongitude ?? undefined,
        activeModeType
      );
      if (loadedProfiles) {
        setProfiles(loadedProfiles);
        // Réinitialiser l'index si les profils changent
        setCurrentIndex(0);
      }
    };
    if (myProfile) {
      loadProfiles();
    }
  }, [user, myProfile, effectiveLatitude, effectiveLongitude, hasActiveMode, activeMode?.modeType, hasActiveTravelMode]);

  const swipeAnim = useRef(new Animated.ValueXY()).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const nextCardScale = useRef(new Animated.Value(0.95)).current;
  const likeOpacity = useRef(new Animated.Value(0)).current;
  const nopeOpacity = useRef(new Animated.Value(0)).current;
  const superLikeOpacity = useRef(new Animated.Value(0)).current;

  // Filtrer les profils selon l'onglet actif
  const filteredProfiles = activeTab === 'nearby'
    ? profiles.filter(p => p.distance !== null && p.distance <= 5) // Profils a moins de 5km
    : profiles; // Tous les profils pour "Coups de Coeur"

  const profile = filteredProfiles[currentIndex];

  // Reset animations for new card
  const resetAnimations = useCallback(() => {
    swipeAnim.setValue({ x: 0, y: 0 });
    rotateAnim.setValue(0);
    likeOpacity.setValue(0);
    nopeOpacity.setValue(0);
    superLikeOpacity.setValue(0);
    setCurrentPhotoIndex(0);
    setImageError(false);
  }, [swipeAnim, rotateAnim, likeOpacity, nopeOpacity, superLikeOpacity]);

  // Reset animations when profile changes - useLayoutEffect pour éviter le flash
  useLayoutEffect(() => {
    swipeAnim.setValue({ x: 0, y: 0 });
    rotateAnim.setValue(0);
    likeOpacity.setValue(0);
    nopeOpacity.setValue(0);
    superLikeOpacity.setValue(0);
    setCurrentPhotoIndex(0);
    setImageError(false);
  }, [currentIndex]);

  // Go to next profile
  const goToNextProfile = useCallback(() => {
    const filtered = activeTab === 'nearby'
      ? profiles.filter(p => p.distance !== null && p.distance <= 5)
      : profiles;
    const maxIndex = filtered.length - 1;

    // Juste changer l'index - les animations sont reinitialisees dans useEffect
    if (currentIndex < maxIndex) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, activeTab, profiles]);

  // Go to previous profile (rewind)
  const goToPreviousProfile = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // Swipe animation - simplifié sans opacité
  const swipeCard = useCallback((direction: 'left' | 'right' | 'up') => {
    const x = direction === 'left' ? -SCREEN_WIDTH * 1.5 : direction === 'right' ? SCREEN_WIDTH * 1.5 : 0;
    const y = direction === 'up' ? -SCREEN_HEIGHT : 0;

    Animated.timing(swipeAnim, {
      toValue: { x, y },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: true,
    }).start(() => {
      goToNextProfile();
    });
  }, [swipeAnim, goToNextProfile]);

  // Action handlers
  const handleLike = useCallback(async () => {
    if (!profile || !user) return; // Pas de profil a liker

    // Creer une invitation
    const { error } = await invitationsService.sendInvitation(user.id, profile.id);
    if (error) {
      console.log('Invitation error:', error);
    }

    // Animation puis next
    Animated.sequence([
      Animated.timing(likeOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.delay(100),
    ]).start(() => {
      swipeCard('right');
    });
  }, [likeOpacity, swipeCard, profile, user]);

  const handleNope = useCallback(() => {
    if (!profile) return; // Pas de profil à refuser

    Animated.sequence([
      Animated.timing(nopeOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.delay(100),
    ]).start(() => {
      swipeCard('left');
    });
  }, [nopeOpacity, swipeCard, profile]);

  const handleSuperLike = useCallback(() => {
    if (!profile) return; // Pas de profil

    Animated.sequence([
      Animated.timing(superLikeOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.delay(100),
    ]).start(() => {
      swipeCard('up');
    });
  }, [superLikeOpacity, swipeCard, profile]);

  const handleRewind = useCallback(() => {
    goToPreviousProfile();
  }, [goToPreviousProfile]);

  // Vérifier si je peux envoyer un message direct au profil actuel
  const canDirectMessage = (myProfile && profile)
    ? canSendDirectMessage(myProfile.gender, profile.gender)
    : false;

  const handleSendMessage = useCallback(async () => {
    if (!user || !profile || !myProfile) return;

    // Vérifier si c'est un message direct ou une invitation
    if (canSendDirectMessage(myProfile.gender, profile.gender)) {
      // Message direct autorisé
      try {
        const result = await matchesService.createInstantConnection(
          user.id,
          profile.id,
          myProfile.gender,
          profile.gender
        );

        if (result.error) {
          Alert.alert(t('alerts.errorTitle'), result.error);
          return;
        }

        if (result.conversationId) {
          router.push(`/chat/${result.conversationId}` as never);
        }
      } catch (error) {
        Alert.alert(t('alerts.errorTitle'), t('errors.somethingWrong'));
      }
    } else {
      // Invitation obligatoire - afficher message
      Alert.alert(
        t('discover.invitationRequired'),
        t('discover.invitationRequiredMessage'),
        [{ text: t('common.ok') }]
      );
    }
  }, [router, profile, user, myProfile]);

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        swipeAnim.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        swipeAnim.setValue({ x: gestureState.dx, y: gestureState.dy });

        // Update rotation based on swipe
        const rotate = gestureState.dx / SCREEN_WIDTH * 15;
        rotateAnim.setValue(rotate);

        // Show LIKE/NOPE/SUPER LIKE labels
        if (gestureState.dx > 50) {
          likeOpacity.setValue(Math.min(gestureState.dx / 100, 1));
          nopeOpacity.setValue(0);
        } else if (gestureState.dx < -50) {
          nopeOpacity.setValue(Math.min(Math.abs(gestureState.dx) / 100, 1));
          likeOpacity.setValue(0);
        } else {
          likeOpacity.setValue(0);
          nopeOpacity.setValue(0);
        }

        if (gestureState.dy < -50) {
          superLikeOpacity.setValue(Math.min(Math.abs(gestureState.dy) / 100, 1));
        } else {
          superLikeOpacity.setValue(0);
        }

        // Scale next card
        const scale = Math.min(0.95 + Math.abs(gestureState.dx) / SCREEN_WIDTH * 0.05, 1);
        nextCardScale.setValue(scale);
      },
      onPanResponderRelease: (_, gestureState) => {
        swipeAnim.flattenOffset();

        if (gestureState.dx > SWIPE_THRESHOLD) {
          handleLike();
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          handleNope();
        } else if (gestureState.dy < -SWIPE_THRESHOLD) {
          handleSuperLike();
        } else {
          // Reset to center
          Animated.parallel([
            Animated.spring(swipeAnim, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
              friction: 5,
            }),
            Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(likeOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(nopeOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(superLikeOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(nextCardScale, {
              toValue: 0.95,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  // Handle availability mode activation
  const handleActivateMode = useCallback(async (modeType: AvailabilityModeType, duration: ModeDuration) => {
    const result = await activateMode({
      modeType,
      durationHours: duration,
      showBadge: true,
    });

    if (result.success) {
      setShowModeModal(false);
      Alert.alert(
        t('discover.modeActivated') || 'Mode activé',
        t('discover.modeActivatedMessage') || 'Vous ne verrez que les profils dans le même mode.',
        [{ text: t('common.ok') }]
      );
    } else {
      Alert.alert(t('alerts.errorTitle'), result.error || t('errors.somethingWrong'));
    }
  }, [activateMode, t]);

  const handleDeactivateMode = useCallback(async () => {
    Alert.alert(
      t('discover.deactivateMode') || 'Désactiver le mode',
      t('discover.deactivateModeConfirm') || 'Êtes-vous sûr de vouloir désactiver le mode ?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            const result = await deactivateMode();
            if (!result.success) {
              Alert.alert(t('alerts.errorTitle'), result.error || t('errors.somethingWrong'));
            }
          },
        },
      ]
    );
  }, [deactivateMode, t]);

  const handleOpenModeModal = useCallback(() => {
    if (!hasRemainingActivations) {
      setShowPaywallModal(true);
    } else {
      setShowModeModal(true);
    }
  }, [hasRemainingActivations]);

  // Handle travel mode from FilterModal
  const handleActivateTravelMode = useCallback(async (city: TravelLocation, arrivalDate: Date) => {
    return await activateTravelMode({
      city: city.city,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
      arrivalDate,
    });
  }, [activateTravelMode]);

  const handleDeactivateTravelMode = useCallback(async () => {
    return await deactivateTravelMode();
  }, [deactivateTravelMode]);

  // Filters state for FilterModal
  const [filters, setFilters] = useState<ProfileFilters>({
    searchRadius: 50,
    minAge: 18,
    maxAge: 99,
    genders: [],
    intentions: [],
    hairColors: [],
    languages: [],
    interests: [],
  });

  // Update filters from myProfile when loaded
  useEffect(() => {
    if (myProfile) {
      setFilters({
        searchRadius: myProfile.searchRadius || 50,
        minAge: myProfile.minAgeFilter || 18,
        maxAge: myProfile.maxAgeFilter || 99,
        genders: myProfile.genderFilter || [],
        intentions: [],
        hairColors: [],
        languages: [],
        interests: [],
      });
    }
  }, [myProfile]);

  // Handle tap on photo to change photo
  const handlePhotoTap = useCallback((event: GestureResponderEvent) => {
    const { locationX } = event.nativeEvent;
    const tapZone = SCREEN_WIDTH / 3;

    if (locationX < tapZone) {
      // Tap left - previous photo
      if (currentPhotoIndex > 0) {
        setCurrentPhotoIndex(prev => prev - 1);
      }
    } else if (locationX > SCREEN_WIDTH - tapZone) {
      // Tap right - next photo
      if (profile && currentPhotoIndex < profile.photos.length - 1) {
        setCurrentPhotoIndex(prev => prev + 1);
      }
    }
  }, [currentPhotoIndex, profile]);

  // Card rotation style
  const cardRotate = rotateAnim.interpolate({
    inputRange: [-15, 0, 15],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  // If no more profiles - show header anyway
  if (!profile) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f0f23']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Header toujours visible */}
        <SafeAreaView style={styles.header} edges={['top']} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="options" size={26} color={colors.white} />
          </TouchableOpacity>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
              onPress={() => setActiveTab('favorites')}
            >
              <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
                {t('discover.favorites')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'nearby' && styles.tabActive]}
              onPress={() => setActiveTab('nearby')}
            >
              <Text style={[styles.tabText, activeTab === 'nearby' && styles.tabTextActive]}>
                {t('discover.nearby')}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/profile/subscription' as never)}
          >
            <Ionicons name="flash" size={26} color={colors.boost} />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Empty state centre */}
        <View style={styles.emptyContent}>
          <Ionicons name="heart-dislike" size={80} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>{t('discover.noMoreProfiles')}</Text>
          <Text style={styles.emptyText}>{t('discover.comeBackLater')}</Text>
        </View>

        {/* Filter modal - also available in empty state */}
        <FilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          filters={filters}
          onApply={(newFilters) => {
            setFilters(newFilters);
          }}
          travelMode={travelMode}
          canUseTravelMode={canUseTravelMode}
          onActivateTravelMode={handleActivateTravelMode}
          onDeactivateTravelMode={handleDeactivateTravelMode}
          onUpgradeToPremium={() => {
            setShowFilterModal(false);
            router.push('/profile/subscription' as never);
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f23']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Current card - key unique pour forcer le re-render propre */}
      <Animated.View
        key={`card-${profile.id}-${currentIndex}`}
        style={[
          styles.cardContainer,
          {
            transform: [
              { translateX: swipeAnim.x },
              { translateY: swipeAnim.y },
              { rotate: cardRotate },
            ],
          }
        ]}
        {...panResponder.panHandlers}
      >
        {/* Photo plein ecran */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handlePhotoTap}
          style={styles.photoTouchable}
        >
          {imageError ? (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="person" size={80} color="rgba(255,255,255,0.3)" />
            </View>
          ) : (
            <Image
              source={{ uri: profile.photos[currentPhotoIndex] }}
              style={styles.fullScreenPhoto}
              onError={() => setImageError(true)}
            />
          )}
        </TouchableOpacity>

        {/* Gradient overlay en bas */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
          style={styles.gradient}
          pointerEvents="none"
        />

        {/* LIKE stamp */}
        <Animated.View style={[styles.stampContainer, styles.likeStamp, { opacity: likeOpacity }]}>
          <Text style={[styles.stampText, styles.likeStampText]}>LIKE</Text>
        </Animated.View>

        {/* NOPE stamp */}
        <Animated.View style={[styles.stampContainer, styles.nopeStamp, { opacity: nopeOpacity }]}>
          <Text style={[styles.stampText, styles.nopeStampText]}>NOPE</Text>
        </Animated.View>

        {/* SUPER LIKE stamp */}
        <Animated.View style={[styles.stampContainer, styles.superLikeStamp, { opacity: superLikeOpacity }]}>
          <Text style={[styles.stampText, styles.superLikeStampText]}>SUPER LIKE</Text>
        </Animated.View>

        {/* Photo dots */}
        <View style={styles.dotsContainer} pointerEvents="none">
          {profile.photos.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentPhotoIndex && styles.dotActive,
                { width: (SCREEN_WIDTH - 32) / profile.photos.length - 4 }
              ]}
            />
          ))}
        </View>

        {/* Info profil */}
        <View style={styles.profileInfo} pointerEvents="none">
          {/* Badge en ligne - basé sur lastActiveAt */}
          {profile.lastActiveAt && (
            (() => {
              const lastActive = new Date(profile.lastActiveAt);
              const now = new Date();
              const diffMinutes = Math.floor((now.getTime() - lastActive.getTime()) / 60000);
              const isOnline = diffMinutes < 5;

              if (isOnline) {
                return (
                  <View style={styles.onlineBadge}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineText}>Actif.ve</Text>
                  </View>
                );
              } else if (diffMinutes < 60) {
                return (
                  <View style={styles.offlineBadge}>
                    <Text style={styles.offlineText}>Il y a {diffMinutes} min</Text>
                  </View>
                );
              } else if (diffMinutes < 1440) {
                return (
                  <View style={styles.offlineBadge}>
                    <Text style={styles.offlineText}>Il y a {Math.floor(diffMinutes / 60)}h</Text>
                  </View>
                );
              }
              return null;
            })()
          )}

          {/* Nom et age */}
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.displayName}</Text>
            <Text style={styles.age}>{profile.age}</Text>
          </View>

          {/* Distance */}
          {profile.distance !== null && (
            <View style={styles.distanceRow}>
              <Ionicons name="location" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.distance}>a {profile.distance} km</Text>
            </View>
          )}

          {/* Bio */}
          {profile.bio && (
            <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
          )}
        </View>
      </Animated.View>

      {/* Header transparent */}
      <SafeAreaView style={styles.header} edges={['top']} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="options" size={26} color={colors.white} />
        </TouchableOpacity>

        {/* Mode indicator or activation button */}
        {hasActiveMode && activeMode?.modeType ? (
          <View style={styles.modeIndicatorContainer}>
            <ActiveModeIndicator
              modeType={activeMode.modeType}
              remainingTime={remainingTimeFormatted}
              isExpiringSoon={isExpiringSoon}
              onPress={() => setShowModeModal(true)}
              onDeactivate={handleDeactivateMode}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.modeButton}
            onPress={handleOpenModeModal}
          >
            <Ionicons name="flash-outline" size={16} color={colors.primary} />
            <Text style={styles.modeButtonText}>{t('discover.activateMode') || 'Mode'}</Text>
          </TouchableOpacity>
        )}

        {/* Location indicator - shows travel mode if active */}
        <TouchableOpacity
          style={[
            styles.locationIndicator,
            hasActiveTravelMode && styles.locationIndicatorTravel,
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons
            name={hasActiveTravelMode ? "airplane" : (locationEnabled ? "location" : "location-outline")}
            size={14}
            color={hasActiveTravelMode ? colors.primary : (locationEnabled ? colors.primary : 'rgba(255,255,255,0.5)')}
          />
          <Text style={styles.locationText} numberOfLines={1}>
            {hasActiveTravelMode
              ? effectiveLocationName
              : (locationEnabled ? (city || getLocationDisplayName()) : t('discover.locationDisabled'))}
          </Text>
          {hasActiveTravelMode && (
            <View style={styles.travelBadge}>
              <Text style={styles.travelBadgeText}>Voyage</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
            onPress={() => {
              setActiveTab('favorites');
              // Reinitialiser a tous les profils
              setCurrentIndex(0);
              resetAnimations();
            }}
          >
            <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
              {t('discover.favorites')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'nearby' && styles.tabActive]}
            onPress={() => {
              setActiveTab('nearby');
              // Filtrer par proximite (< 5km)
              setCurrentIndex(0);
              resetAnimations();
            }}
          >
            <Text style={[styles.tabText, activeTab === 'nearby' && styles.tabTextActive]}>
              {t('discover.nearby')}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            Alert.alert(
              t('discover.boostTitle'),
              t('discover.boostDescription'),
              [
                { text: t('common.later'), style: 'cancel' },
                { text: t('discover.activateBoost'), onPress: () => router.push('/profile/subscription' as never) }
              ]
            );
          }}
        >
          <Ionicons name="flash" size={26} color={colors.boost} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Action buttons */}
      <View style={styles.actionsContainer} pointerEvents="box-none">
        <ActionButton
          icon="refresh"
          color={colors.rewind}
          glowColor={colors.rewindGlow}
          size={52}
          onPress={handleRewind}
        />
        <ActionButton
          icon="close"
          color={colors.dislike}
          glowColor={colors.dislikeGlow}
          size={64}
          onPress={handleNope}
        />
        <ActionButton
          icon="star"
          color={colors.superLike}
          glowColor={colors.superLikeGlow}
          size={52}
          onPress={handleSuperLike}
        />
        <ActionButton
          icon="heart"
          color={colors.like}
          glowColor={colors.likeGlow}
          size={64}
          onPress={handleLike}
        />
        {/* Bouton message : visible seulement si message direct autorisé */}
        {canDirectMessage && (
          <ActionButton
            icon="chatbubble"
            color={colors.primary}
            glowColor={colors.shadowPink}
            size={52}
            onPress={handleSendMessage}
          />
        )}
      </View>

      {/* Mode activation modal */}
      <ModeActivationModal
        visible={showModeModal}
        onClose={() => setShowModeModal(false)}
        onActivate={handleActivateMode}
        isLoading={isModeLoading}
        canUse72Hours={canUse72Hours}
        hasRemainingActivations={hasRemainingActivations}
        weeklyActivationsUsed={weeklyActivationsUsed}
        weeklyActivationsLimit={weeklyActivationsLimit}
        onUpgrade={() => {
          setShowModeModal(false);
          setShowPaywallModal(true);
        }}
      />

      {/* Paywall modal for availability mode */}
      <PaywallModal
        visible={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
        feature="availabilityMode"
        onUpgrade={() => {
          setShowPaywallModal(false);
          router.push('/profile/subscription' as never);
        }}
      />

      {/* Filter modal with Travel Mode */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters);
          // TODO: Save filters to profile and reload profiles
        }}
        travelMode={travelMode}
        canUseTravelMode={canUseTravelMode}
        onActivateTravelMode={handleActivateTravelMode}
        onDeactivateTravelMode={handleDeactivateTravelMode}
        onUpgradeToPremium={() => {
          setShowFilterModal(false);
          router.push('/profile/subscription' as never);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  cardContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f0f23',
  },
  photoTouchable: {
    flex: 1,
  },
  fullScreenPhoto: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#2a2a4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.55,
  },

  // Stamps
  stampContainer: {
    position: 'absolute',
    top: 150,
    padding: 10,
    borderWidth: 4,
    borderRadius: 10,
  },
  stampText: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 2,
  },
  likeStamp: {
    left: 20,
    borderColor: colors.like,
    transform: [{ rotate: '-20deg' }],
  },
  likeStampText: {
    color: colors.like,
  },
  nopeStamp: {
    right: 20,
    borderColor: colors.dislike,
    transform: [{ rotate: '20deg' }],
  },
  nopeStampText: {
    color: colors.dislike,
  },
  superLikeStamp: {
    alignSelf: 'center',
    left: SCREEN_WIDTH / 2 - 100,
    borderColor: colors.superLike,
  },
  superLikeStampText: {
    color: colors.superLike,
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modeIndicatorContainer: {
    position: 'absolute',
    top: 60,
    left: '50%',
    transform: [{ translateX: -100 }],
    width: 200,
    alignItems: 'center',
  },
  modeButton: {
    position: 'absolute',
    top: 60,
    left: '50%',
    transform: [{ translateX: -45 }],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  modeButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  locationIndicator: {
    position: 'absolute',
    top: 105,
    left: '50%',
    transform: [{ translateX: -75 }],
    width: 150,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  locationText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 100,
  },
  locationIndicatorTravel: {
    borderWidth: 1,
    borderColor: colors.primary + '60',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  travelBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  travelBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: '700',
  },

  // Photo dots
  dotsContainer: {
    position: 'absolute',
    top: 145,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: colors.white,
  },

  // Profile info - au dessus des boutons d'action
  profileInfo: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    right: 20,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.online,
  },
  onlineText: {
    color: colors.online,
    fontSize: 13,
    fontWeight: '600',
  },
  offlineBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  offlineText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
  },
  age: {
    fontSize: 28,
    fontWeight: '400',
    color: colors.white,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  distance: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  bio: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 10,
    lineHeight: 22,
  },

  // Actions - au dessus de la tab bar (85px)
  actionsContainer: {
    position: 'absolute',
    bottom: 110,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    zIndex: 10,
  },
  actionButton: {
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
  },
});
