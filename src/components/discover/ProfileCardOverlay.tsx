import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  GestureResponderEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { ProfileInfoOverlay } from './ProfileInfoOverlay';
import type { ProfileWithDistance } from '../../types/profile';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ProfileCardOverlayProps {
  profile: ProfileWithDistance;
  currentPhotoIndex: number;
  imageError: boolean;
  city: string | null;
  likeOpacity: Animated.Value;
  nopeOpacity: Animated.Value;
  superLikeOpacity: Animated.Value;
  onPhotoTap: (event: GestureResponderEvent) => void;
  onImageError: () => void;
}

export const ProfileCardOverlay: React.FC<ProfileCardOverlayProps> = ({
  profile,
  currentPhotoIndex,
  imageError,
  city,
  likeOpacity,
  nopeOpacity,
  superLikeOpacity,
  onPhotoTap,
  onImageError,
}) => (
  <>
    {/* Photo plein ecran */}
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPhotoTap}
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
          onError={onImageError}
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
      <Text style={[styles.stampText, styles.likeStampText]}>{'\uD83D\uDC9E'}</Text>
    </Animated.View>

    {/* NOPE stamp */}
    <Animated.View style={[styles.stampContainer, styles.nopeStamp, { opacity: nopeOpacity }]}>
      <Image
        source={require('../../../assets/nope-x.png')}
        style={styles.nopeImage}
      />
    </Animated.View>

    {/* SUPER LIKE stamp */}
    <Animated.View style={[styles.stampContainer, styles.superLikeStamp, { opacity: superLikeOpacity }]}>
      <Text style={[styles.stampText, styles.superLikeStampText]}>{'\uD83E\uDEF6'}</Text>
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
    <ProfileInfoOverlay profile={profile} />
  </>
);

const styles = StyleSheet.create({
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
});
