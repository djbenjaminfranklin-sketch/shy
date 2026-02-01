-- =====================================================
-- MIGRATION COMPLÈTE DU SCHÉMA SHY
-- Exécuter ce script dans Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. TABLE PROFILES (profils utilisateurs)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  birth_date date NOT NULL,
  age integer GENERATED ALWAYS AS (
    EXTRACT(YEAR FROM age(current_date, birth_date))
  ) STORED,
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'non_binary', 'other')),
  hair_color text,
  bio text,
  intention text NOT NULL CHECK (intention IN ('social', 'dating', 'amical', 'local')),
  availability text,
  languages text[] DEFAULT '{}',
  interests text[] DEFAULT '{}',
  photos text[] DEFAULT '{}',

  -- Géolocalisation
  location_enabled boolean DEFAULT false,
  latitude double precision,
  longitude double precision,
  location_updated_at timestamptz,

  -- Filtres de recherche
  search_radius integer DEFAULT 25,
  min_age_filter integer DEFAULT 18,
  max_age_filter integer DEFAULT 99,
  gender_filter text[] DEFAULT '{}',

  -- Score d'engagement (système interne)
  engagement_score integer DEFAULT 50,
  is_new_user boolean DEFAULT true,
  last_active_at timestamptz,
  is_verified boolean DEFAULT false,

  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_intention ON public.profiles(intention);
CREATE INDEX IF NOT EXISTS idx_profiles_engagement ON public.profiles(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(latitude, longitude) WHERE location_enabled = true;

-- RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir tous les profils"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent créer leur propre profil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent supprimer leur propre profil"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- =====================================================
-- 2. TABLE INVITATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'refused', 'expired')),
  sent_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  responded_at timestamptz,
  seen_at timestamptz DEFAULT NULL, -- NULL = non vue, timestamp = vue
  created_at timestamptz DEFAULT now(),

  CONSTRAINT unique_invitation UNIQUE (sender_id, receiver_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_invitations_sender ON public.invitations(sender_id);
CREATE INDEX IF NOT EXISTS idx_invitations_receiver ON public.invitations(receiver_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_unseen ON public.invitations(receiver_id) WHERE status = 'pending' AND seen_at IS NULL;

-- RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs invitations"
  ON public.invitations FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Les utilisateurs peuvent envoyer des invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Les receveurs peuvent mettre à jour les invitations"
  ON public.invitations FOR UPDATE
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- =====================================================
-- 3. TABLE CONNECTIONS (matches acceptés)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitation_id uuid REFERENCES public.invitations(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),

  CONSTRAINT unique_connection UNIQUE (user1_id, user2_id),
  CONSTRAINT ordered_users CHECK (user1_id < user2_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_connections_user1 ON public.connections(user1_id);
CREATE INDEX IF NOT EXISTS idx_connections_user2 ON public.connections(user2_id);

-- RLS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs connections"
  ON public.connections FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Les utilisateurs peuvent créer des connections"
  ON public.connections FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs connections"
  ON public.connections FOR DELETE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- =====================================================
-- 4. TABLE CONVERSATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now(),

  CONSTRAINT unique_conversation UNIQUE (connection_id)
);

-- RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs conversations"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id = connection_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Les utilisateurs peuvent créer des conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id = connection_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

-- =====================================================
-- 5. TABLE MESSAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);

-- RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir les messages de leurs conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations conv
      JOIN public.connections c ON c.id = conv.connection_id
      WHERE conv.id = conversation_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Les utilisateurs peuvent envoyer des messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations conv
      JOIN public.connections c ON c.id = conv.connection_id
      WHERE conv.id = conversation_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Les utilisateurs peuvent marquer les messages comme lus"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations conv
      JOIN public.connections c ON c.id = conv.connection_id
      WHERE conv.id = conversation_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

-- =====================================================
-- 6. TABLE BLOCKS (utilisateurs bloqués)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),

  CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks(blocked_id);

-- RLS
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs blocks"
  ON public.blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Les utilisateurs peuvent créer des blocks"
  ON public.blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs blocks"
  ON public.blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- =====================================================
-- 7. TABLE REPORTS (signalements)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent créer des signalements"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- =====================================================
-- 8. FONCTION: Mise à jour automatique de updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. FONCTION: Mise à jour de last_message_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_timestamp
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- =====================================================
-- 10. FONCTION: Suppression de compte (GDPR)
-- =====================================================

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void AS $$
BEGIN
  -- Supprimer les photos du storage
  DELETE FROM storage.objects
  WHERE bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text;

  -- Le profil sera supprimé par CASCADE, ce qui supprimera:
  -- - invitations
  -- - connections
  -- - conversations
  -- - messages
  -- - blocks
  -- - reports

  -- Supprimer l'utilisateur auth
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. BUCKET STORAGE (photos de profil)
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-photos', 'profile-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Politique: Tout le monde peut voir les photos
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

-- Politique: Les utilisateurs peuvent upload leurs propres photos
CREATE POLICY "Users can upload own photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Politique: Les utilisateurs peuvent supprimer leurs propres photos
CREATE POLICY "Users can delete own photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
