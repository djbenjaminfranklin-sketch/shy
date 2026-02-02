import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../../types/message';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { translateText, detectLanguage } from '../../services/translation';
import { useLanguage } from '../../contexts/LanguageContext';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  const { language, t } = useLanguage();
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const hasAttemptedAutoTranslate = useRef(false);

  const time = new Date(message.createdAt).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Auto-translate received messages
  useEffect(() => {
    const autoTranslate = async () => {
      // Only auto-translate received messages, not our own
      if (isMine || hasAttemptedAutoTranslate.current) return;

      // Skip very short messages
      if (!message.content || message.content.trim().length < 3) return;

      hasAttemptedAutoTranslate.current = true;

      try {
        // First detect the language of the message
        const detectedLang = await detectLanguage(message.content);

        // If detected language is same as app language, no need to translate
        if (detectedLang === language) return;

        // If we couldn't detect or it's different, try to translate
        setIsTranslating(true);
        const result = await translateText(message.content, language);
        setIsTranslating(false);

        // Only show translation if it's different from the original
        if (!result.error && result.translatedText && result.translatedText !== message.content) {
          setTranslatedText(result.translatedText);
        }
      } catch (error) {
        setIsTranslating(false);
        console.error('Auto-translation error:', error);
      }
    };

    autoTranslate();
  }, [message.content, language, isMine]);

  const handleTranslate = async () => {
    if (translatedText) {
      // Toggle between original and translation
      setShowOriginal(!showOriginal);
      return;
    }

    setIsTranslating(true);
    const result = await translateText(message.content, language);
    setIsTranslating(false);

    if (!result.error && result.translatedText !== message.content) {
      setTranslatedText(result.translatedText);
    }
  };

  const displayText = translatedText && !showOriginal
    ? translatedText
    : message.content;

  return (
    <View style={[styles.container, isMine && styles.containerMine]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.text, isMine && styles.textMine]}>{displayText}</Text>

        {/* Translation button for received messages */}
        {!isMine && (isTranslating || translatedText) && (
          <TouchableOpacity
            style={styles.translateButton}
            onPress={handleTranslate}
            disabled={isTranslating}
          >
            {isTranslating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons
                  name="language"
                  size={14}
                  color={colors.primary}
                />
                <Text style={[styles.translateText, styles.translateTextActive]}>
                  {showOriginal ? t('chat.seeTranslation') : t('chat.seeOriginal')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
      <View style={[styles.meta, isMine && styles.metaMine]}>
        <Text style={styles.time}>{time}</Text>
        {isMine && (
          <Text style={styles.status}>{message.isRead ? '✓✓' : '✓'}</Text>
        )}
        {translatedText && !showOriginal && !isMine && (
          <Text style={styles.translatedLabel}>{t('chat.translated')}</Text>
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
  translateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  translateText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  translateTextActive: {
    color: colors.primary,
  },
  translatedLabel: {
    ...typography.caption,
    color: colors.primary,
    fontStyle: 'italic',
  },
});

export default MessageBubble;
