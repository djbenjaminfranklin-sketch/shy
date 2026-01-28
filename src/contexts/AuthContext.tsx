import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { authService } from '../services/supabase/auth';
import { profilesService } from '../services/supabase/profiles';
import { supabase } from '../services/supabase/client';
import type { Profile } from '../types/profile';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null; hasCompletedOnboarding: boolean }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  deleteAccount: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    hasCompletedOnboarding: false,
  });

  // Charger le profil utilisateur
  const loadProfile = useCallback(async (userId: string) => {
    const { profile } = await profilesService.getProfile(userId);
    return profile;
  }, []);

  // Enregistrer le push token si disponible
  const registerPushToken = useCallback(async (userId: string) => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      // Sauvegarder le token dans le profil
      await supabase
        .from('profiles')
        .update({ push_token: token.data })
        .eq('id', userId);

      console.log('Push token registered:', token.data);
    } catch (error) {
      console.log('Error registering push token:', error);
    }
  }, []);

  // Initialiser l'état d'authentification
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { session } = await authService.getSession();

        if (session?.user) {
          const profile = await loadProfile(session.user.id);

          setState({
            user: session.user,
            profile,
            session,
            isLoading: false,
            isAuthenticated: true,
            hasCompletedOnboarding: !!profile?.intention,
          });

          // Enregistrer le push token après le chargement du profil
          await registerPushToken(session.user.id);
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    };

    initAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const typedSession = session as Session;
        const profile = await loadProfile(typedSession.user.id);

        setState({
          user: typedSession.user,
          profile,
          session: typedSession,
          isLoading: false,
          isAuthenticated: true,
          hasCompletedOnboarding: !!profile?.intention,
        });

        // Enregistrer le push token après connexion
        await registerPushToken(typedSession.user.id);
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          profile: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
          hasCompletedOnboarding: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile, registerPushToken]);

  // Connexion
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      console.log('[AuthContext] signIn: Attempting login...');
      const { user, error } = await authService.signIn({ email, password });

      if (error) {
        console.log('[AuthContext] signIn: Auth error:', error.message);
        return { error: error.message, hasCompletedOnboarding: false };
      }

      if (user) {
        console.log('[AuthContext] signIn: User authenticated, loading profile...');
        const profile = await loadProfile(user.id);
        const completed = !!profile?.intention;
        console.log('[AuthContext] signIn: Profile loaded, hasCompletedOnboarding:', completed);

        setState((prev) => ({
          ...prev,
          user,
          profile,
          isAuthenticated: true,
          hasCompletedOnboarding: completed,
        }));

        return { error: null, hasCompletedOnboarding: completed };
      }

      console.log('[AuthContext] signIn: No user returned');
      return { error: null, hasCompletedOnboarding: false };
    } catch (err) {
      console.error('[AuthContext] signIn: Unexpected error:', err);
      return { error: 'Une erreur inattendue est survenue', hasCompletedOnboarding: false };
    }
  }, [loadProfile]);

  // Inscription
  const signUp = useCallback(async (email: string, password: string) => {
    const { user, error } = await authService.signUp({ email, password });

    if (error) {
      return { error: error.message };
    }

    if (user) {
      // Vérifier qu'on a une session valide
      const { session } = await authService.getSession();

      if (!session) {
        // Pas de session = confirmation email probablement requise
        console.log('[AuthContext] signUp: User created but no session (email confirmation may be required)');
      } else {
        console.log('[AuthContext] signUp: User created with valid session');
      }

      // On met isAuthenticated à true si on a un user, même sans session
      // La vérification de session sera faite au moment de créer le profil
      setState((prev) => ({
        ...prev,
        user,
        session: session || null,
        isAuthenticated: true,
        hasCompletedOnboarding: false,
      }));
    }

    return { error: null };
  }, []);

  // Déconnexion
  const signOut = useCallback(async () => {
    await authService.signOut();

    setState({
      user: null,
      profile: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
    });
  }, []);

  // Réinitialisation du mot de passe
  const resetPassword = useCallback(async (email: string) => {
    const { error } = await authService.resetPassword(email);
    return { error: error?.message || null };
  }, []);

  // Rafraîchir le profil
  const refreshProfile = useCallback(async () => {
    if (!state.user) return;

    const profile = await loadProfile(state.user.id);

    setState((prev) => ({
      ...prev,
      profile,
      hasCompletedOnboarding: !!profile?.intention,
    }));
  }, [state.user, loadProfile]);

  // Supprimer le compte
  const deleteAccount = useCallback(async () => {
    const { error } = await authService.deleteAccount();

    if (!error) {
      setState({
        user: null,
        profile: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        hasCompletedOnboarding: false,
      });
    }

    return { error: error?.message || null };
  }, []);

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshProfile,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default AuthContext;
