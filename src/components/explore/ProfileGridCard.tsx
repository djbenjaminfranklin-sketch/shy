import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { IntentionBadge } from '../profile/IntentionBadge';
import type { ProfileWithDistance } from '../../types/profile';

const { width } = Dimensions.get('window');
export const CARD_WIDTH = (width - spacing.lg * 2 - spacing.sm * 2) / 3;
export const CARD_HEIGHT = CARD_WIDTH * 1.5;

// Check if user was active in the last 5 minutes
export const isUserOnline = (lastActiveAt: string | null | undefined): boolean => {
  if (!lastActiveAt) return false;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return new Date(lastActiveAt) > fiveMinutesAgo;
};

interface ProfileGridCardProps {
  profile: ProfileWithDistance;
  onPress: () => void;
}

export const ProfileGridCard = ({ profile, onPress }: ProfileGridCardProps) => {
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

        {/* Availability badge */}
        {profile.availability && (
          <View style={styles.availabilityBadge}>
            <Text style={styles.availabilityText}>
              {profile.availability === 'aujourdhui' ? '\ud83d\udcc5' :
               profile.availability === 'ce-soir' ? '\ud83c\udf19' :
               profile.availability === 'weekend' ? '\ud83c\udf89' : '\u2615'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
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
  availabilityBadge: {
    position: 'absolute',
    bottom: 50,
    right: spacing.xs,
    backgroundColor: '#4CAF50',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  availabilityText: {
    fontSize: 13,
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
});
