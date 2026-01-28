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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PurchasesPackage } from 'react-native-purchases';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useSubscription } from '../../src/contexts/SubscriptionContext';
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
  const { language } = useLanguage();
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

  const handleSubscribe = async () => {
    const pkg = findPackage();

    if (!pkg) {
      // Fallback si RevenueCat pas configuré
      Alert.alert(
        language === 'fr' ? 'Bientôt disponible' : 'Coming soon',
        language === 'fr'
          ? 'Les abonnements seront disponibles très prochainement !'
          : 'Subscriptions will be available very soon!'
      );
      return;
    }

    setIsPurchasing(true);
    try {
      const success = await purchasePackage(pkg);
      if (success) {
        Alert.alert(
          '🎉',
          language === 'fr'
            ? 'Bienvenue dans SHY Premium !'
            : 'Welcome to SHY Premium!'
        );
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

    // Chercher le prix réel depuis RevenueCat si disponible
    const currentOffering = selectedPlan === 'plus' ? offerings.plus : offerings.premium;
    const pkg = currentOffering?.availablePackages?.find(
      p => p.product.identifier === priceOption.productId
    );
    const realPrice = pkg?.product.priceString;

    return (
      <TouchableOpacity
        key={priceOption.duration}
        style={[styles.priceOption, isSelected && styles.priceOptionSelected]}
        onPress={() => setSelectedDuration(priceOption.duration)}
        activeOpacity={0.7}
      >
        {priceOption.bestValue && (
          <View style={styles.bestValueBadge}>
            <Text style={styles.bestValueText}>
              {language === 'fr' ? '🔥 MEILLEUR' : '🔥 BEST'}
            </Text>
          </View>
        )}
        {priceOption.popular && !priceOption.bestValue && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>
              {language === 'fr' ? '⭐ POPULAIRE' : '⭐ POPULAR'}
            </Text>
          </View>
        )}

        <View style={styles.priceOptionContent}>
          <Text style={[styles.priceDuration, isSelected && styles.priceDurationSelected]}>
            {durationLabel}
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.priceAmount, isSelected && styles.priceAmountSelected]}>
              {realPrice || formatPrice(priceOption.price)}
            </Text>
            {priceOption.pricePerMonth && (
              <Text style={styles.pricePerMonth}>
                ({formatPrice(priceOption.pricePerMonth)}/{language === 'fr' ? 'mois' : 'mo'})
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

  // Affichage si déjà abonné
  if (currentPlan !== 'free') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.subscribedContent}>
          <View style={styles.subscribedCard}>
            <Text style={styles.subscribedIcon}>
              {currentPlan === 'premium' ? '💎' : '⭐'}
            </Text>
            <Text style={styles.subscribedTitle}>
              {currentPlan === 'premium' ? 'SHY Premium' : 'SHY+'}
            </Text>
            <Text style={styles.subscribedSubtitle}>
              {language === 'fr' ? 'Abonnement actif' : 'Active subscription'}
            </Text>
            {expirationDate && (
              <Text style={styles.expirationText}>
                {language === 'fr' ? 'Expire le' : 'Expires on'}{' '}
                {expirationDate.toLocaleDateString()}
              </Text>
            )}
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>
              {language === 'fr' ? 'Vos avantages' : 'Your benefits'}
            </Text>
            {(currentPlan === 'premium' ? premiumPlan : plusPlan).featuresList.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.manageButton} onPress={handleRestore}>
            <Text style={styles.manageButtonText}>
              {language === 'fr' ? 'Restaurer les achats' : 'Restore purchases'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.manageHint}>
            {language === 'fr'
              ? 'Gérez votre abonnement dans les paramètres de l\'App Store ou Google Play'
              : 'Manage your subscription in App Store or Google Play settings'}
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Free Trial Banner */}
        {FREE_TRIAL.enabled && (
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.trialBanner}
          >
            <Text style={styles.trialText}>
              🎉 {language === 'fr' ? '1er MOIS GRATUIT' : 'FIRST MONTH FREE'} 🎉
            </Text>
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
          <Text style={styles.sectionTitle}>
            {language === 'fr' ? 'Fonctionnalités incluses' : 'Included features'}
          </Text>
          {currentSelectedPlan.featuresList.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Duration Selection */}
        <View style={styles.pricesSection}>
          <Text style={styles.sectionTitle}>
            {language === 'fr' ? 'Choisissez votre durée' : 'Choose your duration'}
          </Text>
          <View style={styles.pricesList}>
            {currentPrices.map(renderPriceOption)}
          </View>
        </View>

        {/* Comparison */}
        <View style={styles.comparisonSection}>
          <Text style={styles.comparisonTitle}>
            {language === 'fr' ? '30% moins cher que la concurrence !' : '30% cheaper than competitors!'}
          </Text>
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonApp}>Tinder Premium</Text>
            <Text style={styles.comparisonPrice}>39,99 €</Text>
          </View>
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonApp}>Bumble Premium</Text>
            <Text style={styles.comparisonPrice}>39,99 €</Text>
          </View>
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonApp}>Hinge Preferred</Text>
            <Text style={styles.comparisonPrice}>34,99 €</Text>
          </View>
          <View style={[styles.comparisonRow, styles.comparisonRowShy]}>
            <Text style={styles.comparisonAppShy}>SHY Premium</Text>
            <Text style={styles.comparisonPriceShy}>19,99 €</Text>
          </View>
        </View>

        {/* Restore */}
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
          <Text style={styles.restoreText}>
            {language === 'fr' ? 'Restaurer mes achats' : 'Restore my purchases'}
          </Text>
        </TouchableOpacity>

        {/* Apple-Compliant Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.terms}>
            {language === 'fr'
              ? "Le paiement sera effectué sur votre compte iTunes lors de la confirmation de l'achat. L'abonnement se renouvelle automatiquement sauf s'il est annulé au moins 24 heures avant la fin de la période en cours. Votre compte sera facturé pour le renouvellement dans les 24 heures précédant la fin de la période en cours. Vous pouvez gérer et annuler vos abonnements dans les réglages de votre compte App Store après l'achat."
              : 'Payment will be charged to your iTunes Account at confirmation of purchase. Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel your subscriptions by going to your App Store account settings after purchase.'}
          </Text>

          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={openTermsOfService}>
              <Text style={styles.legalLink}>
                {language === 'fr' ? "Conditions d'utilisation" : 'Terms of Service'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>|</Text>
            <TouchableOpacity onPress={openPrivacyPolicy}>
              <Text style={styles.legalLink}>
                {language === 'fr' ? 'Politique de confidentialité' : 'Privacy Policy'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>|</Text>
            <TouchableOpacity onPress={openAppleSubscriptionTerms}>
              <Text style={styles.legalLink}>
                {language === 'fr' ? 'EULA Apple' : 'Apple EULA'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Subscribe Button */}
      <View style={styles.footer}>
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
                  {FREE_TRIAL.enabled
                    ? (language === 'fr' ? 'Essayer GRATUITEMENT' : 'Try for FREE')
                    : (language === 'fr' ? 'S\'abonner' : 'Subscribe')}
                </Text>
                <Text style={styles.subscribeButtonPrice}>
                  {selectedPrice ? formatPrice(selectedPrice.price) : ''} / {DURATION_LABELS[selectedDuration].short[language]}
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

  // Comparison
  comparisonSection: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
  },
  comparisonTitle: {
    ...typography.h4,
    color: colors.success,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  comparisonRowShy: {
    borderBottomWidth: 0,
    backgroundColor: colors.primary + '20',
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
  },
  comparisonApp: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  comparisonPrice: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  comparisonAppShy: {
    color: colors.primary,
    fontWeight: '700',
  },
  comparisonPriceShy: {
    color: colors.primary,
    fontWeight: '700',
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
