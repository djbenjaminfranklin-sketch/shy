import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface BadgeProps {
  text: string;
  color?: string;
  textColor?: string;
  size?: 'small' | 'medium';
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Badge({
  text,
  color = colors.primary,
  textColor = colors.textLight,
  size = 'medium',
  icon,
  style,
}: BadgeProps) {
  return (
    <View style={[styles.container, styles[size], { backgroundColor: color }, style]}>
      {icon}
      <Text style={[styles.text, styles[`${size}Text`], { color: textColor }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  medium: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  text: {
    fontWeight: '600',
  },
  smallText: {
    ...typography.caption,
  },
  mediumText: {
    ...typography.labelSmall,
  },
});

export default Badge;
