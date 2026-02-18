import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useLanguage } from '../../contexts/LanguageContext';
import { IceBreakerInfoModal } from './IceBreakerInfoModal';

interface IceBreakerBadgeProps {
  senderName?: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  onDiscover?: () => void;
}

export function IceBreakerBadge({
  senderName,
  size = 'medium',
  showLabel = true,
  onDiscover,
}: IceBreakerBadgeProps) {
  const [showInfo, setShowInfo] = useState(false);

  const iconSize = size === 'small' ? 12 : size === 'medium' ? 16 : 20;

  return (
    <>
      <Pressable
        style={[
          styles.badge,
          size === 'small' && styles.badgeSmall,
          size === 'large' && styles.badgeLarge,
        ]}
        onPress={() => setShowInfo(true)}
      >
        <Ionicons name="snow" size={iconSize} color={colors.icebreaker} />
        {showLabel && (
          <Text
            style={[
              styles.badgeText,
              size === 'small' && styles.badgeTextSmall,
              size === 'large' && styles.badgeTextLarge,
            ]}
          >
            Ice Breaker
          </Text>
        )}
        <Ionicons
          name="information-circle-outline"
          size={iconSize - 2}
          color={colors.icebreaker}
          style={styles.infoIcon}
        />
      </Pressable>

      <IceBreakerInfoModal
        visible={showInfo}
        onClose={() => setShowInfo(false)}
        onDiscover={onDiscover}
        senderName={senderName}
        isFirstTime={false}
      />
    </>
  );
}

// Compact version for conversation list
export function IceBreakerBadgeCompact() {
  return (
    <View style={styles.compactBadge}>
      <Ionicons name="snow" size={10} color={colors.icebreaker} />
    </View>
  );
}

// Header banner for chat screen
interface IceBreakerBannerProps {
  senderName: string;
  onDismiss?: () => void;
  onDiscover?: () => void;
}

export function IceBreakerBanner({
  senderName,
  onDismiss,
  onDiscover,
}: IceBreakerBannerProps) {
  const { t } = useLanguage();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <Pressable style={styles.banner} onPress={() => setShowInfo(true)}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerIconContainer}>
            <Ionicons name="snow" size={20} color={colors.white} />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>{t('icebreaker.messageIceBreaker')}</Text>
            <Text style={styles.bannerSubtitle}>
              {t('icebreaker.tapToLearnMore')}
            </Text>
          </View>
        </View>
        {onDismiss && (
          <Pressable style={styles.bannerClose} onPress={onDismiss}>
            <Ionicons name="close" size={18} color={colors.icebreaker} />
          </Pressable>
        )}
      </Pressable>

      <IceBreakerInfoModal
        visible={showInfo}
        onClose={() => setShowInfo(false)}
        onDiscover={onDiscover}
        senderName={senderName}
        isFirstTime={false}
      />
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.icebreaker + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  badgeSmall: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  badgeLarge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    ...typography.caption,
    color: colors.icebreaker,
    fontWeight: '600',
    fontSize: 11,
  },
  badgeTextSmall: {
    fontSize: 9,
  },
  badgeTextLarge: {
    fontSize: 13,
  },
  infoIcon: {
    opacity: 0.7,
  },
  compactBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.icebreaker + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    backgroundColor: colors.icebreaker + '15',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.icebreaker + '30',
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bannerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.icebreaker,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    ...typography.bodySmall,
    color: colors.icebreaker,
    fontWeight: '700',
  },
  bannerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  bannerClose: {
    padding: spacing.xs,
  },
});

export default IceBreakerBadge;
