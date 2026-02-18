import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';
import { CARD_WIDTH, CARD_HEIGHT } from './ProfileGridCard';

export const SkeletonCard = () => {
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
  skeletonCard: {
    backgroundColor: colors.surface,
  },
  skeletonImage: {
    flex: 1,
    backgroundColor: colors.border,
  },
});
