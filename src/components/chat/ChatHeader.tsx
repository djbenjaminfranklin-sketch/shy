import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Avatar } from '../ui/Avatar';

// =============================================================================
// Types
// =============================================================================

interface ChatHeaderLeftProps {
  onPress: () => void;
}

interface ChatHeaderTitleProps {
  photo: string | null;
  name: string;
}

interface ChatHeaderRightProps {
  onPress: () => void;
}

// =============================================================================
// ChatHeader Components
// =============================================================================

/**
 * Back button for chat header
 */
export function ChatHeaderLeft({ onPress }: ChatHeaderLeftProps) {
  return (
    <Pressable onPress={onPress} style={styles.headerButton}>
      <Text style={styles.backIcon}>{'\u2039'}</Text>
    </Pressable>
  );
}

/**
 * Title section with avatar and name for chat header
 */
export function ChatHeaderTitle({ photo, name }: ChatHeaderTitleProps) {
  return (
    <View style={styles.headerTitle}>
      <Avatar uri={photo} name={name} size={32} />
      <Text style={styles.headerName}>{name || 'Chat'}</Text>
    </View>
  );
}

/**
 * More button for chat header
 */
export function ChatHeaderRight({ onPress }: ChatHeaderRightProps) {
  return (
    <Pressable onPress={onPress} style={styles.headerButton}>
      <Text style={styles.headerIcon}>{'\u22EF'}</Text>
    </Pressable>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerName: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  headerButton: {
    padding: spacing.sm,
  },
  headerIcon: {
    fontSize: 24,
    color: colors.text,
  },
  backIcon: {
    fontSize: 32,
    color: colors.text,
    fontWeight: '300',
  },
});
