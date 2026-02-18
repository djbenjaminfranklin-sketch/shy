import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

// =============================================================================
// Types
// =============================================================================

interface EmptyChatProps {
  t: (key: string) => string;
}

// =============================================================================
// EmptyChat
// =============================================================================

/**
 * Empty state when no messages in conversation
 */
export function EmptyChat({ t }: EmptyChatProps) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{'💬'}</Text>
      <Text style={styles.emptyTitle}>{t('messages.startConversationHint')}</Text>
      <Text style={styles.emptyText}>{t('messages.sendFirstMessage')}</Text>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
