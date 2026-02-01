import { supabase } from './client';
import type {
  ComfortLevelType,
  ConversationComfortState,
  ComfortLevelUpdateResult,
} from '../../types/comfortLevel';
import { getUnlockedLevel, DEFAULT_COMFORT_LEVEL } from '../../constants/comfortLevels';

export const comfortLevelsService = {
  /**
   * Récupérer l'état du niveau de confort pour une conversation
   */
  async getComfortState(
    conversationId: string,
    currentUserId: string
  ): Promise<{ state: ConversationComfortState | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('comfort_levels')
        .select('*')
        .eq('conversation_id', conversationId);

      if (error) {
        console.error('[comfortLevelsService.getComfortState] Error:', error);
        return { state: null, error: error.message };
      }

      // Trouver les niveaux des deux utilisateurs
      const currentUserLevel = data?.find(d => d.user_id === currentUserId);
      const otherUserLevel = data?.find(d => d.user_id !== currentUserId);

      const user1Level = (currentUserLevel?.level || DEFAULT_COMFORT_LEVEL) as ComfortLevelType;
      const user2Level = (otherUserLevel?.level || DEFAULT_COMFORT_LEVEL) as ComfortLevelType;
      const unlockedLevel = getUnlockedLevel(user1Level, user2Level);

      const state: ConversationComfortState = {
        conversationId,
        user1Level,
        user2Level,
        unlockedLevel,
        isMutual: user1Level === user2Level,
        otherUserHigher: user2Level !== user1Level &&
          ['flirting', 'open_to_meet'].indexOf(user2Level) > ['chatting', 'flirting', 'open_to_meet'].indexOf(user1Level),
      };

      return { state, error: null };
    } catch (err) {
      console.error('[comfortLevelsService.getComfortState] Unexpected error:', err);
      return { state: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Mettre à jour le niveau de confort de l'utilisateur
   */
  async updateComfortLevel(
    conversationId: string,
    userId: string,
    newLevel: ComfortLevelType
  ): Promise<ComfortLevelUpdateResult> {
    try {
      // Upsert le niveau de l'utilisateur
      const { error: upsertError } = await supabase
        .from('comfort_levels')
        .upsert(
          {
            conversation_id: conversationId,
            user_id: userId,
            level: newLevel,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'conversation_id,user_id' }
        );

      if (upsertError) {
        console.error('[comfortLevelsService.updateComfortLevel] Error:', upsertError);
        return {
          success: false,
          newLevel,
          unlockedLevel: DEFAULT_COMFORT_LEVEL,
          isMutual: false,
          error: upsertError.message,
        };
      }

      // Récupérer l'état mis à jour
      const { state } = await this.getComfortState(conversationId, userId);

      return {
        success: true,
        newLevel,
        unlockedLevel: state?.unlockedLevel || DEFAULT_COMFORT_LEVEL,
        isMutual: state?.isMutual || false,
      };
    } catch (err) {
      console.error('[comfortLevelsService.updateComfortLevel] Unexpected error:', err);
      return {
        success: false,
        newLevel,
        unlockedLevel: DEFAULT_COMFORT_LEVEL,
        isMutual: false,
        error: 'Une erreur inattendue est survenue',
      };
    }
  },

  /**
   * Réinitialiser le niveau de confort (rollback de sécurité)
   */
  async resetToDefault(
    conversationId: string,
    userId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('comfort_levels')
        .upsert(
          {
            conversation_id: conversationId,
            user_id: userId,
            level: DEFAULT_COMFORT_LEVEL,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'conversation_id,user_id' }
        );

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * S'abonner aux changements de niveau de confort
   */
  subscribeToComfortChanges(
    conversationId: string,
    currentUserId: string,
    onUpdate: (state: ConversationComfortState) => void
  ) {
    const subscription = supabase
      .channel(`comfort-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comfort_levels',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async () => {
          // Recharger l'état complet
          const { state } = await this.getComfortState(conversationId, currentUserId);
          if (state) {
            onUpdate(state);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },
};

export default comfortLevelsService;
