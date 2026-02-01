import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PurchasesPackage } from 'react-native-purchases';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useSubscription } from '../../src/contexts/SubscriptionContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { promoCodesService } from '../../src/services/supabase/promoCodes';
import {
  SUBSCRIPTION_PLANS,
  DURATION_LABELS,
  FREE_TRIAL,
  formatPrice,
  PlanType,
  PlanDuration,
  PlanPrice,
} from '../../src/constants/subscriptions';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const {
    isLoading,
    currentPlan,
    offerings,
    expirationDate,
    purchasePackage,
    restorePurchases,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('premium');
  const [selectedDuration, setSelectedDuration] = useState<PlanDuration>('month');
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<number | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const { user } = useAuth();

  const plusPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'plus')!;
  const premiumPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'premium')!;

  const currentSelectedPlan = selectedPlan === 'plus' ? plusPlan : premiumPlan;
  const currentPrices = currentSelectedPlan.prices;
  const selectedPrice = currentPrices.find(p => p.duration === selectedDuration);

  // Trouver le package RevenueCat correspondant
  const findPackage = (): PurchasesPackage | undefined => {
    // Sélectionner l'offering correspondante au plan choisi
    const currentOffering = selectedPlan === 'plus' ? offerings.plus : offerings.premium;
    if (!currentOffering?.availablePackages) return undefined;

    const productId = selectedPrice?.productId;
    return currentOffering.availablePackages.find(
      pkg => pkg.product.identifier === productId
    );
  };

  // Valider un code promo
  const handleValidatePromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Veuillez entrer un code promo');
      return;
    }

    if (!user?.id) {
      setPromoError('Vous devez être connecté');
      return;
    }

    setIsValidatingPromo(true);
    setPromoError(null);

    const result = await promoCodesService.validateCode(
      promoCode.trim(),
      user.id,
      selectedPlan,
      selectedDuration
    );

    if (result.isValid) {
      setAppliedDiscount(result.discountPercent);
      setPromoError(null);
    } else {
      setAppliedDiscount(null);
      setPromoError(result.errorMessage || 'Code invalide');
    }

    setIsValidatingPromo(false);
  };

  // Supprimer le code promo
  const handleRemovePromo = () => {
    setPromoCode('');
    setAppliedDiscount(null);
    setPromoError(null);
  };

  // Calculer le prix avec réduction
  const calculateDiscountedPrice = (originalPrice: number): number => {
    if (!appliedDiscount) return originalPrice;
    return originalPrice * (1 - appliedDiscount / 100);
  };

  const handleSubscribe = async () => {
    const pkg = findPackage();

    if (!pkg) {
      // Fallback si RevenueCat pas configure
      Alert.alert(t('subscription.comingSoon'), t('subscription.comingSoonMessage'));
      return;
    }

    setIsPurchasing(true);
    try {
      const success = await purchasePackage(pkg);
      if (success) {
        Alert.alert('🎉', t('subscription.welcomePremium'));
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    try {
      await restorePurchases();
    } finally {
      setIsPurchasing(false);
    }
  };

  const openTermsOfService = () => {
    Linking.openURL('https://shy.eu/legal/terms');
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://shy.eu/legal/privacy');
  };

  const openAppleSubscriptionTerms = () => {
    Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
  };

  const renderPriceOption = (priceOption: PlanPrice) => {
    const isSelected = selectedDuration === priceOption.duration;
    const durationLabel = DURATION_LABELS[priceOption.duration][language];

    return (
      <TouchableOpacity
        key={priceOption.duration}
        style={[styles.priceOption, isSelected && styles.priceOptionSelected]}
        onPress={() => setSelectedDuration(priceOption.duration)}
        activeOpacity={0.7}
      >
        {priceOption.bestValue && (
          <View style={styles.bestValueBadge}>
            <Text style={styles.bestValueText}>🔥 {t('subscription.best')}</Text>
          </View>
        )}
        {priceOption.popular && !priceOption.bestValue && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>⭐ {t('subscription.popular')}</Text>
          </View>
        )}

        <View style={styles.priceOptionContent}>
          <Text style={[styles.priceDuration, isSelected && styles.priceDurationSelected]}>
            {durationLabel}
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.priceAmount, isSelected && styles.priceAmountSelected]}>
              {formatPrice(priceOption.price)}
            </Text>
            {priceOption.pricePerMonth && (
              <Text style={styles.pricePerMonth}>
                ({formatPrice(priceOption.pricePerMonth)}/{t('subscription.month')})
              </Text>
            )}
          </View>
          {priceOption.savings && (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>-{priceOption.savings}%</Text>
            </View>
          )}
        </View>

        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    );
  };

  // Affichage si deja abonne
  if (currentPlan !== 'free') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.replace('/(tabs)/profile')}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('subscription.mySubscription')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.subscribedContent}>
          <View style={styles.subscribedCard}>
            <Text style={styles.subscribedIcon}>
              {currentPlan === 'premium' ? '💎' : '⭐'}
            </Text>
            <Text style={styles.subscribedTitle}>
              {currentPlan === 'premium' ? 'SHY Premium' : 'SHY+'}
            </Text>
            <Text style={styles.subscribedSubtitle}>{t('subscription.activeSubscription')}</Text>
            {expirationDate && (
              <Text style={styles.expirationText}>
                {t('subscription.expiresOn')} {expirationDate.toLocaleDateString()}
              </Text>
            )}
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>{t('subscription.yourBenefits')}</Text>
            {(currentPlan === 'premium' ? premiumPlan : plusPlan).featuresList.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.manageButton} onPress={handleRestore}>
            <Text style={styles.manageButtonText}>{t('subscription.restorePurchases')}</Text>
          </TouchableOpacity>

          <Text style={styles.manageHint}>{t('subscription.manageHint')}</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.replace('/(tabs)/profile')}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('subscription.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Free Trial Banner */}
        {FREE_TRIAL.enabled && (
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.trialBanner}
          >
            <Text style={styles.trialText}>🎉 {t('subscription.firstMonthFree')} 🎉</Text>
          </LinearGradient>
        )}

        {/* Plan Selector */}
        <View style={styles.planSelector}>
          <TouchableOpacity
            style={[styles.planTab, selectedPlan === 'plus' && styles.planTabSelected]}
            onPress={() => setSelectedPlan('plus')}
          >
            <Text style={styles.planTabIcon}>⭐</Text>
            <Text style={[styles.planTabName, selectedPlan === 'plus' && styles.planTabNameSelected]}>
              SHY+
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.planTab, selectedPlan === 'premium' && styles.planTabSelectedPremium]}
            onPress={() => setSelectedPlan('premium')}
          >
            <Text style={styles.planTabIcon}>💎</Text>
            <Text style={[styles.planTabName, selectedPlan === 'premium' && styles.planTabNameSelected]}>
              Premium
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>{t('subscription.includedFeatures')}</Text>
          {currentSelectedPlan.featuresList.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Duration Selection */}
        <View style={styles.pricesSection}>
          <Text style={styles.sectionTitle}>{t('subscription.chooseDuration')}</Text>
          <View style={styles.pricesList}>
            {currentPrices.map(renderPriceOption)}
          </View>
        </View>

        {/* Promo Code */}
        <View style={styles.promoSection}>
          <Text style={styles.sectionTitle}>Code promo</Text>
          <View style={styles.promoInputContainer}>
            <TextInput
              style={[styles.promoInput, appliedDiscount !== null && styles.promoInputSuccess]}
              placeholder="Entrez votre code"
              placeholderTextColor={colors.textTertiary}
              value={promoCode}
              onChangeText={(text) => {
                setPromoCode(text.toUpperCase());
                setPromoError(null);
              }}
              autoCapitalize="characters"
              editable={!appliedDiscount}
            />
            {appliedDiscount ? (
              <TouchableOpacity style={styles.promoRemoveButton} onPress={handleRemovePromo}>
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.promoValidateButton, isValidatingPromo && styles.promoButtonDisabled]}
                onPress={handleValidatePromo}
                disabled={isValidatingPromo}
              >
                {isValidatingPromo ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.promoValidateText}>Valider</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
          {promoError && (
            <Text style={styles.promoError}>{promoError}</Text>
          )}
          {appliedDiscount && (
            <View style={styles.promoSuccess}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.promoSuccessText}>
                -{appliedDiscount}% de réduction appliqué !
              </Text>
            </View>
          )}
        </View>

        {/* Restore */}
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
          <Text style={styles.restoreText}>{t('subscription.restorePurchases')}</Text>
        </TouchableOpacity>

        {/* Apple-Compliant Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.terms}>{t('subscription.termsApple')}</Text>

          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={openTermsOfService}>
              <Text style={styles.legalLink}>{t('subscription.termsOfService')}</Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>|</Text>
            <TouchableOpacity onPress={openPrivacyPolicy}>
              <Text style={styles.legalLink}>{t('subscription.privacyPolicyLink')}</Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>|</Text>
            <TouchableOpacity onPress={openAppleSubscriptionTerms}>
              <Text style={styles.legalLink}>{t('subscription.appleEULA')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Subscribe Button */}
      <View style={styles.footer}>
        {appliedDiscount && selectedPrice && (
          <View style={styles.discountPreview}>
            <Text style={styles.originalPrice}>
              {formatPrice(selectedPrice.price)}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={colors.success} />
            <Text style={styles.discountedPrice}>
              {formatPrice(calculateDiscountedPrice(selectedPrice.price))}
            </Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-{appliedDiscount}%</Text>
            </View>
          </View>
        )}
        <TouchableOpacity
          onPress={handleSubscribe}
          activeOpacity={0.8}
          disabled={isPurchasing || isLoading}
        >
          <LinearGradient
            colors={selectedPlan === 'premium' ? [colors.primary, '#FF4081'] : ['#FFD700', '#FFA000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.subscribeButton, (isPurchasing || isLoading) && styles.subscribeButtonDisabled]}
          >
            {isPurchasing ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={styles.subscribeButtonText}>
                  {FREE_TRIAL.enabled ? t('subscription.tryFree') : t('subscription.subscribe')}
                </Text>
                <Text style={styles.subscribeButtonPrice}>
                  {appliedDiscount && selectedPrice
                    ? formatPrice(calculateDiscountedPrice(selectedPrice.price))
                    : (selectedPrice ? formatPrice(selectedPrice.price) : '')
                  } / {DURATION_LABELS[selectedDuration].short[language]}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.text,
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },

  // Subscribed state
  subscribedContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  subscribedCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.xl,
  },
  subscribedIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  subscribedTitle: {
    ...typography.h2,
    color: colors.text,
  },
  subscribedSubtitle: {
    ...typography.body,
    color: colors.success,
    marginTop: spacing.xs,
  },
  expirationText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  manageButton: {
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  manageButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  manageHint: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
  },

  // Trial Banner
  trialBanner: {
    padding: spacing.md,
    alignItems: 'center',
  },
  trialText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // Plan Selector
  planSelector: {
    flexDirection: 'row',
    margin: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  planTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  planTabSelected: {
    backgroundColor: '#FFD700',
  },
  planTabSelectedPremium: {
    backgroundColor: colors.primary,
  },
  planTabIcon: {
    fontSize: 20,
  },
  planTabName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  planTabNameSelected: {
    color: colors.white,
  },

  // Features
  featuresSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  featureText: {
    ...typography.body,
    color: colors.text,
  },

  // Prices
  pricesSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  pricesList: {
    gap: spacing.sm,
  },
  priceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  priceOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  priceOptionContent: {
    flex: 1,
  },
  priceDuration: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  priceDurationSelected: {
    color: colors.text,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  priceAmountSelected: {
    color: colors.primary,
  },
  pricePerMonth: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  savingsBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  savingsText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  bestValueBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomRightRadius: borderRadius.md,
  },
  bestValueText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomRightRadius: borderRadius.md,
  },
  popularText: {
    color: colors.black,
    fontSize: 10,
    fontWeight: '700',
  },
  checkIcon: {
    marginLeft: spacing.sm,
  },

  // Promo code
  promoSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  promoInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  promoInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    color: colors.text,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  promoInputSuccess: {
    borderColor: colors.success,
    backgroundColor: colors.success + '10',
  },
  promoValidateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoButtonDisabled: {
    opacity: 0.7,
  },
  promoValidateText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  promoRemoveButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  promoError: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  promoSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    backgroundColor: colors.success + '15',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  promoSuccessText: {
    color: colors.success,
    fontWeight: '600',
    fontSize: 14,
  },

  // Restore
  restoreButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  restoreText: {
    color: colors.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },

  // Terms
  termsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  terms: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  legalLink: {
    ...typography.caption,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    ...typography.caption,
    color: colors.textTertiary,
  },

  // Footer
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  discountPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.success + '15',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  originalPrice: {
    fontSize: 16,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.success,
  },
  discountBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  discountBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  subscribeButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  subscribeButtonDisabled: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  subscribeButtonPrice: {
    color: colors.white,
    fontSize: 13,
    opacity: 0.9,
    marginTop: 2,
  },
});
