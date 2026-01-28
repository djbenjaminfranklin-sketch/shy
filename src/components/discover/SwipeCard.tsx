import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { ProfileWithDistance } from '../../types/profile';
import { ProfileCard } from '../profile/ProfileCard';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

interface SwipeCardProps {
  profile: ProfileWithDistance;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onPress?: () => void;
  isFirst?: boolean;
}

export function SwipeCard({
  profile,
  onSwipeLeft,
  onSwipeRight,
  onPress,
  isFirst = false,
}: SwipeCardProps) {
  if (!isFirst) return null;

  return (
    <View style={styles.container}>
      <ProfileCard profile={profile} onPress={onPress} />

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable style={[styles.actionButton, styles.passButton]} onPress={onSwipeLeft}>
          <Text style={styles.passIcon}>✕</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.likeButton]} onPress={onSwipeRight}>
          <Text style={styles.likeIcon}>♥</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  passButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.error,
  },
  likeButton: {
    backgroundColor: colors.primary,
  },
  passIcon: {
    fontSize: 28,
    color: colors.error,
    fontWeight: '700',
  },
  likeIcon: {
    fontSize: 28,
    color: colors.white,
  },
});

export default SwipeCard;
