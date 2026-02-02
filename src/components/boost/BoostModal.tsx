import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { BOOST_PRODUCTS, BOOST_DURATION_MINUTES } from '../../constants/subscriptions';
import { Button } from '../ui/Button';
import { useBoost } from '../../contexts/BoostContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface BoostModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BoostModal({ visible, onClose }: BoostModalProps) {
  const { t } = useLanguage();
  const {
    boostsAvailable,
    isBoostActive,
    remainingSeconds,
    isLoading,
    purchaseBoosts,
    activateBoost,
  } = useBoost();

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handleActivateBoost = async () => {
    const success = await activateBoost();
    if (success) {
      onClose();
    }
  };

  const handlePurchase = async (productId: string) => {
    setIsPurchasing(true);
    setSelectedProductId(productId);
    try {
      const success = await purchaseBoosts(productId);
      if (success) {
        // Purchase successful, stay on modal to show updated count
      }
    } finally {
      setIsPurchasing(false);
      setSelectedProductId(null);
    }
  };

  const formatRemainingTime = () => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close button */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeIcon}>x</Text>
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="flash" size={40} color={colors.boost} />
              </View>
              <Text style={styles.title}>{t('boost.title')}</Text>
              <Text style={styles.description}>{t('boost.description')}</Text>
            </View>

            {/* Boost active indicator */}
            {isBoostActive && (
              <View style={styles.activeBoostContainer}>
                <View style={styles.activeBoostBadge}>
                  <Ionicons name="flash" size={20} color={colors.white} />
                  <Text style={styles.activeBoostText}>{t('boost.active')}</Text>
                </View>
                <Text style={styles.activeBoostTime}>{formatRemainingTime()}</Text>
                <Text style={styles.activeBoostHint}>{t('boost.activeHint')}</Text>
              </View>
            )}

            {/* Available boosts */}
            {!isBoostActive && boostsAvailable > 0 && (
              <View style={styles.availableSection}>
                <View style={styles.availableHeader}>
                  <Text style={styles.availableCount}>{boostsAvailable}</Text>
                  <Text style={styles.availableLabel}>
                    {t('boost.remaining', { count: boostsAvailable })}
                  </Text>
                </View>

                <View style={styles.durationInfo}>
                  <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.durationText}>
                    {t('boost.duration', { minutes: BOOST_DURATION_MINUTES })}
                  </Text>
                </View>

                <Button
                  title={t('boost.activate')}
                  onPress={handleActivateBoost}
                  loading={isLoading}
                  size="large"
                  style={styles.activateButton}
                />
              </View>
            )}

            {/* Purchase section */}
            {!isBoostActive && (
              <View style={styles.purchaseSection}>
                {boostsAvailable > 0 && (
                  <Text style={styles.orText}>{t('boost.orBuyMore')}</Text>
                )}
                {boostsAvailable === 0 && (
                  <Text style={styles.noBoostsText}>{t('boost.noBoosts')}</Text>
                )}

                <View style={styles.productsGrid}>
                  {BOOST_PRODUCTS.map((product) => (
                    <Pressable
                      key={product.id}
                      style={[
                        styles.productCard,
                        product.popular && styles.productCardPopular,
                        product.bestValue && styles.productCardBestValue,
                      ]}
                      onPress={() => handlePurchase(product.productId)}
                      disabled={isPurchasing}
                    >
                      {product.popular && (
                        <View style={styles.productBadge}>
                          <Text style={styles.productBadgeText}>{t('boost.popular')}</Text>
                        </View>
                      )}
                      {product.bestValue && (
                        <View style={[styles.productBadge, styles.productBadgeBest]}>
                          <Text style={styles.productBadgeText}>{t('boost.bestValue')}</Text>
                        </View>
                      )}

                      <View style={styles.productContent}>
                        <View style={styles.productQuantity}>
                          <Ionicons name="flash" size={24} color={colors.boost} />
                          <Text style={styles.productQuantityText}>{product.quantity}</Text>
                        </View>

                        <Text style={styles.productLabel}>
                          {product.quantity === 1
                            ? t('boost.singleBoost')
                            : t('boost.packOf', { count: product.quantity })}
                        </Text>

                        {isPurchasing && selectedProductId === product.productId ? (
                          <ActivityIndicator size="small" color={colors.boost} />
                        ) : (
                          <Text style={styles.productPrice}>{product.priceLabel}</Text>
                        )}
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.disclaimerText}>{t('boost.disclaimer')}</Text>
            </View>
          </ScrollView>
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
    maxHeight: '90%',
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
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.boost + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  activeBoostContainer: {
    backgroundColor: colors.boost + '20',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.boost + '50',
  },
  activeBoostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.boost,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  activeBoostText: {
    ...typography.labelSmall,
    color: colors.white,
    fontWeight: '700',
  },
  activeBoostTime: {
    ...typography.h1,
    color: colors.boost,
    fontWeight: '700',
  },
  activeBoostHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  availableSection: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  availableHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  availableCount: {
    ...typography.h1,
    color: colors.boost,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  availableLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  durationText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  activateButton: {
    marginTop: spacing.sm,
  },
  purchaseSection: {
    marginBottom: spacing.lg,
  },
  orText: {
    ...typography.label,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  noBoostsText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  productsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  productCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  productCardPopular: {
    borderColor: colors.boost,
  },
  productCardBestValue: {
    borderColor: colors.premium,
  },
  productBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.boost,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderBottomLeftRadius: borderRadius.sm,
  },
  productBadgeBest: {
    backgroundColor: colors.premium,
  },
  productBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 9,
  },
  productContent: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  productQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  productQuantityText: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
  },
  productLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  productPrice: {
    ...typography.bodyMedium,
    color: colors.boost,
    fontWeight: '700',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  disclaimerText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
});

export default BoostModal;
