import { supabase } from './client';

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
  email: string;
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

class AdminService {
  // Check if user is admin
  async isAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) return false;
      return data?.role === 'admin';
    } catch {
      return false;
    }
  }

  // Get dashboard stats
  async getStats(): Promise<AdminStats> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        { count: totalUsers },
        { count: activeToday },
        { count: newToday },
        { count: premiumUsers },
        { count: pendingReports },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_active_at', today.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).in('subscription_tier', ['plus', 'premium']),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      return {
        totalUsers: totalUsers || 0,
        activeToday: activeToday || 0,
        newToday: newToday || 0,
        premiumUsers: premiumUsers || 0,
        pendingReports: pendingReports || 0,
      };
    } catch {
      return {
        totalUsers: 0,
        activeToday: 0,
        newToday: 0,
        premiumUsers: 0,
        pendingReports: 0,
      };
    }
  }

  // Get detailed stats
  async getDetailedStats(): Promise<DetailedStats> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Basic counts
      const [
        { count: totalUsers },
        { count: activeToday },
        { count: activeWeek },
        { count: newMonth },
        { count: plusSubscribers },
        { count: premiumSubscribers },
        { count: verifiedUsers },
        { count: pendingReports },
        { count: bannedUsers },
        { count: totalMatches },
        { count: totalMessages },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_active_at', today.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_active_at', weekAgo.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'plus'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'premium'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
        supabase.from('matches').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
      ]);

      // Gender distribution
      const { data: genderData } = await supabase
        .from('profiles')
        .select('gender');

      const genderStats: Record<string, number> = {};
      genderData?.forEach((p) => {
        if (p.gender) {
          genderStats[p.gender] = (genderStats[p.gender] || 0) + 1;
        }
      });

      // Age distribution
      const { data: ageData } = await supabase
        .from('profiles')
        .select('birth_date');

      const ageStats: Record<string, number> = {
        '18-24': 0,
        '25-34': 0,
        '35-44': 0,
        '45-54': 0,
        '55+': 0,
      };

      const now = new Date();
      ageData?.forEach((p) => {
        if (p.birth_date) {
          const age = Math.floor((now.getTime() - new Date(p.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          if (age < 25) ageStats['18-24']++;
          else if (age < 35) ageStats['25-34']++;
          else if (age < 45) ageStats['35-44']++;
          else if (age < 55) ageStats['45-54']++;
          else ageStats['55+']++;
        }
      });

      const premiumUsers = (plusSubscribers || 0) + (premiumSubscribers || 0);

      return {
        totalUsers: totalUsers || 0,
        activeToday: activeToday || 0,
        activeWeek: activeWeek || 0,
        newMonth: newMonth || 0,
        premiumUsers,
        premiumRate: totalUsers ? Math.round((premiumUsers / totalUsers) * 100) : 0,
        plusSubscribers: plusSubscribers || 0,
        premiumSubscribers: premiumSubscribers || 0,
        monthlyRevenue: 0, // Would need RevenueCat API
        totalMatches: totalMatches || 0,
        totalMessages: totalMessages || 0,
        avgMatchesPerUser: totalUsers ? Math.round((totalMatches || 0) / totalUsers * 10) / 10 : 0,
        verifiedUsers: verifiedUsers || 0,
        pendingReports: pendingReports || 0,
        bannedUsers: bannedUsers || 0,
        genderStats,
        ageStats,
      };
    } catch {
      return {
        totalUsers: 0,
        activeToday: 0,
        activeWeek: 0,
        newMonth: 0,
        premiumUsers: 0,
        premiumRate: 0,
        plusSubscribers: 0,
        premiumSubscribers: 0,
        monthlyRevenue: 0,
        totalMatches: 0,
        totalMessages: 0,
        avgMatchesPerUser: 0,
        verifiedUsers: 0,
        pendingReports: 0,
        bannedUsers: 0,
        genderStats: {},
        ageStats: {},
      };
    }
  }

  // Get users with filters
  async getUsers(
    filter: 'all' | 'reported' | 'unverified' | 'new' | 'banned' | 'premium',
    search?: string
  ): Promise<AdminUser[]> {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          email,
          display_name,
          birth_date,
          photos,
          gender,
          subscription_tier,
          is_banned,
          is_verified,
          last_active_at,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply filters
      switch (filter) {
        case 'reported':
          // Users with reports - would need a join or subquery
          break;
        case 'unverified':
          query = query.eq('is_verified', false);
          break;
        case 'new':
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          query = query.gte('created_at', weekAgo.toISOString());
          break;
        case 'banned':
          query = query.eq('is_banned', true);
          break;
        case 'premium':
          query = query.in('subscription_tier', ['plus', 'premium']);
          break;
      }

      // Apply search
      if (search && search.length >= 2) {
        query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get report counts
      const userIds = data?.map(u => u.id) || [];
      const { data: reportCounts } = await supabase
        .from('reports')
        .select('reported_user_id')
        .in('reported_user_id', userIds);

      const reportCountMap: Record<string, number> = {};
      reportCounts?.forEach(r => {
        reportCountMap[r.reported_user_id] = (reportCountMap[r.reported_user_id] || 0) + 1;
      });

      return (data || []).map(user => ({
        id: user.id,
        email: user.email || '',
        displayName: user.display_name || 'Sans nom',
        age: user.birth_date ? calculateAge(user.birth_date) : 0,
        photos: user.photos || [],
        gender: user.gender || '',
        isPremium: ['plus', 'premium'].includes(user.subscription_tier),
        isBanned: user.is_banned || false,
        isVerified: user.is_verified || false,
        isOnline: isRecentlyActive(user.last_active_at),
        reportCount: reportCountMap[user.id] || 0,
        createdAt: user.created_at,
      }));
    } catch {
      return [];
    }
  }

  // Get user detail
  async getUserDetail(userId: string): Promise<AdminUserDetail | null> {
    try {
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Get counts
      const [
        { count: matchCount },
        { count: messageCount },
        { count: reportedByCount },
        { data: reportsReceived },
      ] = await Promise.all([
        supabase.from('matches').select('*', { count: 'exact', head: true })
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
        supabase.from('messages').select('*', { count: 'exact', head: true })
          .eq('sender_id', userId),
        supabase.from('reports').select('*', { count: 'exact', head: true })
          .eq('reported_user_id', userId),
        supabase.from('reports')
          .select('reason, description, created_at')
          .eq('reported_user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      return {
        id: user.id,
        email: user.email || '',
        displayName: user.display_name || 'Sans nom',
        age: user.birth_date ? calculateAge(user.birth_date) : 0,
        photos: user.photos || [],
        gender: user.gender || '',
        bio: user.bio,
        intention: user.intention || '',
        isPremium: ['plus', 'premium'].includes(user.subscription_tier),
        isBanned: user.is_banned || false,
        isVerified: user.is_verified || false,
        isOnline: isRecentlyActive(user.last_active_at),
        lastActiveAt: user.last_active_at,
        createdAt: user.created_at,
        matchCount: matchCount || 0,
        messageCount: messageCount || 0,
        reportCount: 0,
        reportedByCount: reportedByCount || 0,
        reportsReceived: (reportsReceived || []).map(r => ({
          reason: r.reason,
          description: r.description,
          createdAt: r.created_at,
        })),
      };
    } catch {
      return null;
    }
  }

  // Get reports
  async getReports(filter: 'pending' | 'reviewed' | 'all'): Promise<Report[]> {
    try {
      let query = supabase
        .from('reports')
        .select(`
          id,
          reporter_id,
          reported_user_id,
          reason,
          description,
          status,
          created_at,
          reporter:profiles!reports_reporter_id_fkey(display_name, photos),
          reported:profiles!reports_reported_user_id_fkey(display_name, photos)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter === 'pending') {
        query = query.eq('status', 'pending');
      } else if (filter === 'reviewed') {
        query = query.neq('status', 'pending');
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((report: any) => ({
        id: report.id,
        reporterId: report.reporter_id,
        reporterName: report.reporter?.display_name || 'Inconnu',
        reporterPhoto: report.reporter?.photos?.[0] || null,
        reportedUserId: report.reported_user_id,
        reportedUserName: report.reported?.display_name || 'Inconnu',
        reportedUserPhoto: report.reported?.photos?.[0] || null,
        reason: report.reason,
        description: report.description,
        status: report.status,
        createdAt: report.created_at,
      }));
    } catch {
      return [];
    }
  }

  // Resolve report
  async resolveReport(reportId: string, action: 'dismissed' | 'warned' | 'banned'): Promise<void> {
    await supabase
      .from('reports')
      .update({ status: action, resolved_at: new Date().toISOString() })
      .eq('id', reportId);
  }

  // Ban user
  async banUser(userId: string): Promise<void> {
    await supabase
      .from('profiles')
      .update({ is_banned: true })
      .eq('id', userId);
  }

  // Unban user
  async unbanUser(userId: string): Promise<void> {
    await supabase
      .from('profiles')
      .update({ is_banned: false })
      .eq('id', userId);
  }

  // Warn user
  async warnUser(userId: string): Promise<void> {
    // Could send a notification or increment warning count
    await supabase
      .from('profiles')
      .update({ warning_count: supabase.rpc('increment_warning', { user_id: userId }) })
      .eq('id', userId);
  }

  // Verify user manually
  async verifyUser(userId: string): Promise<void> {
    await supabase
      .from('profiles')
      .update({ is_verified: true, verified_at: new Date().toISOString() })
      .eq('id', userId);
  }

  // Delete user
  async deleteUser(userId: string): Promise<void> {
    // This should cascade delete related data based on DB constraints
    await supabase.auth.admin.deleteUser(userId);
  }

  // Give free subscription to user
  async giveSubscription(userId: string, tier: 'free' | 'plus' | 'premium'): Promise<void> {
    await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        subscription_updated_at: new Date().toISOString()
      })
      .eq('id', userId);
  }

  // Update any profile field (full admin power)
  async updateProfile(userId: string, updates: Record<string, any>): Promise<void> {
    await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
  }
}

// Helper functions
function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function isRecentlyActive(lastActiveAt: string | null): boolean {
  if (!lastActiveAt) return false;
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  return new Date(lastActiveAt).getTime() > fiveMinutesAgo;
}

export const adminService = new AdminService();
