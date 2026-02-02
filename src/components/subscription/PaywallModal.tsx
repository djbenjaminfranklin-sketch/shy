import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { SUBSCRIPTION_PLANS_BY_ID, PlanType } from '../../constants/subscriptions';
import { Button } from '../ui/Button';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  feature: 'likes' | 'superLikes' | 'rewind' | 'messages' | 'whoLikedYou' | 'filters' | 'boost' | 'autoReply' | 'availabilityMode' | 'quickMeet' | 'mode';
  remainingCount?: number;
  currentUsage?: number;
  limit?: number;
}

const FEATURE_INFO = {
  likes: {
    icon: '❤️',
    title: 'Plus de likes disponibles',
    description: 'Vous avez utilisé tous vos likes pour aujourd\'hui. Revenez demain ou passez à SHY+ !',
    benefit: 'Ralentir améliore les rencontres, mais avec SHY+, likez sans limites !',
    minPlan: 'plus' as PlanType,
  },
  superLikes: {
    icon: '⭐',
    title: 'Super Like utilisé',
    description: 'Votre Super Like du jour a été envoyé ! C\'est un signal fort qui montre votre intérêt.',
    benefit: 'Avec SHY+, envoyez 5 Super Likes par jour pour vous démarquer !',
    minPlan: 'plus' as PlanType,
  },
  rewind: {
    icon: '↩️',
    title: 'Rewind utilisé',
    description: 'Vous avez utilisé votre rewind du jour. Prenez le temps de bien regarder chaque profil !',
    benefit: 'Avec SHY+, revenez en arrière autant que vous voulez.',
    minPlan: 'plus' as PlanType,
  },
  quickMeet: {
    icon: '☕',
    title: 'Proposition Quick Meet utilisée',
    description: 'Vous avez proposé un Quick Meet aujourd\'hui. C\'est super de passer à l\'action !',
    benefit: 'Avec SHY+, proposez des rencontres sans limites.',
    minPlan: 'plus' as PlanType,
  },
  mode: {
    icon: '⚡',
    title: 'Modes de disponibilité',
    description: 'Limite hebdomadaire atteinte pour les modes de disponibilité.',
    benefit: 'Passez à SHY+ pour activer des modes illimités !',
    minPlan: 'plus' as PlanType,
  },
  messages: {
    icon: '💬',
    title: 'Plus de messages disponibles',
    description: 'Vous avez utilisé tous vos messages pour aujourd\'hui.',
    benefit: 'Passez à SHY+ pour discuter sans limites avec vos matchs !',
    minPlan: 'plus' as PlanType,
  },
  whoLikedYou: {
    icon: '👀',
    title: 'Qui vous a liké ?',
    description: 'Découvrez qui craque pour vous avant de décider.',
    benefit: 'Avec SHY+, voyez tous ceux qui vous ont liké !',
    minPlan: 'plus' as PlanType,
  },
  filters: {
    icon: '🎯',
    title: 'Filtres avancés',
    description: 'Affinez votre recherche avec des filtres précis.',
    benefit: 'Trouvez exactement ce que vous cherchez avec SHY+ !',
    minPlan: 'plus' as PlanType,
  },
  boost: {
    icon: '🚀',
    title: 'Boostez votre profil',
    description: 'Soyez vu en premier par plus de personnes.',
    benefit: 'Multipliez vos chances avec le boost Premium !',
    minPlan: 'premium' as PlanType,
  },
  autoReply: {
    icon: '💬',
    title: 'Réponses automatiques',
    description: 'Envoyez automatiquement un message de bienvenue.',
    benefit: 'Impressionnez vos matchs dès le premier message !',
    minPlan: 'plus' as PlanType,
  },
  availabilityMode: {
    icon: '⚡',
    title: 'Modes de disponibilité',
    description: 'Limite hebdomadaire atteinte pour les modes de disponibilité.',
    benefit: 'Passez à SHY+ pour activer des modes illimités et la durée 72h !',
    minPlan: 'plus' as PlanType,
  },
};

export function PaywallModal({ visible, onClose, onUpgrade, feature, remainingCount, currentUsage, limit }: PaywallModalProps) {
  const router = useRouter();
  const info = FEATURE_INFO[feature];
  const recommendedPlan = SUBSCRIPTION_PLANS_BY_ID[info.minPlan];

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      onClose();
      router.push('/profile/subscription' as any);
    }
  };

  // Calculate remaining from currentUsage and limit if not provided
  const effectiveRemaining = remainingCount !== undefined
    ? remainingCount
    : (currentUsage !== undefined && limit !== undefined && limit !== -1
      ? Math.max(0, limit - currentUsage)
      : undefined);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close button */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{info.icon}</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>{info.title}</Text>

            {/* Description */}
            <Text style={styles.description}>{info.description}</Text>

            {/* Remaining count */}
            {effectiveRemaining !== undefined && effectiveRemaining === 0 && (
              <View style={styles.limitBox}>
                <Text style={styles.limitText}>
                  Limite atteinte pour aujourd'hui
                </Text>
                <Text style={styles.limitSubtext}>
                  {currentUsage !== undefined && limit !== undefined
                    ? `${currentUsage}/${limit} utilisés`
                    : 'Revenez demain ou passez à Premium'}
                </Text>
              </View>
            )}

            {/* Benefit */}
            <View style={styles.benefitBox}>
              <Text style={styles.benefitIcon}>✨</Text>
              <Text style={styles.benefitText}>{info.benefit}</Text>
            </View>

            {/* Recommended plan */}
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <View style={[styles.planBadge, { backgroundColor: recommendedPlan.color }]}>
                  <Text style={styles.planBadgeText}>{recommendedPlan.name}</Text>
                </View>
                <Text style={styles.planPrice}>{recommendedPlan.priceLabel}</Text>
              </View>

              <View style={styles.planFeatures}>
                {feature === 'likes' && (
                  <Text style={styles.planFeature}>
                    ✓ {recommendedPlan.features.dailyLikes === -1 ? 'Likes illimités' : `${recommendedPlan.features.dailyLikes} likes/jour`}
                  </Text>
                )}
                {feature === 'messages' && (
                  <Text style={styles.planFeature}>
                    ✓ {recommendedPlan.features.dailyMessages === -1 ? 'Messages illimités' : `${recommendedPlan.features.dailyMessages} messages/jour`}
                  </Text>
                )}
                <Text style={styles.planFeature}>✓ Sans publicité</Text>
                {recommendedPlan.features.canSeeWhoLikedYou && (
                  <Text style={styles.planFeature}>✓ Voir qui vous a liké</Text>
                )}
                {recommendedPlan.features.canBoostProfile && (
                  <Text style={styles.planFeature}>✓ Boost de profil</Text>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title={`Passer à ${recommendedPlan.name}`}
              onPress={handleUpgrade}
              size="large"
            />
            <Pressable style={styles.laterButton} onPress={onClose}>
              <Text style={styles.laterText}>Plus tard</Text>
            </Pressable>
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
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeIcon: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  iconContainer: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  limitBox: {
    backgroundColor: colors.error + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  limitText: {
    ...typography.bodyMedium,
    color: colors.error,
  },
  limitSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  benefitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  benefitIcon: {
    fontSize: 24,
  },
  benefitText: {
    ...typography.bodyMedium,
    color: colors.primary,
    flex: 1,
  },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  planBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  planBadgeText: {
    ...typography.labelSmall,
    color: colors.white,
    fontWeight: '700',
  },
  planPrice: {
    ...typography.h3,
    color: colors.text,
  },
  planFeatures: {
    gap: spacing.xs,
  },
  planFeature: {
    ...typography.body,
    color: colors.success,
  },
  actions: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  laterButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  laterText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

export default PaywallModal;
