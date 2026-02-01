-- Migration: Ajouter le push token à la table profiles
-- Date: 2026-01-28

-- Ajouter la colonne push_token
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Index pour rechercher par push_token si nécessaire
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON public.profiles(push_token) WHERE push_token IS NOT NULL;

COMMENT ON COLUMN public.profiles.push_token IS 'Expo Push Token pour les notifications push';
