import { supabase } from './client';

export interface PromoCode {
  id: string;
  code: string;
  discountPercent: 10 | 20 | 30 | 40 | 50;
  description: string | null;
  maxUses: number | null;
  currentUses: number;
  validFrom: string;
  validUntil: string | null;
  applicablePlans: string[];
  minDuration: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PromoCodeUse {
  id: string;
  promoCodeId: string;
  userId: string;
  planId: string;
  duration: string;
  originalPrice: number;
  discountedPrice: number;
  usedAt: string;
}

export interface ValidatePromoResult {
  isValid: boolean;
  discountPercent: number;
  errorMessage: string | null;
}

export interface UsePromoResult {
  success: boolean;
  discountedPrice: number;
  errorMessage: string | null;
}

export const promoCodesService = {
  /**
   * Valider un code promo
   */
  async validateCode(
    code: string,
    userId: string,
    planId: string,
    duration: string
  ): Promise<ValidatePromoResult> {
    try {
      const { data, error } = await supabase.rpc('validate_promo_code', {
        p_code: code.toUpperCase(),
        p_user_id: userId,
        p_plan_id: planId,
        p_duration: duration,
      });

      if (error) {
        return {
          isValid: false,
          discountPercent: 0,
          errorMessage: error.message,
        };
      }

      // La fonction retourne un tableau avec un seul élément
      const result = Array.isArray(data) ? data[0] : data;

      return {
        isValid: result?.is_valid || false,
        discountPercent: result?.discount_percent || 0,
        errorMessage: result?.error_message || null,
      };
    } catch (err) {
      return {
        isValid: false,
        discountPercent: 0,
        errorMessage: 'Erreur lors de la validation du code',
      };
    }
  },

  /**
   * Utiliser un code promo
   */
  async useCode(
    code: string,
    userId: string,
    planId: string,
    duration: string,
    originalPrice: number
  ): Promise<UsePromoResult> {
    try {
      const { data, error } = await supabase.rpc('use_promo_code', {
        p_code: code.toUpperCase(),
        p_user_id: userId,
        p_plan_id: planId,
        p_duration: duration,
        p_original_price: originalPrice,
      });

      if (error) {
        return {
          success: false,
          discountedPrice: originalPrice,
          errorMessage: error.message,
        };
      }

      const result = Array.isArray(data) ? data[0] : data;

      return {
        success: result?.success || false,
        discountedPrice: result?.discounted_price || originalPrice,
        errorMessage: result?.error_message || null,
      };
    } catch (err) {
      return {
        success: false,
        discountedPrice: originalPrice,
        errorMessage: 'Erreur lors de l\'utilisation du code',
      };
    }
  },

  /**
   * Récupérer tous les codes promo (admin)
   */
  async getAllCodes(): Promise<{ codes: PromoCode[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { codes: [], error: error.message };
      }

      const codes: PromoCode[] = (data || []).map((code) => ({
        id: code.id,
        code: code.code,
        discountPercent: code.discount_percent,
        description: code.description,
        maxUses: code.max_uses,
        currentUses: code.current_uses,
        validFrom: code.valid_from,
        validUntil: code.valid_until,
        applicablePlans: code.applicable_plans || ['plus', 'premium'],
        minDuration: code.min_duration,
        isActive: code.is_active,
        createdAt: code.created_at,
      }));

      return { codes, error: null };
    } catch (err) {
      return { codes: [], error: 'Erreur lors de la récupération des codes' };
    }
  },

  /**
   * Créer un code promo (admin)
   */
  async createCode(
    code: string,
    discountPercent: 10 | 20 | 30 | 40 | 50,
    options?: {
      description?: string;
      maxUses?: number;
      validFrom?: string;
      validUntil?: string;
      applicablePlans?: string[];
      minDuration?: string;
    }
  ): Promise<{ code: PromoCode | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .insert({
          code: code.toUpperCase(),
          discount_percent: discountPercent,
          description: options?.description || null,
          max_uses: options?.maxUses || null,
          valid_from: options?.validFrom || new Date().toISOString(),
          valid_until: options?.validUntil || null,
          applicable_plans: options?.applicablePlans || ['plus', 'premium'],
          min_duration: options?.minDuration || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { code: null, error: 'Ce code existe déjà' };
        }
        return { code: null, error: error.message };
      }

      return {
        code: {
          id: data.id,
          code: data.code,
          discountPercent: data.discount_percent,
          description: data.description,
          maxUses: data.max_uses,
          currentUses: data.current_uses,
          validFrom: data.valid_from,
          validUntil: data.valid_until,
          applicablePlans: data.applicable_plans || ['plus', 'premium'],
          minDuration: data.min_duration,
          isActive: data.is_active,
          createdAt: data.created_at,
        },
        error: null,
      };
    } catch (err) {
      return { code: null, error: 'Erreur lors de la création du code' };
    }
  },

  /**
   * Activer/Désactiver un code promo (admin)
   */
  async toggleCode(codeId: string, isActive: boolean): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', codeId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Erreur lors de la mise à jour du code' };
    }
  },

  /**
   * Supprimer un code promo (admin)
   */
  async deleteCode(codeId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', codeId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Erreur lors de la suppression du code' };
    }
  },

  /**
   * Générer un code promo unique
   */
  generateCode(prefix: string = 'SHY'): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Pas de I, O, 0, 1 pour éviter confusion
    let code = prefix;
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  /**
   * Récupérer les statistiques d'utilisation d'un code (admin)
   */
  async getCodeStats(codeId: string): Promise<{
    uses: PromoCodeUse[];
    totalSavings: number;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('promo_code_uses')
        .select('*')
        .eq('promo_code_id', codeId)
        .order('used_at', { ascending: false });

      if (error) {
        return { uses: [], totalSavings: 0, error: error.message };
      }

      const uses: PromoCodeUse[] = (data || []).map((use) => ({
        id: use.id,
        promoCodeId: use.promo_code_id,
        userId: use.user_id,
        planId: use.plan_id,
        duration: use.duration,
        originalPrice: parseFloat(use.original_price),
        discountedPrice: parseFloat(use.discounted_price),
        usedAt: use.used_at,
      }));

      const totalSavings = uses.reduce(
        (sum, use) => sum + (use.originalPrice - use.discountedPrice),
        0
      );

      return { uses, totalSavings, error: null };
    } catch (err) {
      return { uses: [], totalSavings: 0, error: 'Erreur lors de la récupération des statistiques' };
    }
  },
};

export default promoCodesService;
