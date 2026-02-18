export interface AdminStats {
  totalUsers: number;
  activeToday: number;
  newToday: number;
  premiumUsers: number;
  pendingReports: number;
}

export interface DetailedStats {
  totalUsers: number;
  activeToday: number;
  activeWeek: number;
  newMonth: number;
  premiumUsers: number;
  premiumRate: number;
  plusSubscribers: number;
  premiumSubscribers: number;
  monthlyRevenue: number;
  totalMatches: number;
  totalMessages: number;
  avgMatchesPerUser: number;
  verifiedUsers: number;
  pendingReports: number;
  bannedUsers: number;
  genderStats: Record<string, number>;
  ageStats: Record<string, number>;
}

export interface AdminUser {
  id: string;
  displayName: string;
  age: number;
  photos: string[];
  gender: string;
  isPremium: boolean;
  isBanned: boolean;
  isVerified: boolean;
  isOnline: boolean;
  reportCount: number;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUser {
  bio: string | null;
  intention: string;
  lastActiveAt: string | null;
  matchCount: number;
  messageCount: number;
  reportedByCount: number;
  reportsReceived: {
    reason: string;
    description: string | null;
    createdAt: string;
  }[];
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterPhoto: string | null;
  reportedUserId: string;
  reportedUserName: string;
  reportedUserPhoto: string | null;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'dismissed' | 'warned' | 'banned';
  createdAt: string;
}
