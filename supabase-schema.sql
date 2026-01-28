-- =====================================================
-- SCHEMA SQL POUR SUPABASE - APP SHY
-- =====================================================

-- Extension pour les UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('homme', 'femme', 'non-binaire', 'autre')),
  hair_color TEXT,
  bio TEXT,
  intention TEXT NOT NULL CHECK (intention IN ('social', 'dating', 'amical', 'local')),
  availability TEXT CHECK (availability IN ('aujourdhui', 'apres-midi', 'ce-soir', 'weekend', NULL)),
  languages TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',

  -- Verification d'identite (selfie video)
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,

  -- Geolocalisation
  location_enabled BOOLEAN DEFAULT FALSE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_updated_at TIMESTAMPTZ,

  -- Filtres de recherche (rayon max 100km)
  search_radius INTEGER DEFAULT 25 CHECK (search_radius IN (5, 10, 25, 50, 100)),
  min_age_filter INTEGER DEFAULT 18,
  max_age_filter INTEGER DEFAULT 99,
  gender_filter TEXT[] DEFAULT '{}',

  -- Metadonnees
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: invitations (remplace likes)
-- Règles:
-- - Hommes: 40 invitations/jour max
-- - Femmes: illimité
-- - Expiration après 7 jours si pas de réponse
-- - Statuts: pending → accepted/refused/expired
-- =====================================================
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'refused', 'expired')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  responded_at TIMESTAMPTZ,
  UNIQUE(sender_id, receiver_id)
);

-- =====================================================
-- TABLE: connections (anciennement matches)
-- Une connexion est créée quand une invitation est acceptée
-- =====================================================
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id)
);

-- =====================================================
-- TABLE: conversations
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: messages
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: blocks
-- =====================================================
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- =====================================================
-- TABLE: reports (signalements)
-- =====================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'fake_profile', 'harassment', 'inappropriate_content',
    'spam', 'underage', 'solicitation', 'other'
  )),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'reviewed', 'resolved', 'dismissed'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: account_deletions (GDPR)
-- =====================================================
CREATE TABLE IF NOT EXISTS account_deletions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  email_hash TEXT NOT NULL,
  reason TEXT,
  deleted_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: user_subscriptions (Abonnements)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('free', 'silver', 'gold', 'platinum')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'trial')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT TRUE,
  payment_provider TEXT,
  payment_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: user_daily_limits (Limites quotidiennes)
-- invitations_sent: compteur d'invitations envoyées (40/jour pour hommes)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_daily_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  invitations_sent INTEGER DEFAULT 0,
  messages_used INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

-- =====================================================
-- TABLE: user_auto_reply (Reponses automatiques)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_auto_reply (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT FALSE,
  template_id TEXT,
  custom_message TEXT,
  active_hours_only BOOLEAN DEFAULT FALSE,
  start_hour INTEGER DEFAULT 22 CHECK (start_hour >= 0 AND start_hour <= 23),
  end_hour INTEGER DEFAULT 8 CHECK (end_hour >= 0 AND end_hour <= 23),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: push_tokens (Notifications Push)
-- =====================================================
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEX pour performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude) WHERE location_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_intention ON profiles(intention);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);

-- Index pour invitations
CREATE INDEX IF NOT EXISTS idx_invitations_sender ON invitations(sender_id);
CREATE INDEX IF NOT EXISTS idx_invitations_receiver ON invitations(receiver_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_invitations_sender_status ON invitations(sender_id, status);
CREATE INDEX IF NOT EXISTS idx_invitations_receiver_status ON invitations(receiver_id, status);

-- Index pour connections
CREATE INDEX IF NOT EXISTS idx_connections_users ON connections(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_connections_invitation ON connections(invitation_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_limits_user_date ON user_daily_limits(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_auto_reply_user_id ON user_auto_reply(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_auto_reply ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: profiles
-- =====================================================
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- =====================================================
-- POLICIES: invitations
-- =====================================================
-- Voir ses invitations envoyées ou reçues
CREATE POLICY "Users can view own invitations" ON invitations FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Créer une invitation (seulement en tant qu'expéditeur)
CREATE POLICY "Users can send invitations" ON invitations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Mettre à jour une invitation (répondre à une invitation reçue)
CREATE POLICY "Users can respond to received invitations" ON invitations FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id AND status = 'pending');

-- =====================================================
-- POLICIES: connections
-- =====================================================
CREATE POLICY "Users can view own connections" ON connections FOR SELECT TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Authenticated users can create connections" ON connections FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can delete own connections" ON connections FOR DELETE TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- =====================================================
-- POLICIES: conversations
-- =====================================================
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM connections WHERE connections.id = conversations.connection_id AND (connections.user1_id = auth.uid() OR connections.user2_id = auth.uid())));

CREATE POLICY "Authenticated users can create conversations" ON conversations FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM connections WHERE connections.id = connection_id AND (connections.user1_id = auth.uid() OR connections.user2_id = auth.uid())));

CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM connections WHERE connections.id = conversations.connection_id AND (connections.user1_id = auth.uid() OR connections.user2_id = auth.uid())));

-- =====================================================
-- POLICIES: messages
-- =====================================================
CREATE POLICY "Users can view messages in own conversations" ON messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM conversations JOIN connections ON connections.id = conversations.connection_id WHERE conversations.id = messages.conversation_id AND (connections.user1_id = auth.uid() OR connections.user2_id = auth.uid())));

CREATE POLICY "Users can send messages" ON messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM conversations JOIN connections ON connections.id = conversations.connection_id WHERE conversations.id = conversation_id AND (connections.user1_id = auth.uid() OR connections.user2_id = auth.uid())));

CREATE POLICY "Users can mark messages as read" ON messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM conversations JOIN connections ON connections.id = conversations.connection_id WHERE conversations.id = messages.conversation_id AND (connections.user1_id = auth.uid() OR connections.user2_id = auth.uid())));

-- =====================================================
-- POLICIES: blocks
-- =====================================================
CREATE POLICY "Users can view own blocks" ON blocks FOR SELECT TO authenticated USING (auth.uid() = blocker_id);
CREATE POLICY "Users can create blocks" ON blocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can delete own blocks" ON blocks FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

-- =====================================================
-- POLICIES: reports
-- =====================================================
CREATE POLICY "Users can view own reports" ON reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
CREATE POLICY "Users can create reports" ON reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- =====================================================
-- POLICIES: user_subscriptions
-- =====================================================
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create subscriptions" ON user_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- POLICIES: user_daily_limits
-- =====================================================
CREATE POLICY "Users can view own daily limits" ON user_daily_limits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own daily limits" ON user_daily_limits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily limits" ON user_daily_limits FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- =====================================================
-- POLICIES: user_auto_reply
-- =====================================================
CREATE POLICY "Users can view own auto reply" ON user_auto_reply FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own auto reply" ON user_auto_reply FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own auto reply" ON user_auto_reply FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- =====================================================
-- POLICIES: push_tokens
-- =====================================================
CREATE POLICY "Users can view own push token" ON push_tokens FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own push token" ON push_tokens FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own push token" ON push_tokens FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own push token" ON push_tokens FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGER: Mettre a jour updated_at automatiquement
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_auto_reply_updated_at BEFORE UPDATE ON user_auto_reply FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FONCTION: Expirer automatiquement les invitations
-- =====================================================
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FONCTION: Créer une connexion après acceptation
-- =====================================================
CREATE OR REPLACE FUNCTION create_connection_on_accept()
RETURNS TRIGGER AS $$
DECLARE
  v_user1 UUID;
  v_user2 UUID;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- S'assurer que user1_id < user2_id pour la contrainte UNIQUE
    IF NEW.sender_id < NEW.receiver_id THEN
      v_user1 := NEW.sender_id;
      v_user2 := NEW.receiver_id;
    ELSE
      v_user1 := NEW.receiver_id;
      v_user2 := NEW.sender_id;
    END IF;

    -- Créer la connexion
    INSERT INTO connections (user1_id, user2_id, invitation_id)
    VALUES (v_user1, v_user2, NEW.id)
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_connection_on_accept
  AFTER UPDATE ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION create_connection_on_accept();

-- =====================================================
-- REALTIME: Activer pour les messages, invitations et connections
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE invitations;
ALTER PUBLICATION supabase_realtime ADD TABLE connections;

-- =====================================================
-- FIN DU SCHEMA
-- =====================================================
