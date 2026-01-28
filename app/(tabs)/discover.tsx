import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import { profilesService } from '../../src/services/supabase/profiles';
import { matchesService } from '../../src/services/supabase/matches';
import { canSendDirectMessage } from '../../src/utils/messagingPermissions';
import { GenderId } from '../../src/constants/genders';
import { Profile } from '../../src/types/profile';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 300;

// Types
interface MockProfile {
  id: string;
  name: string;
  age: number;
  gender: GenderId;
  verified: boolean;
  online: boolean;
  lastActive?: string;
  photos: string[];
  bio: string;
  distance: number;
  intention: 'dating' | 'social' | 'amical' | 'local';
}

// Mock profiles avec vraies photos Unsplash (femmes et hommes)
const MOCK_PROFILES: MockProfile[] = [
  {
    id: '1',
    name: 'Sophie',
    age: 24,
    gender: 'femme',
    verified: true,
    online: true,
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&h=1200&fit=crop',
    ],
    bio: 'Passionnee de voyages et de photographie. J\'adore decouvrir de nouveaux endroits et faire des rencontres authentiques.',
    distance: 3,
    intention: 'dating',
  },
  {
    id: '2',
    name: 'Thomas',
    age: 28,
    gender: 'homme',
    verified: true,
    online: false,
    lastActive: 'Il y a 2h',
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&h=1200&fit=crop',
    ],
    bio: 'Entrepreneur tech, amateur de cafe et de bonnes conversations. Toujours partant pour une randonnee.',
    distance: 5,
    intention: 'social',
  },
  {
    id: '3',
    name: 'Emma',
    age: 26,
    gender: 'femme',
    verified: true,
    online: true,
    photos: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&h=1200&fit=crop',
    ],
    bio: 'Wine lover. Foodie. Looking for someone to explore the city with. Let\'s grab a coffee!',
    distance: 7,
    intention: 'dating',
  },
  {
    id: '4',
    name: 'Lucas',
    age: 31,
    gender: 'homme',
    verified: false,
    online: true,
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1200&fit=crop',
    ],
    bio: 'Musicien le soir, developpeur le jour. Je cherche des amis pour partager des bons moments.',
    distance: 2,
    intention: 'amical',
  },
  {
    id: '5',
    name: 'Lea',
    age: 23,
    gender: 'femme',
    verified: true,
    online: false,
    lastActive: 'Il y a 30min',
    photos: [
      'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1464863979621-258859e62245?w=800&h=1200&fit=crop',
    ],
    bio: 'Etudiante en art, passionnee de musees et de petits cafes parisiens. Nouvelle dans le quartier!',
    distance: 1,
    intention: 'local',
  },
  {
    id: '6',
    name: 'Alexandre',
    age: 29,
    gender: 'homme',
    verified: true,
    online: true,
    photos: [
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1463453091185-61582044d556?w=800&h=1200&fit=crop',
    ],
    bio: 'Coach sportif, fan de cuisine healthy et de bien-etre. Cherche partenaire de running!',
    distance: 4,
    intention: 'social',
  },
  {
    id: '7',
    name: 'Chloe',
    age: 27,
    gender: 'femme',
    verified: true,
    online: true,
    photos: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1491349174775-aaafddd81942?w=800&h=1200&fit=crop',
    ],
    bio: 'Architecte d\'interieur, amoureuse des beaux espaces. Toujours en quete d\'inspiration!',
    distance: 8,
    intention: 'dating',
  },
  {
    id: '8',
    name: 'Maxime',
    age: 25,
    gender: 'homme',
    verified: false,
    online: false,
    lastActive: 'Il y a 1h',
    photos: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&h=1200&fit=crop',
    ],
    bio: 'Photographe freelance. J\'aime capturer les moments spontanes. Qui veut etre mon modele?',
    distance: 6,
    intention: 'amical',
  },
];

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
  const { isEnabled: locationEnabled, city, getLocationDisplayName } = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'favorites' | 'nearby'>('favorites');
  const [myProfile, setMyProfile] = useState<Profile | null>(null);

  // Charger mon profil pour connaître mon genre
  useEffect(() => {
    if (user) {
      profilesService.getProfile(user.id).then(({ profile }) => {
        setMyProfile(profile);
      });
    }
  }, [user]);

  const swipeAnim = useRef(new Animated.ValueXY()).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const nextCardScale = useRef(new Animated.Value(0.95)).current;
  const likeOpacity = useRef(new Animated.Value(0)).current;
  const nopeOpacity = useRef(new Animated.Value(0)).current;
  const superLikeOpacity = useRef(new Animated.Value(0)).current;

  // Filtrer les profils selon l'onglet actif
  const filteredProfiles = activeTab === 'nearby'
    ? MOCK_PROFILES.filter(p => p.distance <= 5) // Profils à moins de 5km
    : MOCK_PROFILES; // Tous les profils pour "Coups de Coeur"

  const profile = filteredProfiles[currentIndex];
  const nextProfile = filteredProfiles[currentIndex + 1];

  // Reset animations for new card
  const resetAnimations = useCallback(() => {
    swipeAnim.setValue({ x: 0, y: 0 });
    rotateAnim.setValue(0);
    opacityAnim.setValue(1);
    nextCardScale.setValue(0.95);
    likeOpacity.setValue(0);
    nopeOpacity.setValue(0);
    superLikeOpacity.setValue(0);
    setCurrentPhotoIndex(0);
  }, [swipeAnim, rotateAnim, opacityAnim, nextCardScale, likeOpacity, nopeOpacity, superLikeOpacity]);

  // Go to next profile
  const goToNextProfile = useCallback(() => {
    const filtered = activeTab === 'nearby'
      ? MOCK_PROFILES.filter(p => p.distance <= 5)
      : MOCK_PROFILES;
    const maxIndex = filtered.length - 1;

    if (currentIndex < maxIndex) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // On est au dernier profil, passer à l'écran "plus de profils"
      setCurrentIndex(prev => prev + 1);
    }
    resetAnimations();
  }, [currentIndex, resetAnimations, activeTab]);

  // Go to previous profile (rewind)
  const goToPreviousProfile = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      resetAnimations();
    }
  }, [currentIndex, resetAnimations]);

  // Swipe animation
  const swipeCard = useCallback((direction: 'left' | 'right' | 'up') => {
    const x = direction === 'left' ? -SCREEN_WIDTH * 1.5 : direction === 'right' ? SCREEN_WIDTH * 1.5 : 0;
    const y = direction === 'up' ? -SCREEN_HEIGHT : 0;

    Animated.parallel([
      Animated.timing(swipeAnim, {
        toValue: { x, y },
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(nextCardScale, {
        toValue: 1,
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      goToNextProfile();
    });
  }, [swipeAnim, opacityAnim, nextCardScale, goToNextProfile]);

  // Action handlers
  const handleLike = useCallback(() => {
    if (!profile) return; // Pas de profil à liker

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
  }, [likeOpacity, swipeCard, profile]);

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
          Alert.alert('Erreur', result.error);
          return;
        }

        if (result.conversationId) {
          router.push(`/chat/${result.conversationId}` as never);
        }
      } catch (error) {
        Alert.alert('Erreur', 'Une erreur est survenue');
      }
    } else {
      // Invitation obligatoire - afficher message
      Alert.alert(
        'Invitation requise',
        'Envoyez d\'abord une invitation en swipant vers la droite ♥',
        [{ text: 'OK' }]
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

  // If no more profiles
  if (!profile) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f0f23']}
          style={styles.emptyContainer}
        >
          <Ionicons name="heart-dislike" size={80} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Plus de profils</Text>
          <Text style={styles.emptyText}>
            Revenez plus tard pour decouvrir de nouvelles personnes
          </Text>
        </LinearGradient>
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

      {/* Next card (behind) */}
      {nextProfile && (
        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [{ scale: nextCardScale }],
              zIndex: 0,
            }
          ]}
        >
          <Image
            source={{ uri: nextProfile.photos[0] }}
            style={styles.fullScreenPhoto}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
            style={styles.gradient}
          />
        </Animated.View>
      )}

      {/* Current card */}
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [
              { translateX: swipeAnim.x },
              { translateY: swipeAnim.y },
              { rotate: cardRotate },
            ],
            opacity: opacityAnim,
            zIndex: 1,
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
          <Image
            source={{ uri: profile.photos[currentPhotoIndex] }}
            style={styles.fullScreenPhoto}
          />
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
          {/* Badge en ligne */}
          {profile.online ? (
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Actif.ve</Text>
            </View>
          ) : profile.lastActive && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineText}>{profile.lastActive}</Text>
            </View>
          )}

          {/* Nom et age */}
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.age}>{profile.age}</Text>
            {profile.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={24} color={colors.verified} />
              </View>
            )}
          </View>

          {/* Distance */}
          <View style={styles.distanceRow}>
            <Ionicons name="location" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.distance}>a {profile.distance} km</Text>
          </View>

          {/* Bio */}
          <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
        </View>
      </Animated.View>

      {/* Header transparent */}
      <SafeAreaView style={styles.header} edges={['top']} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/profile/settings' as never)}
        >
          <Ionicons name="options" size={26} color={colors.white} />
        </TouchableOpacity>

        {/* Location indicator */}
        <TouchableOpacity
          style={styles.locationIndicator}
          onPress={() => router.push('/profile/settings' as never)}
        >
          <Ionicons
            name={locationEnabled ? "location" : "location-outline"}
            size={14}
            color={locationEnabled ? colors.primary : 'rgba(255,255,255,0.5)'}
          />
          <Text style={styles.locationText} numberOfLines={1}>
            {locationEnabled ? (city || getLocationDisplayName()) : 'Position désactivée'}
          </Text>
        </TouchableOpacity>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
            onPress={() => {
              setActiveTab('favorites');
              // Réinitialiser à tous les profils
              setCurrentIndex(0);
              resetAnimations();
            }}
          >
            <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
              Coups de Coeur
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'nearby' && styles.tabActive]}
            onPress={() => {
              setActiveTab('nearby');
              // Filtrer par proximité (< 5km)
              setCurrentIndex(0);
              resetAnimations();
            }}
          >
            <Text style={[styles.tabText, activeTab === 'nearby' && styles.tabTextActive]}>
              Pres de moi
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            Alert.alert(
              'Boost',
              'Le Boost rend votre profil plus visible pendant 30 minutes. Vous apparaissez en priorité dans les recherches.',
              [
                { text: 'Plus tard', style: 'cancel' },
                { text: 'Activer le Boost', onPress: () => router.push('/profile/subscription' as never) }
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
  },
  photoTouchable: {
    flex: 1,
  },
  fullScreenPhoto: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    resizeMode: 'cover',
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
  locationIndicator: {
    position: 'absolute',
    top: 60,
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
    maxWidth: 120,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: '600',
  },

  // Photo dots
  dotsContainer: {
    position: 'absolute',
    top: 110,
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
