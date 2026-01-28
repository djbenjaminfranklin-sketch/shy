import { supabase } from './client';
import type { User } from '@supabase/supabase-js';

export interface AuthError {
  message: string;
  code?: string;
}

export interface SignUpData {
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authService = {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async signUp({ email, password }: SignUpData): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.code } };
      }

      return { user: data.user, error: null };
    } catch (err) {
      return { user: null, error: { message: 'Une erreur inattendue est survenue' } };
    }
  },

  /**
   * Connexion d'un utilisateur existant
   */
  async signIn({ email, password }: SignInData): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let message = error.message;
        if (error.message === 'Invalid login credentials') {
          message = 'Email ou mot de passe incorrect';
        }
        return { user: null, error: { message, code: error.code } };
      }

      return { user: data.user, error: null };
    } catch (err) {
      return { user: null, error: { message: 'Une erreur inattendue est survenue' } };
    }
  },

  /**
   * Déconnexion
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: { message: error.message, code: error.code } };
      }
      return { error: null };
    } catch (err) {
      return { error: { message: 'Une erreur inattendue est survenue' } };
    }
  },

  /**
   * Réinitialisation du mot de passe
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'shy://reset-password',
      });

      if (error) {
        return { error: { message: error.message, code: error.code } };
      }

      return { error: null };
    } catch (err) {
      return { error: { message: 'Une erreur inattendue est survenue' } };
    }
  },

  /**
   * Récupérer la session courante
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  },

  /**
   * Récupérer l'utilisateur courant
   */
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    return { user: data.user, error };
  },

  /**
   * Écouter les changements d'état d'authentification
   */
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  /**
   * Supprimer le compte utilisateur
   */
  async deleteAccount(): Promise<{ error: AuthError | null }> {
    try {
      // Appeler une fonction Supabase Edge pour supprimer le compte
      // car la suppression directe n'est pas possible côté client
      const { error } = await supabase.rpc('delete_user_account');

      if (error) {
        return { error: { message: error.message, code: error.code } };
      }

      // Se déconnecter après suppression
      await supabase.auth.signOut();

      return { error: null };
    } catch (err) {
      return { error: { message: 'Une erreur inattendue est survenue' } };
    }
  },
};

export default authService;
