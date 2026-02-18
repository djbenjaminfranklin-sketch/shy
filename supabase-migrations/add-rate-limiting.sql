-- Rate Limiting côté serveur pour messages et invitations
-- Migration: add-rate-limiting.sql

-- Table pour tracker les actions rate-limitées
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'message', 'invitation', 'icebreaker'
  action_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rate_limits_user_action_idx UNIQUE (user_id, action_type, action_timestamp)
);

-- Index pour les requêtes de rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON rate_limits(user_id, action_type, action_timestamp DESC);

-- Fonction pour vérifier le rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_action_type TEXT,
  p_max_per_minute INTEGER DEFAULT 5,
  p_max_per_hour INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
  v_count_minute INTEGER;
  v_count_hour INTEGER;
  v_oldest_minute TIMESTAMPTZ;
  v_oldest_hour TIMESTAMPTZ;
  v_wait_time INTEGER;
BEGIN
  -- Compter les actions dans la dernière minute
  SELECT COUNT(*), MIN(action_timestamp)
  INTO v_count_minute, v_oldest_minute
  FROM rate_limits
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND action_timestamp > NOW() - INTERVAL '1 minute';

  -- Vérifier la limite par minute
  IF v_count_minute >= p_max_per_minute THEN
    v_wait_time := EXTRACT(EPOCH FROM (v_oldest_minute + INTERVAL '1 minute' - NOW()))::INTEGER;
    RETURN json_build_object(
      'allowed', false,
      'reason', 'minute_limit',
      'wait_seconds', GREATEST(v_wait_time, 1)
    );
  END IF;

  -- Compter les actions dans la dernière heure
  SELECT COUNT(*), MIN(action_timestamp)
  INTO v_count_hour, v_oldest_hour
  FROM rate_limits
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND action_timestamp > NOW() - INTERVAL '1 hour';

  -- Vérifier la limite par heure
  IF v_count_hour >= p_max_per_hour THEN
    v_wait_time := EXTRACT(EPOCH FROM (v_oldest_hour + INTERVAL '1 hour' - NOW()))::INTEGER;
    RETURN json_build_object(
      'allowed', false,
      'reason', 'hour_limit',
      'wait_seconds', GREATEST(v_wait_time, 1)
    );
  END IF;

  -- Enregistrer l'action
  INSERT INTO rate_limits (user_id, action_type)
  VALUES (p_user_id, p_action_type);

  -- Nettoyer les anciennes entrées (plus de 1 heure)
  DELETE FROM rate_limits
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND action_timestamp < NOW() - INTERVAL '1 hour';

  RETURN json_build_object('allowed', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour envoyer un message avec rate limiting
CREATE OR REPLACE FUNCTION send_message_rate_limited(
  p_conversation_id UUID,
  p_sender_id UUID,
  p_content TEXT
)
RETURNS JSON AS $$
DECLARE
  v_rate_check JSON;
  v_message_id UUID;
BEGIN
  -- Vérifier le rate limit (5/minute, 30/heure)
  v_rate_check := check_rate_limit(p_sender_id, 'message', 5, 30);

  IF NOT (v_rate_check->>'allowed')::BOOLEAN THEN
    RETURN json_build_object(
      'success', false,
      'error', 'rate_limited',
      'wait_seconds', (v_rate_check->>'wait_seconds')::INTEGER
    );
  END IF;

  -- Vérifier que la conversation existe
  IF NOT EXISTS (SELECT 1 FROM conversations WHERE id = p_conversation_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'conversation_not_found'
    );
  END IF;

  -- Insérer le message
  INSERT INTO messages (conversation_id, sender_id, content)
  VALUES (p_conversation_id, p_sender_id, p_content)
  RETURNING id INTO v_message_id;

  -- Mettre à jour last_message_at
  UPDATE conversations
  SET last_message_at = NOW()
  WHERE id = p_conversation_id;

  RETURN json_build_object(
    'success', true,
    'message_id', v_message_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour envoyer une invitation avec rate limiting
CREATE OR REPLACE FUNCTION send_invitation_rate_limited(
  p_sender_id UUID,
  p_receiver_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_rate_check JSON;
  v_invitation_id UUID;
BEGIN
  -- Vérifier le rate limit (10/minute, 50/heure pour invitations)
  v_rate_check := check_rate_limit(p_sender_id, 'invitation', 10, 50);

  IF NOT (v_rate_check->>'allowed')::BOOLEAN THEN
    RETURN json_build_object(
      'success', false,
      'error', 'rate_limited',
      'wait_seconds', (v_rate_check->>'wait_seconds')::INTEGER
    );
  END IF;

  -- Vérifier que l'utilisateur n'a pas déjà envoyé d'invitation
  IF EXISTS (
    SELECT 1 FROM invitations
    WHERE sender_id = p_sender_id AND receiver_id = p_receiver_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'invitation_already_sent'
    );
  END IF;

  -- Vérifier que l'utilisateur n'est pas bloqué
  IF EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocker_id = p_receiver_id AND blocked_id = p_sender_id)
       OR (blocker_id = p_sender_id AND blocked_id = p_receiver_id)
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'user_blocked'
    );
  END IF;

  -- Insérer l'invitation
  INSERT INTO invitations (sender_id, receiver_id, status)
  VALUES (p_sender_id, p_receiver_id, 'pending')
  RETURNING id INTO v_invitation_id;

  RETURN json_build_object(
    'success', true,
    'invitation_id', v_invitation_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION send_message_rate_limited TO authenticated;
GRANT EXECUTE ON FUNCTION send_invitation_rate_limited TO authenticated;

-- RLS pour rate_limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Seul l'utilisateur peut voir ses propres rate limits
CREATE POLICY "Users can view own rate limits" ON rate_limits
  FOR SELECT USING (auth.uid() = user_id);

-- Les insertions sont gérées par les fonctions SECURITY DEFINER
CREATE POLICY "Rate limits managed by functions" ON rate_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Rate limits cleanup" ON rate_limits
  FOR DELETE USING (auth.uid() = user_id);
