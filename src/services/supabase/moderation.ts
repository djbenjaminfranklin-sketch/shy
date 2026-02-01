import { supabase } from './client';
import type { Block, Report } from '../../types/moderation';
import type { ReportReasonId } from '../../constants/moderation';

export const moderationService = {
  /**
   * Bloquer un utilisateur
   */
  async blockUser(blockerId: string, blockedId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('blocks')
        .insert({
          blocker_id: blockerId,
          blocked_id: blockedId,
        });

      if (error && error.code !== '23505') {
        return { error: error.message };
      }

      // Supprimer la connexion s'il en existe une
      const [user1, user2] = [blockerId, blockedId].sort();

      // Récupérer la connexion pour avoir son ID
      const { data: connection } = await supabase
        .from('connections')
        .select('id')
        .eq('user1_id', user1)
        .eq('user2_id', user2)
        .single();

      if (connection) {
        // Supprimer la conversation associée (les messages sont supprimés en cascade)
        await supabase
          .from('conversations')
          .delete()
          .eq('connection_id', connection.id);

        // Supprimer la connexion
        await supabase
          .from('connections')
          .delete()
          .eq('id', connection.id);
      }

      // Supprimer les invitations entre les deux utilisateurs
      await supabase
        .from('invitations')
        .delete()
        .or(`and(sender_id.eq.${blockerId},receiver_id.eq.${blockedId}),and(sender_id.eq.${blockedId},receiver_id.eq.${blockerId})`);

      return { error: null };
    } catch (err) {
      return { error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Débloquer un utilisateur
   */
  async unblockUser(blockerId: string, blockedId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Récupérer les utilisateurs bloqués
   */
  async getBlockedUsers(userId: string): Promise<{ blocks: Block[]; error: string | null }> {
    try {
      const { data: blocks, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('blocker_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { blocks: [], error: error.message };
      }

      const result: Block[] = (blocks || []).map((b) => ({
        id: b.id,
        blockerId: b.blocker_id,
        blockedId: b.blocked_id,
        createdAt: b.created_at,
      }));

      return { blocks: result, error: null };
    } catch (err) {
      return { blocks: [], error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Vérifier si un utilisateur est bloqué
   */
  async isBlocked(blockerId: string, blockedId: string): Promise<{ isBlocked: boolean; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('blocks')
        .select('id')
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { isBlocked: false, error: error.message };
      }

      return { isBlocked: !!data, error: null };
    } catch (err) {
      return { isBlocked: false, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Signaler un utilisateur
   */
  async reportUser(
    reporterId: string,
    reportedId: string,
    reason: ReportReasonId,
    description?: string
  ): Promise<{ report: Report | null; error: string | null }> {
    try {
      const { data: report, error } = await supabase
        .from('reports')
        .insert({
          reporter_id: reporterId,
          reported_id: reportedId,
          reason,
          description: description || null,
        })
        .select()
        .single();

      if (error) {
        return { report: null, error: error.message };
      }

      return {
        report: {
          id: report.id,
          reporterId: report.reporter_id,
          reportedId: report.reported_id,
          reason: report.reason,
          description: report.description,
          status: report.status,
          createdAt: report.created_at,
        },
        error: null,
      };
    } catch (err) {
      return { report: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Récupérer les signalements d'un utilisateur
   */
  async getMyReports(userId: string): Promise<{ reports: Report[]; error: string | null }> {
    try {
      const { data: reports, error } = await supabase
        .from('reports')
        .select('*')
        .eq('reporter_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { reports: [], error: error.message };
      }

      const result: Report[] = (reports || []).map((r) => ({
        id: r.id,
        reporterId: r.reporter_id,
        reportedId: r.reported_id,
        reason: r.reason,
        description: r.description,
        status: r.status,
        createdAt: r.created_at,
      }));

      return { reports: result, error: null };
    } catch (err) {
      return { reports: [], error: 'Une erreur inattendue est survenue' };
    }
  },
};

export default moderationService;
