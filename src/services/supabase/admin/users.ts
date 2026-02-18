import { supabase } from '../client';
import type { AdminUser, AdminUserDetail } from './types';
import { calculateAge, isRecentlyActive } from './helpers';

// Check if user is admin
export async function isAdmin(userId: string): Promise<boolean> {
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

// Get users with filters
export async function getUsers(
  filter: 'all' | 'reported' | 'unverified' | 'new' | 'banned' | 'premium',
  search?: string
): Promise<AdminUser[]> {
  try {
    let query = supabase
      .from('profiles')
      .select(`
        id,
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
      query = query.ilike('display_name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Get report counts
    const userIds = data?.map(u => u.id) || [];
    const { data: reportCounts } = await supabase
      .from('reports')
      .select('reported_id')
      .in('reported_id', userIds);

    const reportCountMap: Record<string, number> = {};
    reportCounts?.forEach(r => {
      reportCountMap[r.reported_id] = (reportCountMap[r.reported_id] || 0) + 1;
    });

    return (data || []).map(user => ({
      id: user.id,
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
export async function getUserDetail(userId: string): Promise<AdminUserDetail | null> {
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
      supabase.from('connections').select('*', { count: 'exact', head: true })
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
      supabase.from('messages').select('*', { count: 'exact', head: true })
        .eq('sender_id', userId),
      supabase.from('reports').select('*', { count: 'exact', head: true })
        .eq('reported_id', userId),
      supabase.from('reports')
        .select('reason, description, created_at')
        .eq('reported_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    return {
      id: user.id,
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
