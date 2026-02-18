import { supabase } from '../client';
import type { AdminStats, DetailedStats } from './types';

// Get dashboard stats
export async function getStats(): Promise<AdminStats> {
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
export async function getDetailedStats(): Promise<DetailedStats> {
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
      supabase.from('connections').select('*', { count: 'exact', head: true }),
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
