-- =====================================================
-- FONCTIONS RPC POUR LES LIMITES QUOTIDIENNES
-- =====================================================

-- Fonction pour incrémenter les invitations envoyées
CREATE OR REPLACE FUNCTION increment_daily_likes(p_user_id UUID, p_date DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO user_daily_limits (user_id, date, invitations_sent, messages_used)
  VALUES (p_user_id, p_date, 1, 0)
  ON CONFLICT (user_id, date)
  DO UPDATE SET invitations_sent = user_daily_limits.invitations_sent + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour incrémenter les messages envoyés
CREATE OR REPLACE FUNCTION increment_daily_messages(p_user_id UUID, p_date DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO user_daily_limits (user_id, date, invitations_sent, messages_used)
  VALUES (p_user_id, p_date, 0, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET messages_used = user_daily_limits.messages_used + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TABLE user_daily_limits (si elle n'existe pas)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_daily_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  invitations_sent INTEGER DEFAULT 0,
  messages_used INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_daily_limits_user_date ON user_daily_limits(user_id, date);

-- RLS
ALTER TABLE user_daily_limits ENABLE ROW LEVEL SECURITY;

-- Policies (DROP IF EXISTS pour éviter les erreurs)
DROP POLICY IF EXISTS "Users can view own daily limits" ON user_daily_limits;
DROP POLICY IF EXISTS "Users can create own daily limits" ON user_daily_limits;
DROP POLICY IF EXISTS "Users can update own daily limits" ON user_daily_limits;

CREATE POLICY "Users can view own daily limits" ON user_daily_limits
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own daily limits" ON user_daily_limits
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily limits" ON user_daily_limits
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
