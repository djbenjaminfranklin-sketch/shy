import { supabase } from '../client';
import type { Report } from './types';

interface ReportProfileJoin {
  display_name: string;
  photos: string[] | null;
}

interface ReportRow {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  reporter: ReportProfileJoin[] | ReportProfileJoin | null;
  reported: ReportProfileJoin[] | ReportProfileJoin | null;
}

// Get reports
export async function getReports(filter: 'pending' | 'reviewed' | 'all'): Promise<Report[]> {
  try {
    let query = supabase
      .from('reports')
      .select(`
        id,
        reporter_id,
        reported_id,
        reason,
        description,
        status,
        created_at,
        reporter:profiles!reports_reporter_id_fkey(display_name, photos),
        reported:profiles!reports_reported_id_fkey(display_name, photos)
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

    return (data || []).map((report: ReportRow) => {
      const reporter = Array.isArray(report.reporter) ? report.reporter[0] : report.reporter;
      const reported = Array.isArray(report.reported) ? report.reported[0] : report.reported;

      return {
        id: report.id,
        reporterId: report.reporter_id,
        reporterName: reporter?.display_name || 'Inconnu',
        reporterPhoto: reporter?.photos?.[0] || null,
        reportedUserId: report.reported_id,
        reportedUserName: reported?.display_name || 'Inconnu',
        reportedUserPhoto: reported?.photos?.[0] || null,
        reason: report.reason,
        description: report.description,
        status: report.status as Report['status'],
        createdAt: report.created_at,
      };
    });
  } catch {
    return [];
  }
}

// Resolve report
export async function resolveReport(reportId: string, action: 'dismissed' | 'warned' | 'banned'): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('reports')
    .update({ status: action, resolved_at: new Date().toISOString() })
    .eq('id', reportId);

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}
