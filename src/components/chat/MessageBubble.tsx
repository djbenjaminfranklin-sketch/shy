import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../../types/message';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.container, isMine && styles.containerMine]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.text, isMine && styles.textMine]}>{message.content}</Text>
      </View>
      <View style={[styles.meta, isMine && styles.metaMine]}>
        <Text style={styles.time}>{time}</Text>
        {isMine && (
          <Text style={styles.status}>{message.isRead ? '✓✓' : '✓'}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    marginHorizontal: spacing.md,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  containerMine: {
    alignSelf: 'flex-end',
  },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: borderRadius.xs,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.xs,
  },
  text: {
    ...typography.body,
    color: colors.text,
  },
  textMine: {
    color: colors.textLight,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  metaMine: {
    justifyContent: 'flex-end',
  },
  time: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  status: {
    ...typography.caption,
    color: colors.primary,
  },
});

export default MessageBubble;
