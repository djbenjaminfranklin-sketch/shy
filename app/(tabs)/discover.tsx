import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
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
import { useBoost } from '../../src/contexts/BoostContext';
import { IceBreakerModal } from '../../src/components/icebreaker/IceBreakerModal';
import { DiscoverHeader } from '../../src/components/discover/DiscoverHeader';
import { ActionButtonsRow } from '../../src/components/discover/ActionButtonsRow';
import { ProfileCardOverlay } from '../../src/components/discover/ProfileCardOverlay';
import type { AvailabilityModeType, ModeDuration } from '../../src/types/availabilityMode';
import type { TravelLocation } from '../../src/types/travelMode';
import type { ProfileFilters } from '../../src/types/profile';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 400;

export default function DiscoverScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { latitude, longitude, city, isEnabled, refreshLocation } = useLocation();
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
  const [showIceBreakerModal, setShowIceBreakerModal] = useState(false);
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
        // Error loading subscription features
      }
    };
    loadSubscriptionFeatures();
  }, [user]);

  // Rafraîchir la position GPS quand l'écran Discover gagne le focus
  // Corrige le bug où la position reste bloquée à l'ancienne localisation
  useFocusEffect(
    useCallback(() => {
      console.log('[Discover] useFocusEffect triggered, isEnabled:', isEnabled);
      if (isEnabled) {
        console.log('[Discover] Calling refreshLocation...');
        refreshLocation();
      }
    }, [isEnabled, refreshLocation])
  );

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
    await invitationsService.sendInvitation(user.id, profile.id);

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
  const handleActivateTravelMode = useCallback(async (travelCity: TravelLocation, arrivalDate: Date) => {
    return await activateTravelMode({
      city: travelCity.city,
      country: travelCity.country,
      latitude: travelCity.latitude,
      longitude: travelCity.longitude,
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

  // Shared modals rendered in both states
  const renderModals = () => (
    <>
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

      {/* Ice Breaker modal */}
      <IceBreakerModal
        visible={showIceBreakerModal}
        onClose={() => setShowIceBreakerModal(false)}
      />
    </>
  );

  // If no more profiles - show header anyway
  if (!profile) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f0f23']}
          style={StyleSheet.absoluteFillObject}
        />

        <DiscoverHeader
          onFilterPress={() => setShowFilterModal(true)}
          onIceBreakerPress={() => setShowIceBreakerModal(true)}
          boostsAvailable={boostsAvailable}
          isBoostActive={isBoostActive}
          activeBoostExpiresAt={activeBoostExpiresAt}
          onBoostExpire={refreshBoost}
        />

        {/* Empty state centre */}
        <View style={styles.emptyContent}>
          <Ionicons name="heart-dislike" size={80} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>{t('discover.noMoreProfiles')}</Text>
          <Text style={styles.emptyText}>{t('discover.comeBackLater')}</Text>
        </View>

        {renderModals()}
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
        <ProfileCardOverlay
          profile={profile}
          currentPhotoIndex={currentPhotoIndex}
          imageError={imageError}
          city={city}
          likeOpacity={likeOpacity}
          nopeOpacity={nopeOpacity}
          superLikeOpacity={superLikeOpacity}
          onPhotoTap={handlePhotoTap}
          onImageError={() => setImageError(true)}
        />
      </Animated.View>

      {/* Header transparent */}
      <DiscoverHeader
        onFilterPress={() => setShowFilterModal(true)}
        onIceBreakerPress={() => setShowIceBreakerModal(true)}
        boostsAvailable={boostsAvailable}
        isBoostActive={isBoostActive}
        activeBoostExpiresAt={activeBoostExpiresAt}
        onBoostExpire={refreshBoost}
      />

      {/* Action buttons */}
      <ActionButtonsRow
        onRewind={handleRewind}
        onNope={handleNope}
        onSuperLike={handleSuperLike}
        onLike={handleLike}
        onSendMessage={handleSendMessage}
        canDirectMessage={canDirectMessage}
      />

      {renderModals()}
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

  // Empty state
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
