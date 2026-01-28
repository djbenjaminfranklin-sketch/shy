import { SubscriptionPlanId } from '../constants/subscriptions';

export interface UserSubscription {
  id: string;
  userId: string;
  planId: SubscriptionPlanId;
  status: 'active' | 'canceled' | 'expired' | 'trial';
  startDate: string;
  endDate: string | null;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserLimits {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  likesUsed: number;
  messagesUsed: number;
  lastResetAt: string;
}

export interface AutoReplySettings {
  enabled: boolean;
  templateId: string | null;
  customMessage: string | null;
  activeHoursOnly: boolean;
  startHour: number; // 0-23
  endHour: number; // 0-23
}

export interface SubscriptionFeatureCheck {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  remainingCount?: number;
}
