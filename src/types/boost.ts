/**
 * Types for Profile Boost feature
 */

export interface UserBoostState {
  boostsAvailable: number;
  activeBoostExpiresAt: string | null;
  lastBoostActivatedAt: string | null;
  isBoostActive: boolean;
  remainingSeconds: number;
}

export interface BoostProduct {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  priceLabel: string;
  popular?: boolean;
  bestValue?: boolean;
}

export interface UserBoostRow {
  id: string;
  user_id: string;
  boosts_available: number;
  active_boost_expires_at: string | null;
  last_boost_activated_at: string | null;
  updated_at: string;
}

export interface BoostPurchaseRow {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  price: number | null;
  purchased_at: string;
}
