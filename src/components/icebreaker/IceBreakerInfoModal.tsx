import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { Button } from '../ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';

interface IceBreakerInfoModalProps {
  visible: boolean;
  onClose: () => void;
  onDiscover?: () => void;
  senderName?: string;
  isFirstTime?: boolean;
}

export function IceBreakerInfoModal({
  visible,
  onClose,
  onDiscover,
  senderName,
  isFirstTime = false,
}: IceBreakerInfoModalProps) {
  const { t } = useLanguage();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close button */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeIcon}>×</Text>
          </Pressable>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="snow" size={40} color={colors.icebreaker} />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {isFirstTime
              ? t('icebreaker.receivedFirst')
              : t('icebreaker.whatIsIt')}
          </Text>

          {/* Description */}
          {isFirstTime && senderName && (
            <Text style={styles.subtitle}>
              {t('icebreaker.receivedFrom', { name: senderName })}
            </Text>
          )}

          {/* Explanation */}
          <View style={styles.explanationBox}>
            <View style={styles.explanationItem}>
              <Ionicons name="sparkles" size={20} color={colors.icebreaker} />
              <Text style={styles.explanationText}>
                {t('icebreaker.infoLine1')}
              </Text>
            </View>

            <View style={styles.explanationItem}>
              <Ionicons name="heart" size={20} color={colors.icebreaker} />
              <Text style={styles.explanationText}>
                {t('icebreaker.infoLine2')}
              </Text>
            </View>

            <View style={styles.explanationItem}>
              <Ionicons name="chatbubbles" size={20} color={colors.icebreaker} />
              <Text style={styles.explanationText}>
                {t('icebreaker.infoLine3')}
              </Text>
            </View>
          </View>

          {/* Tip for recipient */}
          <View style={styles.tipBox}>
            <Ionicons name="bulb-outline" size={16} color={colors.premium} />
            <Text style={styles.tipText}>
              {t('icebreaker.youCanToo')}
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            {onDiscover && (
              <Button
                title={t('icebreaker.discover')}
                onPress={onDiscover}
                variant="primary"
                size="medium"
                style={styles.discoverButton}
              />
            )}
            <Button
              title={isFirstTime ? t('icebreaker.seeMessage') : t('common.close')}
              onPress={onClose}
              variant={onDiscover ? 'outline' : 'primary'}
              size="medium"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeIcon: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.icebreaker + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  explanationBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: '100%',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  explanationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  explanationText: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.premium + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  tipText: {
    ...typography.caption,
    color: colors.premium,
    fontWeight: '600',
  },
  buttons: {
    width: '100%',
    gap: spacing.sm,
  },
  discoverButton: {
    backgroundColor: colors.icebreaker,
  },
});

export default IceBreakerInfoModal;
