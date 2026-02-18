import type { AdminStats, DetailedStats, AdminUser, AdminUserDetail, Report } from './types';
import { isAdmin, getUsers, getUserDetail } from './users';
import { banUser, unbanUser, warnUser, verifyUser, deleteUser, giveBoosts, updateProfile } from './actions';
import { getReports, resolveReport } from './reports';
import { getStats, getDetailedStats } from './stats';

// Re-export types so existing imports like `import { AdminStats } from '.../admin'` still work
export type { AdminStats, DetailedStats, AdminUser, AdminUserDetail, Report } from './types';

class AdminService {
  isAdmin(userId: string): Promise<boolean> {
    return isAdmin(userId);
  }

  getStats(): Promise<AdminStats> {
    return getStats();
  }

  getDetailedStats(): Promise<DetailedStats> {
    return getDetailedStats();
  }

  getUsers(
    filter: 'all' | 'reported' | 'unverified' | 'new' | 'banned' | 'premium',
    search?: string
  ): Promise<AdminUser[]> {
    return getUsers(filter, search);
  }

  getUserDetail(userId: string): Promise<AdminUserDetail | null> {
    return getUserDetail(userId);
  }

  getReports(filter: 'pending' | 'reviewed' | 'all'): Promise<Report[]> {
    return getReports(filter);
  }

  resolveReport(reportId: string, action: 'dismissed' | 'warned' | 'banned'): Promise<{ error: string | null }> {
    return resolveReport(reportId, action);
  }

  banUser(userId: string): Promise<{ error: string | null }> {
    return banUser(userId);
  }

  unbanUser(userId: string): Promise<{ error: string | null }> {
    return unbanUser(userId);
  }

  warnUser(userId: string): Promise<{ error: string | null }> {
    return warnUser(userId);
  }

  verifyUser(userId: string): Promise<{ error: string | null }> {
    return verifyUser(userId);
  }

  deleteUser(userId: string): Promise<{ error: string | null }> {
    return deleteUser(userId);
  }

  giveBoosts(userId: string, quantity: number): Promise<{ success: boolean; error: string | null }> {
    return giveBoosts(userId, quantity);
  }

  updateProfile(userId: string, updates: Record<string, unknown>): Promise<void> {
    return updateProfile(userId, updates);
  }
}

export const adminService = new AdminService();
