import { CustomerInfo } from 'react-native-purchases';
import { ENTITLEMENTS } from '../services/revenuecat';
import { PlanType } from '../constants/subscriptions';
import { supabase } from '../services/supabase';

/**
 * Synchronise l'etat de l'abonnement RevenueCat avec Supabase
 * Peut etre appelee apres un achat, une restauration, ou via le listener
 */
export async function syncSubscriptionToSupabase(
  userId: string,
  customerInfo: CustomerInfo,
  planId?: string
): Promise<void> {
  try {
    // Determiner le plan actif
    let activePlanId: PlanType = 'free';
    let activeEntitlement = null;

    if (customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM]) {
      activePlanId = 'premium';
      activeEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM];
    } else if (customerInfo.entitlements.active[ENTITLEMENTS.PLUS]) {
      activePlanId = 'plus';
      activeEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PLUS];
    }

    // Si un planId specifique est fourni (apres achat), l'utiliser
    const finalPlanId = planId || activePlanId;

    // Si pas d'abonnement actif, mettre a jour le statut comme expire
    if (activePlanId === 'free') {
      const { data: existingSubscription } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (existingSubscription) {
        await supabase
          .from('user_subscriptions')
          .update({
            status: 'expired',
            auto_renew: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSubscription.id);
      }
      return;
    }

    // Determiner la date d'expiration
    const expirationDateStr = activeEntitlement?.expirationDate || null;

    // Determiner si le renouvellement automatique est actif
    const willRenew = activeEntitlement?.willRenew ?? true;

    // Upsert la subscription dans Supabase
    await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan_id: finalPlanId,
        status: 'active',
        start_date: activeEntitlement?.originalPurchaseDate || new Date().toISOString(),
        end_date: expirationDateStr,
        auto_renew: willRenew,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });
  } catch (err) {
    // Failed to sync subscription to Supabase
  }
}

/**
 * Determine le plan actif a partir des entitlements RevenueCat
 */
export function determinePlanFromCustomerInfo(customerInfo: CustomerInfo): PlanType {
  if (customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM]) {
    return 'premium';
  }
  if (customerInfo.entitlements.active[ENTITLEMENTS.PLUS]) {
    return 'plus';
  }
  return 'free';
}

/**
 * Extrait le planId depuis l'identifiant d'un package RevenueCat
 */
export function extractPlanIdFromPackage(packageIdentifier: string): PlanType {
  const packageId = packageIdentifier.toLowerCase();
  if (packageId.includes('premium')) return 'premium';
  if (packageId.includes('plus')) return 'plus';
  return 'free';
}
