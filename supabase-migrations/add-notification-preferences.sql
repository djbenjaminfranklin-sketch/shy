-- Migration: Ajouter les préférences de notification à la table profiles
-- Date: 2026-01-28
-- Description: Ajoute les colonnes pour gérer les préférences de notification des utilisateurs

-- Ajouter les préférences de notification
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notification_invitations BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_messages BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_sound BOOLEAN DEFAULT true;

-- Commentaires pour la documentation
COMMENT ON COLUMN public.profiles.notification_invitations IS 'Activer/désactiver les notifications pour les nouvelles invitations';
COMMENT ON COLUMN public.profiles.notification_messages IS 'Activer/désactiver les notifications pour les nouveaux messages';
COMMENT ON COLUMN public.profiles.notification_sound IS 'Activer/désactiver le son des notifications';
