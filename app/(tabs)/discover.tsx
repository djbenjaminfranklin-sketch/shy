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
  StatusBar,
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
import { subscriptionsService } from '../../src/services/supabase/subscriptions';
import { adminService } from '../../src/services/supabase/admin';
import { SUBSCRIPTION_PLANS_BY_ID, PlanType } from '../../src/constants/subscriptions';
import { canSendDirectMessage } from '../../src/utils/messagingPermissions';
import { Profile, ProfileWithDistance } from '../../src/types/profile';
import { useAvailabilityMode } from '../../src/hooks/useAvailabilityMode';
import { useTravelMode } from '../../src/hooks/useTravelMode';
import { ModeActivationModal } from '../../src/components/availability';
import { PaywallModal } from '../../src/components/subscription/PaywallModal';
import { FilterModal } from '../../src/components/discover/FilterModal';
import { BoostModal } from '../../src/components/boost/BoostModal';
import { BoostIndicator } from '../../src/components/boost/BoostIndicator';
import { useBoost } from '../../src/contexts/BoostContext';
import type { AvailabilityModeType, ModeDuration } from '../../src/types/availabilityMode';
import type { TravelLocation } from '../../src/types/travelMode';
import type { ProfileFilters } from '../../src/types/profile';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 400;

// Action Button Component
interface ActionButtonProps {
  icon?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  image?: any;
  color?: string;
  glowColor: string;
  size?: number;
  onPress: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  emoji,
  image,
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
    {emoji ? (
      <Text style={{ fontSize: size * 0.45 }}>{emoji}</Text>
    ) : image ? (
      <Image source={image} style={{ width: size * 0.5, height: size * 0.5, resizeMode: 'contain' }} />
    ) : icon ? (
      <Ionicons name={icon} size={size * 0.45} color={color} />
    ) : null}
  </TouchableOpacity>
);

export default function DiscoverScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { latitude, longitude, city } = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<ProfileWithDistance[]>([]);
  const [imageError, setImageError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Availability mode state
  const {
    activeMode,
    hasActiveMode,
    activateMode,
    canUse72Hours,
    hasRemainingActivations,
    weeklyActivationsUsed,
    weeklyActivationsLimit,
    isLoading: isModeLoading,
  } = useAvailabilityMode();
  const [showModeModal, setShowModeModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [canUseAllFilters, setCanUseAllFilters] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<'likes' | 'superLikes' | 'rewind' | 'mode'>('mode');

  // Boost feature
  const {
    boostsAvailable,
    isBoostActive,
    activeBoostExpiresAt,
    refresh: refreshBoost,
  } = useBoost();

  // Daily limits tracking
  const [likesUsed, setLikesUsed] = useState(0);
  const [likesLimit, setLikesLimit] = useState(20);
  const [superLikesUsed, setSuperLikesUsed] = useState(0);
  const [superLikesLimit, setSuperLikesLimit] = useState(1);
  const [rewindsUsed, setRewindsUsed] = useState(0);
  const [rewindsLimit, setRewindsLimit] = useState(1);

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

  // Charger mon profil pour connaitre mon genre et vérifier si admin
  useEffect(() => {
    if (user) {
      profilesService.getProfile(user.id).then(({ profile }) => {
        setMyProfile(profile);
      });
      // Vérifier si l'utilisateur est admin (pour voir tous les profils sans limite de distance)
      adminService.isAdmin(user.id).then((admin) => {
        setIsAdmin(admin);
      });
    }
  }, [user]);

  // Charger les features premium et limites
  useEffect(() => {
    if (!user) return;
    const loadSubscriptionFeatures = async () => {
      try {
        const { subscription } = await subscriptionsService.getUserSubscription(user.id);
        const planId = (subscription?.planId || 'free') as PlanType;
        const plan = SUBSCRIPTION_PLANS_BY_ID[planId];

        // Features
        setCanUseAllFilters(plan?.features.allFilters ?? false);

        // Limites quotidiennes
        setLikesLimit(plan?.features.dailyLikes ?? 20);
        setSuperLikesLimit(plan?.features.superLikesPerDay ?? 1);
        setRewindsLimit(plan?.features.rewindPerDay ?? 1);

        // Charger l'utilisation quotidienne
        const { limits } = await subscriptionsService.getUserLimits(user.id);
        setLikesUsed(limits?.likesUsed || 0);
        setSuperLikesUsed(limits?.superLikesUsed || 0);
        setRewindsUsed(limits?.rewindsUsed || 0);
      } catch (error) {
        console.error('Error loading subscription features:', error);
      }
    };
    loadSubscriptionFeatures();
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
          minAge: isAdmin ? 18 : (myProfile?.minAgeFilter || 18),
          maxAge: isAdmin ? 99 : (myProfile?.maxAgeFilter || 99),
          genders: isAdmin ? [] : (myProfile?.genderFilter || []), // Admin: tous les genres
          intentions: [],
          hairColors: [],
          languages: [],
          interests: [],
          searchRadius: isAdmin ? 50000 : (myProfile?.searchRadius || 50), // Admin: rayon mondial
        },
        effectiveLatitude ?? undefined,
        effectiveLongitude ?? undefined,
        activeModeType,
        isAdmin // Permet de voir tous les profils sans limite de distance
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
  }, [user, myProfile, effectiveLatitude, effectiveLongitude, hasActiveMode, activeMode?.modeType, hasActiveTravelMode, isAdmin]);

  const swipeAnim = useRef(new Animated.ValueXY()).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const nextCardScale = useRef(new Animated.Value(0.95)).current;
  const likeOpacity = useRef(new Animated.Value(0)).current;
  const nopeOpacity = useRef(new Animated.Value(0)).current;
  const superLikeOpacity = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);

  // Refs pour les callbacks (utilisées par le panResponder)
  const handleLikeActionRef = useRef<() => void>(() => {});
  const handleSuperLikeActionRef = useRef<() => void>(() => {});
  const goToNextProfileRef = useRef<() => void>(() => {});

  const profile = profiles[currentIndex];

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
    // Juste changer l'index - les animations sont reinitialisees dans useEffect
    setCurrentIndex(prev => prev + 1);
  }, []);

  // Go to previous profile (rewind)
  const goToPreviousProfile = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // Swipe animation - simplifié sans opacité
  const swipeCard = useCallback((direction: 'left' | 'right' | 'up') => {
    isAnimatingRef.current = true;
    const x = direction === 'left' ? -SCREEN_WIDTH * 1.5 : direction === 'right' ? SCREEN_WIDTH * 1.5 : 0;
    const y = direction === 'up' ? -SCREEN_HEIGHT : 0;

    Animated.timing(swipeAnim, {
      toValue: { x, y },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: true,
    }).start(() => {
      isAnimatingRef.current = false;
      goToNextProfile();
    });
  }, [swipeAnim, goToNextProfile]);

  // Action handlers
  const handleLike = useCallback(async () => {
    if (!profile || !user) return; // Pas de profil a liker

    // Vérifier la limite de likes (sauf si illimité = -1)
    if (likesLimit !== -1 && likesUsed >= likesLimit) {
      setPaywallFeature('likes');
      setShowPaywallModal(true);
      return;
    }

    // Creer une invitation
    const { error } = await invitationsService.sendInvitation(user.id, profile.id);
    if (error) {
      console.log('Invitation error:', error);
    }

    // Incrémenter le compteur local
    setLikesUsed((prev) => prev + 1);

    // Incrémenter sur le serveur
    subscriptionsService.incrementLikes(user.id);

    // Animation: stamp visible pendant tout le swipe
    likeOpacity.setValue(1);
    swipeCard('right');
  }, [likeOpacity, swipeCard, profile, user, likesUsed, likesLimit]);

  const handleNope = useCallback(() => {
    if (!profile) return; // Pas de profil à refuser

    // Animation: stamp visible pendant tout le swipe
    nopeOpacity.setValue(1);
    swipeCard('left');
  }, [nopeOpacity, swipeCard, profile]);

  const handleSuperLike = useCallback(async () => {
    if (!profile || !user) return; // Pas de profil

    // Vérifier la limite de super likes (sauf si illimité = -1)
    if (superLikesLimit !== -1 && superLikesUsed >= superLikesLimit) {
      setPaywallFeature('superLikes');
      setShowPaywallModal(true);
      return;
    }

    // Incrémenter le compteur local
    setSuperLikesUsed((prev) => prev + 1);

    // Incrémenter sur le serveur
    subscriptionsService.incrementSuperLikes(user.id);

    // Envoyer l'invitation (super like trackée via incrementSuperLikes)
    await invitationsService.sendInvitation(user.id, profile.id);

    // Animation: stamp visible pendant tout le swipe
    superLikeOpacity.setValue(1);
    swipeCard('up');
  }, [superLikeOpacity, swipeCard, profile, user, superLikesUsed, superLikesLimit]);

  // Actions serveur sans animation (appelées depuis le panResponder)
  const handleLikeAction = useCallback(async () => {
    if (!profile || !user) return;

    // Vérifier la limite (mais ne pas bloquer l'animation)
    if (likesLimit !== -1 && likesUsed >= likesLimit) {
      return;
    }

    // Envoyer l'invitation
    invitationsService.sendInvitation(user.id, profile.id);

    // Incrémenter les compteurs
    setLikesUsed((prev) => prev + 1);
    subscriptionsService.incrementLikes(user.id);
  }, [profile, user, likesUsed, likesLimit]);

  const handleSuperLikeAction = useCallback(async () => {
    if (!profile || !user) return;

    // Vérifier la limite
    if (superLikesLimit !== -1 && superLikesUsed >= superLikesLimit) {
      return;
    }

    // Envoyer l'invitation
    invitationsService.sendInvitation(user.id, profile.id);

    // Incrémenter les compteurs
    setSuperLikesUsed((prev) => prev + 1);
    subscriptionsService.incrementSuperLikes(user.id);
  }, [profile, user, superLikesUsed, superLikesLimit]);

  // Garder les refs à jour pour le panResponder
  useEffect(() => {
    handleLikeActionRef.current = handleLikeAction;
    handleSuperLikeActionRef.current = handleSuperLikeAction;
    goToNextProfileRef.current = goToNextProfile;
  }, [handleLikeAction, handleSuperLikeAction, goToNextProfile]);

  const handleRewind = useCallback(() => {
    // Vérifier la limite de rewinds (sauf si illimité = -1)
    if (rewindsLimit !== -1 && rewindsUsed >= rewindsLimit) {
      setPaywallFeature('rewind');
      setShowPaywallModal(true);
      return;
    }

    // Incrémenter le compteur local
    setRewindsUsed((prev) => prev + 1);

    // Incrémenter sur le serveur
    if (user) {
      subscriptionsService.incrementRewinds(user.id);
    }

    goToPreviousProfile();
  }, [goToPreviousProfile, rewindsUsed, rewindsLimit, user]);

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
        // Ne pas capturer les gestes pendant l'animation
        if (isAnimatingRef.current) return false;
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        if (isAnimatingRef.current) return;
        swipeAnim.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        if (isAnimatingRef.current) return;
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

        if (isAnimatingRef.current) return;

        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swipe vers la droite = Like
          isAnimatingRef.current = true;
          Animated.parallel([
            Animated.timing(swipeAnim, {
              toValue: { x: SCREEN_WIDTH * 1.5, y: gestureState.dy },
              duration: SWIPE_OUT_DURATION,
              useNativeDriver: true,
            }),
            Animated.timing(likeOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start(() => {
            isAnimatingRef.current = false;
            handleLikeActionRef.current();
            goToNextProfileRef.current();
          });
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swipe vers la gauche = Nope
          isAnimatingRef.current = true;
          Animated.parallel([
            Animated.timing(swipeAnim, {
              toValue: { x: -SCREEN_WIDTH * 1.5, y: gestureState.dy },
              duration: SWIPE_OUT_DURATION,
              useNativeDriver: true,
            }),
            Animated.timing(nopeOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start(() => {
            isAnimatingRef.current = false;
            goToNextProfileRef.current();
          });
        } else if (gestureState.dy < -SWIPE_THRESHOLD) {
          // Swipe vers le haut = Super Like
          isAnimatingRef.current = true;
          Animated.parallel([
            Animated.timing(swipeAnim, {
              toValue: { x: gestureState.dx, y: -SCREEN_HEIGHT },
              duration: SWIPE_OUT_DURATION,
              useNativeDriver: true,
            }),
            Animated.timing(superLikeOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start(() => {
            isAnimatingRef.current = false;
            handleSuperLikeActionRef.current();
            goToNextProfileRef.current();
          });
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
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
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

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowBoostModal(true)}
          >
            <View>
              <Ionicons name="flash" size={26} color={colors.boost} />
              {boostsAvailable > 0 && !isBoostActive && (
                <View style={styles.boostBadge}>
                  <Text style={styles.boostBadgeText}>{boostsAvailable}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </SafeAreaView>

        {/* Boost indicator when active */}
        {isBoostActive && (
          <View style={styles.boostIndicatorContainer}>
            <BoostIndicator expiresAt={activeBoostExpiresAt} onExpire={refreshBoost} />
          </View>
        )}

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
          canUseAllFilters={canUseAllFilters}
          onActivateTravelMode={handleActivateTravelMode}
          onDeactivateTravelMode={handleDeactivateTravelMode}
          onUpgradeToPremium={() => {
            setShowFilterModal(false);
            router.push('/profile/subscription' as never);
          }}
        />

        {/* Boost modal - also available in empty state */}
        <BoostModal
          visible={showBoostModal}
          onClose={() => setShowBoostModal(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
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
          <Text style={[styles.stampText, styles.likeStampText]}>💞</Text>
        </Animated.View>

        {/* NOPE stamp */}
        <Animated.View style={[styles.stampContainer, styles.nopeStamp, { opacity: nopeOpacity }]}>
          <Image
            source={require('../../assets/nope-x.png')}
            style={styles.nopeImage}
          />
        </Animated.View>

        {/* SUPER LIKE stamp */}
        <Animated.View style={[styles.stampContainer, styles.superLikeStamp, { opacity: superLikeOpacity }]}>
          <Text style={[styles.stampText, styles.superLikeStampText]}>🫶</Text>
        </Animated.View>

        {/* Photo dots - seulement si plus d'une photo */}
        {profile.photos.length > 1 && (
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
        )}

        {/* City indicator - centré en haut */}
        {city && (
          <View style={styles.cityIndicator} pointerEvents="none">
            <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.cityText}>{city}</Text>
          </View>
        )}

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

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowBoostModal(true)}
        >
          <View>
            <Ionicons name="flash" size={26} color={colors.boost} />
            {boostsAvailable > 0 && !isBoostActive && (
              <View style={styles.boostBadge}>
                <Text style={styles.boostBadgeText}>{boostsAvailable}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Boost indicator when active */}
      {isBoostActive && (
        <View style={styles.boostIndicatorContainer}>
          <BoostIndicator expiresAt={activeBoostExpiresAt} onExpire={refreshBoost} />
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionsContainer} pointerEvents="box-none">
        <ActionButton
          icon="refresh"
          color="#FFFFFF"
          glowColor={colors.rewindGlow}
          size={64}
          onPress={handleRewind}
        />
        <ActionButton
          image={require('../../assets/nope-x.png')}
          glowColor={colors.dislikeGlow}
          size={64}
          onPress={handleNope}
        />
        <ActionButton
          emoji="🫶"
          glowColor={colors.superLikeGlow}
          size={64}
          onPress={handleSuperLike}
        />
        <ActionButton
          emoji="💞"
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
          setPaywallFeature('mode');
          setShowPaywallModal(true);
        }}
      />

      {/* Paywall modal - dynamique selon la feature */}
      <PaywallModal
        visible={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
        feature={paywallFeature}
        currentUsage={
          paywallFeature === 'likes' ? likesUsed :
          paywallFeature === 'superLikes' ? superLikesUsed :
          paywallFeature === 'rewind' ? rewindsUsed : undefined
        }
        limit={
          paywallFeature === 'likes' ? likesLimit :
          paywallFeature === 'superLikes' ? superLikesLimit :
          paywallFeature === 'rewind' ? rewindsLimit : undefined
        }
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
        canUseAllFilters={canUseAllFilters}
        onActivateTravelMode={handleActivateTravelMode}
        onDeactivateTravelMode={handleDeactivateTravelMode}
        onUpgradeToPremium={() => {
          setShowFilterModal(false);
          router.push('/profile/subscription' as never);
        }}
      />

      {/* Boost modal */}
      <BoostModal
        visible={showBoostModal}
        onClose={() => setShowBoostModal(false)}
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

  // Stamps - Style Tinder: centré, gros, sans bordure
  stampContainer: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampText: {
    fontSize: 150,
    textAlign: 'center',
  },
  likeStamp: {
    top: 120,
    left: 30,
    right: 'auto',
    alignItems: 'flex-start',
    transform: [{ rotate: '-15deg' }],
  },
  likeStampText: {
    // Emoji seul
  },
  nopeStamp: {
    top: 120,
    right: 30,
    left: 'auto',
    alignItems: 'flex-end',
    transform: [{ rotate: '15deg' }],
  },
  nopeImage: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },
  superLikeStamp: {
    // Centré
  },
  superLikeStampText: {
    // Emoji seul
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
  boostBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.boost,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  boostBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  boostIndicatorContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
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

  // City indicator
  cityIndicator: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cityText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 20,
    fontWeight: '700',
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

  // Actions - au dessus de la tab bar
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
