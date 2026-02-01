import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useComfortLevel } from '../../hooks/useComfortLevel';
import { colors } from '../../theme/colors';

interface ComfortLevelIndicatorProps {
  conversationId: string;
  onPress?: () => void;
  compact?: boolean;
}

export function ComfortLevelIndicator({
  conversationId,
  onPress,
  compact = false,
}: ComfortLevelIndicatorProps) {
  const { t } = useLanguage();
  const { unlockedLevelDisplay, isMutual, otherUserHigher, isLoading } = useComfortLevel(conversationId);

  if (isLoading) {
    return null;
  }

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.container,
        compact && styles.containerCompact,
        { backgroundColor: unlockedLevelDisplay.color + '20' },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{unlockedLevelDisplay.icon}</Text>
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: unlockedLevelDisplay.color }]}>
          {unlockedLevelDisplay.label}
        </Text>
        {!compact && (
          <>
            {isMutual ? (
              <Text style={styles.status}>{t('comfortLevel.mutual')}</Text>
            ) : otherUserHigher ? (
              <Text style={[styles.status, styles.statusHighlight]}>
                {t('comfortLevel.otherReady')}
              </Text>
            ) : null}
          </>
        )}
      </View>
      {onPress && <Text style={styles.arrow}>›</Text>}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  containerCompact: {
    padding: 8,
    marginHorizontal: 0,
    marginVertical: 4,
  },
  icon: {
    fontSize: 20,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  status: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusHighlight: {
    color: colors.primary,
  },
  arrow: {
    fontSize: 20,
    color: colors.textSecondary,
  },
});

export default ComfortLevelIndicator;
