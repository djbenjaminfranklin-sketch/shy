/**
 * Types for Ice Breaker feature
 * Ice Breaker sends personalized messages to compatible profiles
 */

export interface UserIceBreakerState {
  iceBreakersAvailable: number;
  lastIceBreakerUsedAt: string | null;
  totalIceBreakersUsed: number;
}

export interface IceBreakerProduct {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  priceLabel: string;
  popular?: boolean;
  bestValue?: boolean;
}

export interface UserIceBreakerRow {
  id: string;
  user_id: string;
  icebreakers_available: number;
  last_icebreaker_used_at: string | null;
  total_icebreakers_used: number;
  updated_at: string;
}

export interface IceBreakerPurchaseRow {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  price: number | null;
  purchased_at: string;
}

export interface IceBreakerResult {
  profileId: string;
  profileName: string;
  message: string;
  sent: boolean;
  error?: string;
}

export interface CompatibleProfile {
  id: string;
  display_name: string;
  interests: string[];
  intention: string;
  distance_km?: number;
}

/**
 * Extended profile for Ice Breaker candidate preview
 * Includes all data needed to show the user before sending
 */
export interface IceBreakerCandidate {
  id: string;
  name: string;
  age: number;
  photoUrl: string | null;
  interests: string[];
  commonInterests: string[];
  intention: string;
  distance?: number;
  message: string;
  approved: boolean;
}
