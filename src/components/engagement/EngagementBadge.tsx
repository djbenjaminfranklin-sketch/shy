import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getEngagementDisplayFromScore } from '../../constants/engagementScore';
import { useLanguage } from '../../contexts/LanguageContext';
import { useEngagementScore } from '../../hooks/useEngagementScore';

interface EngagementBadgeProps {
  score?: number;
  userId?: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export function EngagementBadge({
  score,
  userId,
  size = 'medium',
  showLabel = false,
}: EngagementBadgeProps) {
  const { language } = useLanguage();
  const lang = (language || 'fr') as 'fr' | 'en';

  // Si userId est fourni, charger le score
  const { totalScore, isLoading } = useEngagementScore(userId);

  // Utiliser le score fourni ou celui chargé
  const finalScore = score ?? totalScore;

  // Ne rien afficher pendant le chargement ou si pas de score
  if (userId && isLoading) {
    return null;
  }

  const display = getEngagementDisplayFromScore(finalScore, lang);

  // Ne pas afficher si le badge n'est pas visible pour ce niveau
  if (!display.badgeVisible) {
    return null;
  }

  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      icon: styles.iconSmall,
      label: styles.labelSmall,
    },
    medium: {
      container: styles.containerMedium,
      icon: styles.iconMedium,
      label: styles.labelMedium,
    },
    large: {
      container: styles.containerLarge,
      icon: styles.iconLarge,
      label: styles.labelLarge,
    },
  };

  return (
    <View
      style={[
        styles.container,
        sizeStyles[size].container,
        { backgroundColor: display.color + '20' },
      ]}
    >
      <Text style={sizeStyles[size].icon}>{display.icon}</Text>
      {showLabel && (
        <Text style={[sizeStyles[size].label, { color: display.color }]}>
          {display.label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
  },
  containerSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  containerMedium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  containerLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  iconSmall: {
    fontSize: 12,
  },
  iconMedium: {
    fontSize: 14,
  },
  iconLarge: {
    fontSize: 18,
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '600',
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelLarge: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EngagementBadge;
