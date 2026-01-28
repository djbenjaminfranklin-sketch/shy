import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Détection d'Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Import conditionnel de RevenueCat (ne fonctionne pas dans Expo Go)
let Purchases: any = null;
let LOG_LEVEL: any = null;

if (!isExpoGo) {
  try {
    const RevenueCatModule = require('react-native-purchases');
    Purchases = RevenueCatModule.default;
    LOG_LEVEL = RevenueCatModule.LOG_LEVEL;
  } catch (e) {
    console.warn('RevenueCat module not available');
  }
}

// Types pour TypeScript
import type {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOffering,
  PurchasesOfferings,
} from 'react-native-purchases';

// Clés API RevenueCat
// Note: test_ = mode sandbox, appl_ = production iOS, goog_ = production Android
const REVENUECAT_API_KEY_IOS = 'appl_mFMAYUCJWmfQmCiLtnLIWzqLtOQ';
const REVENUECAT_API_KEY_ANDROID = 'test_zfSePwMZXXKjTyjWulMGtwJtNke'; // TODO: Ajouter la clé Android quand disponible

// Entitlements (droits d'accès)
export const ENTITLEMENTS = {
  PLUS: 'plus',
  PREMIUM: 'premium',
} as const;

// Product IDs (doivent correspondre à App Store Connect / Google Play Console)
export const PRODUCT_IDS = {
  // SHY+
  PLUS_WEEK: 'shy_plus_week',
  PLUS_MONTH: 'shy_plus_month',
  PLUS_3MONTHS: 'shy_plus_3months',
  PLUS_6MONTHS: 'shy_plus_6months',
  PLUS_YEAR: 'shy_plus_year',
  // Premium
  PREMIUM_WEEK: 'shy_premium_week',
  PREMIUM_MONTH: 'shy_premium_month',
  PREMIUM_3MONTHS: 'shy_premium_3months',
  PREMIUM_6MONTHS: 'shy_premium_6months',
  PREMIUM_YEAR: 'shy_premium_year',
} as const;

class RevenueCatService {
  private initialized = false;
  private isAvailable = !isExpoGo && Purchases !== null;

  /**
   * Vérifie si RevenueCat est disponible
   */
  get available(): boolean {
    return this.isAvailable;
  }

  /**
   * Initialise RevenueCat SDK
   * À appeler au démarrage de l'app
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Skip dans Expo Go
    if (!this.isAvailable) {
      console.log('ℹ️ RevenueCat not available (Expo Go mode) - using mock data');
      this.initialized = true;
      return;
    }

    try {
      // Mode debug en dev
      if (__DEV__ && LOG_LEVEL) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // Configuration selon la plateforme
      const apiKey = Platform.OS === 'ios'
        ? REVENUECAT_API_KEY_IOS
        : REVENUECAT_API_KEY_ANDROID;

      await Purchases.configure({ apiKey });
      this.initialized = true;
      console.log('✅ RevenueCat initialized');
    } catch (error) {
      console.error('❌ RevenueCat initialization error:', error);
      // Ne pas throw l'erreur, juste marquer comme non disponible
      this.isAvailable = false;
      this.initialized = true;
    }
  }

  /**
   * Identifie l'utilisateur (après login)
   */
  async login(userId: string): Promise<CustomerInfo | null> {
    if (!this.isAvailable) {
      console.log('ℹ️ RevenueCat login skipped (not available)');
      return null;
    }
    try {
      const { customerInfo } = await Purchases.logIn(userId);
      console.log('✅ RevenueCat user logged in:', userId);
      return customerInfo;
    } catch (error) {
      console.error('❌ RevenueCat login error:', error);
      throw error;
    }
  }

  /**
   * Déconnecte l'utilisateur
   */
  async logout(): Promise<void> {
    if (!this.isAvailable) {
      console.log('ℹ️ RevenueCat logout skipped (not available)');
      return;
    }
    try {
      await Purchases.logOut();
      console.log('✅ RevenueCat user logged out');
    } catch (error) {
      console.error('❌ RevenueCat logout error:', error);
      throw error;
    }
  }

  /**
   * Récupère les infos de l'utilisateur (abonnements actifs)
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.isAvailable) {
      return null;
    }
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('❌ RevenueCat getCustomerInfo error:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les offres disponibles
   */
  async getAllOfferings(): Promise<PurchasesOfferings | null> {
    if (!this.isAvailable) {
      return null;
    }
    try {
      const offerings = await Purchases.getOfferings();
      return offerings;
    } catch (error) {
      console.error('❌ RevenueCat getOfferings error:', error);
      throw error;
    }
  }

  /**
   * Récupère les offres Plus et Premium
   */
  async getOfferings(): Promise<{ plus: PurchasesOffering | null; premium: PurchasesOffering | null }> {
    if (!this.isAvailable) {
      return { plus: null, premium: null };
    }
    try {
      const offerings = await Purchases.getOfferings();
      return {
        plus: offerings.all['Plus'] || null,
        premium: offerings.all['default'] || null, // Premium est dans "default"
      };
    } catch (error) {
      console.error('❌ RevenueCat getOfferings error:', error);
      return { plus: null, premium: null };
    }
  }

  /**
   * Achète un package
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
    if (!this.isAvailable) {
      console.warn('ℹ️ Purchases not available in Expo Go');
      throw new Error('Purchases not available in Expo Go');
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      console.log('✅ Purchase successful');
      return customerInfo;
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('ℹ️ User cancelled purchase');
      } else {
        console.error('❌ Purchase error:', error);
      }
      throw error;
    }
  }

  /**
   * Restaure les achats
   */
  async restorePurchases(): Promise<CustomerInfo | null> {
    if (!this.isAvailable) {
      console.warn('ℹ️ Restore not available in Expo Go');
      return null;
    }
    try {
      const customerInfo = await Purchases.restorePurchases();
      console.log('✅ Purchases restored');
      return customerInfo;
    } catch (error) {
      console.error('❌ Restore purchases error:', error);
      throw error;
    }
  }

  /**
   * Vérifie si l'utilisateur a un abonnement actif
   */
  async hasActiveSubscription(): Promise<boolean> {
    if (!this.isAvailable) {
      return false;
    }
    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return false;
      return Object.keys(customerInfo.entitlements.active).length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Vérifie si l'utilisateur a l'entitlement Plus
   */
  async hasPlus(): Promise<boolean> {
    if (!this.isAvailable) {
      return false;
    }
    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return false;
      return (
        customerInfo.entitlements.active[ENTITLEMENTS.PLUS] !== undefined ||
        customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM] !== undefined
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Vérifie si l'utilisateur a l'entitlement Premium
   */
  async hasPremium(): Promise<boolean> {
    if (!this.isAvailable) {
      return false;
    }
    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return false;
      return customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM] !== undefined;
    } catch (error) {
      return false;
    }
  }

  /**
   * Récupère le niveau d'abonnement actuel
   */
  async getCurrentPlan(): Promise<'free' | 'plus' | 'premium'> {
    if (!this.isAvailable) {
      return 'free';
    }
    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return 'free';

      if (customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM]) {
        return 'premium';
      }
      if (customerInfo.entitlements.active[ENTITLEMENTS.PLUS]) {
        return 'plus';
      }
      return 'free';
    } catch (error) {
      return 'free';
    }
  }

  /**
   * Récupère la date d'expiration de l'abonnement
   */
  async getExpirationDate(): Promise<Date | null> {
    if (!this.isAvailable) {
      return null;
    }
    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return null;
      const activeEntitlements = Object.values(customerInfo.entitlements.active);

      if (activeEntitlements.length > 0) {
        const expirationDate = activeEntitlements[0].expirationDate;
        return expirationDate ? new Date(expirationDate) : null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}

export const revenueCatService = new RevenueCatService();
