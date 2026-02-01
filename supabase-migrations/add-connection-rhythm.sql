-- =============================================
-- Migration: Rythme de Connexion (Connection Rhythm)
-- Système de score de compatibilité basé sur les patterns d'interaction
-- =============================================

-- Table des statistiques d'interaction par conversation
CREATE TABLE IF NOT EXISTS public.interaction_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Métriques de base
  total_messages integer DEFAULT 0,
  avg_response_time_seconds integer DEFAULT NULL, -- Temps moyen de réponse en secondes
  avg_message_length integer DEFAULT NULL, -- Longueur moyenne des messages
  messages_per_day numeric(5,2) DEFAULT 0, -- Fréquence quotidienne

  -- Fenêtres d'activité (tableau de 24 booléens pour chaque heure)
  active_hours integer[] DEFAULT ARRAY[]::integer[], -- Heures où l'utilisateur est actif (0-23)

  -- Période d'analyse
  first_message_at timestamptz,
  last_message_at timestamptz,
  analysis_window_days integer DEFAULT 14,

  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_user_conversation UNIQUE (conversation_id, user_id)
);

-- Table des scores de compatibilité
CREATE TABLE IF NOT EXISTS public.connection_rhythm_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,

  -- Scores par composante (0-100)
  rhythm_score integer DEFAULT 0, -- Similarité des temps de réponse
  availability_score integer DEFAULT 0, -- Chevauchement des heures actives
  engagement_score integer DEFAULT 0, -- Similarité de longueur de messages
  regularity_score integer DEFAULT 0, -- Fréquence d'interaction similaire

  -- Score final pondéré
  total_score integer DEFAULT 0,

  -- Tendance
  previous_score integer DEFAULT NULL,
  trend text DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),

  -- Validité
  is_valid boolean DEFAULT false, -- False si pas assez de données
  min_messages_required integer DEFAULT 5,
  current_message_count integer DEFAULT 0,

  -- Timestamps
  calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_conversation_score UNIQUE (conversation_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_interaction_stats_conversation
  ON public.interaction_stats(conversation_id);

CREATE INDEX IF NOT EXISTS idx_interaction_stats_user
  ON public.interaction_stats(user_id);

CREATE INDEX IF NOT EXISTS idx_connection_rhythm_conversation
  ON public.connection_rhythm_scores(conversation_id);

CREATE INDEX IF NOT EXISTS idx_connection_rhythm_valid
  ON public.connection_rhythm_scores(is_valid, total_score);

-- RLS
ALTER TABLE public.interaction_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_rhythm_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read stats for their conversations
CREATE POLICY "Users can read own interaction stats"
  ON public.interaction_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

-- Policy: System can insert/update stats (via functions)
CREATE POLICY "System can manage interaction stats"
  ON public.interaction_stats FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policy: Users can read scores for their conversations
CREATE POLICY "Users can read own rhythm scores"
  ON public.connection_rhythm_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

-- Policy: System can manage scores
CREATE POLICY "System can manage rhythm scores"
  ON public.connection_rhythm_scores FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================
-- Functions
-- =============================================

-- Function: Update interaction stats after a message
CREATE OR REPLACE FUNCTION public.update_interaction_stats(
  p_conversation_id uuid,
  p_user_id uuid,
  p_message_length integer,
  p_sent_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_previous_message_at timestamptz;
  v_response_time_seconds integer;
  v_current_hour integer;
  v_existing_stats record;
BEGIN
  -- Get current hour (0-23)
  v_current_hour := EXTRACT(HOUR FROM p_sent_at);

  -- Get previous message timestamp from the OTHER user
  SELECT sent_at INTO v_previous_message_at
  FROM public.messages
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND sent_at < p_sent_at
  ORDER BY sent_at DESC
  LIMIT 1;

  -- Calculate response time if there was a previous message
  IF v_previous_message_at IS NOT NULL THEN
    v_response_time_seconds := EXTRACT(EPOCH FROM (p_sent_at - v_previous_message_at))::integer;
    -- Cap at 24 hours to avoid skewing from long gaps
    IF v_response_time_seconds > 86400 THEN
      v_response_time_seconds := NULL;
    END IF;
  END IF;

  -- Get existing stats
  SELECT * INTO v_existing_stats
  FROM public.interaction_stats
  WHERE conversation_id = p_conversation_id AND user_id = p_user_id;

  IF v_existing_stats IS NULL THEN
    -- Insert new stats
    INSERT INTO public.interaction_stats (
      conversation_id, user_id, total_messages,
      avg_response_time_seconds, avg_message_length,
      active_hours, first_message_at, last_message_at
    )
    VALUES (
      p_conversation_id, p_user_id, 1,
      v_response_time_seconds, p_message_length,
      ARRAY[v_current_hour], p_sent_at, p_sent_at
    );
  ELSE
    -- Update existing stats with running averages
    UPDATE public.interaction_stats
    SET
      total_messages = total_messages + 1,
      avg_response_time_seconds = CASE
        WHEN v_response_time_seconds IS NOT NULL THEN
          COALESCE(
            (COALESCE(avg_response_time_seconds, v_response_time_seconds) * (total_messages - 1) + v_response_time_seconds) / total_messages,
            v_response_time_seconds
          )
        ELSE avg_response_time_seconds
      END,
      avg_message_length = (COALESCE(avg_message_length, p_message_length) * (total_messages - 1) + p_message_length) / total_messages,
      active_hours = CASE
        WHEN NOT (v_current_hour = ANY(active_hours))
        THEN array_append(active_hours, v_current_hour)
        ELSE active_hours
      END,
      last_message_at = p_sent_at,
      updated_at = now()
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id;
  END IF;

  -- Update messages per day
  UPDATE public.interaction_stats
  SET messages_per_day = CASE
    WHEN last_message_at > first_message_at THEN
      total_messages::numeric / GREATEST(1, EXTRACT(DAY FROM (last_message_at - first_message_at)))
    ELSE total_messages::numeric
  END
  WHERE conversation_id = p_conversation_id AND user_id = p_user_id;
END;
$$;

-- Function: Calculate rhythm score between two users
CREATE OR REPLACE FUNCTION public.calculate_connection_rhythm(
  p_conversation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats_a record;
  v_stats_b record;
  v_rhythm_score integer;
  v_availability_score integer;
  v_engagement_score integer;
  v_regularity_score integer;
  v_total_score integer;
  v_total_messages integer;
  v_is_valid boolean;
  v_previous_score integer;
  v_trend text;
  v_overlap_hours integer;
  v_diff_ratio numeric;
BEGIN
  -- Get stats for both users
  SELECT * INTO v_stats_a
  FROM public.interaction_stats
  WHERE conversation_id = p_conversation_id
  ORDER BY user_id
  LIMIT 1;

  SELECT * INTO v_stats_b
  FROM public.interaction_stats
  WHERE conversation_id = p_conversation_id
  ORDER BY user_id DESC
  LIMIT 1;

  -- Check if we have enough data
  v_total_messages := COALESCE(v_stats_a.total_messages, 0) + COALESCE(v_stats_b.total_messages, 0);
  v_is_valid := v_total_messages >= 5 AND v_stats_a IS NOT NULL AND v_stats_b IS NOT NULL;

  IF NOT v_is_valid THEN
    -- Update with invalid score
    INSERT INTO public.connection_rhythm_scores (
      conversation_id, is_valid, current_message_count
    )
    VALUES (p_conversation_id, false, v_total_messages)
    ON CONFLICT (conversation_id) DO UPDATE
    SET
      is_valid = false,
      current_message_count = v_total_messages,
      updated_at = now();

    RETURN jsonb_build_object(
      'is_valid', false,
      'current_message_count', v_total_messages,
      'min_messages_required', 5
    );
  END IF;

  -- Calculate Rhythm Score (response time similarity)
  IF v_stats_a.avg_response_time_seconds IS NOT NULL AND v_stats_b.avg_response_time_seconds IS NOT NULL THEN
    v_diff_ratio := ABS(v_stats_a.avg_response_time_seconds - v_stats_b.avg_response_time_seconds)::numeric
                    / GREATEST(v_stats_a.avg_response_time_seconds, v_stats_b.avg_response_time_seconds, 1);
    v_rhythm_score := GREATEST(0, LEAST(100, (100 * (1 - v_diff_ratio))::integer));
  ELSE
    v_rhythm_score := 50; -- Default if no response time data
  END IF;

  -- Calculate Availability Score (active hours overlap)
  SELECT COUNT(*) INTO v_overlap_hours
  FROM unnest(v_stats_a.active_hours) AS a_hour
  WHERE a_hour = ANY(v_stats_b.active_hours);

  v_availability_score := LEAST(100, (v_overlap_hours * 100 / GREATEST(1,
    GREATEST(array_length(v_stats_a.active_hours, 1), array_length(v_stats_b.active_hours, 1))
  ))::integer);

  -- Calculate Engagement Score (message length similarity)
  IF v_stats_a.avg_message_length IS NOT NULL AND v_stats_b.avg_message_length IS NOT NULL THEN
    v_engagement_score := (100 * LEAST(v_stats_a.avg_message_length, v_stats_b.avg_message_length)::numeric
                          / GREATEST(v_stats_a.avg_message_length, v_stats_b.avg_message_length, 1))::integer;
  ELSE
    v_engagement_score := 50;
  END IF;

  -- Calculate Regularity Score (frequency similarity)
  IF v_stats_a.messages_per_day > 0 AND v_stats_b.messages_per_day > 0 THEN
    v_regularity_score := (100 * LEAST(v_stats_a.messages_per_day, v_stats_b.messages_per_day)
                          / GREATEST(v_stats_a.messages_per_day, v_stats_b.messages_per_day, 0.1))::integer;
  ELSE
    v_regularity_score := 50;
  END IF;

  -- Calculate weighted total (30% rhythm, 25% availability, 25% engagement, 20% regularity)
  v_total_score := (
    (v_rhythm_score * 30) +
    (v_availability_score * 25) +
    (v_engagement_score * 25) +
    (v_regularity_score * 20)
  ) / 100;

  -- Get previous score for trend
  SELECT total_score INTO v_previous_score
  FROM public.connection_rhythm_scores
  WHERE conversation_id = p_conversation_id;

  -- Determine trend
  IF v_previous_score IS NULL THEN
    v_trend := 'stable';
  ELSIF v_total_score > v_previous_score + 3 THEN
    v_trend := 'up';
  ELSIF v_total_score < v_previous_score - 3 THEN
    v_trend := 'down';
  ELSE
    v_trend := 'stable';
  END IF;

  -- Upsert the score
  INSERT INTO public.connection_rhythm_scores (
    conversation_id, rhythm_score, availability_score, engagement_score, regularity_score,
    total_score, previous_score, trend, is_valid, current_message_count, calculated_at
  )
  VALUES (
    p_conversation_id, v_rhythm_score, v_availability_score, v_engagement_score, v_regularity_score,
    v_total_score, v_previous_score, v_trend, true, v_total_messages, now()
  )
  ON CONFLICT (conversation_id) DO UPDATE
  SET
    rhythm_score = v_rhythm_score,
    availability_score = v_availability_score,
    engagement_score = v_engagement_score,
    regularity_score = v_regularity_score,
    total_score = v_total_score,
    previous_score = connection_rhythm_scores.total_score,
    trend = v_trend,
    is_valid = true,
    current_message_count = v_total_messages,
    calculated_at = now(),
    updated_at = now();

  RETURN jsonb_build_object(
    'is_valid', true,
    'rhythm_score', v_rhythm_score,
    'availability_score', v_availability_score,
    'engagement_score', v_engagement_score,
    'regularity_score', v_regularity_score,
    'total_score', v_total_score,
    'trend', v_trend,
    'message_count', v_total_messages
  );
END;
$$;

-- Function: Get rhythm score for a conversation
CREATE OR REPLACE FUNCTION public.get_connection_rhythm(
  p_conversation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score record;
BEGIN
  SELECT * INTO v_score
  FROM public.connection_rhythm_scores
  WHERE conversation_id = p_conversation_id;

  IF v_score IS NULL THEN
    RETURN jsonb_build_object(
      'is_valid', false,
      'current_message_count', 0,
      'min_messages_required', 5
    );
  END IF;

  RETURN jsonb_build_object(
    'is_valid', v_score.is_valid,
    'rhythm_score', v_score.rhythm_score,
    'availability_score', v_score.availability_score,
    'engagement_score', v_score.engagement_score,
    'regularity_score', v_score.regularity_score,
    'total_score', v_score.total_score,
    'trend', v_score.trend,
    'current_message_count', v_score.current_message_count,
    'min_messages_required', v_score.min_messages_required,
    'calculated_at', v_score.calculated_at
  );
END;
$$;

-- Trigger function to update stats when a message is sent
CREATE OR REPLACE FUNCTION public.trigger_update_interaction_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update interaction stats
  PERFORM public.update_interaction_stats(
    NEW.conversation_id,
    NEW.sender_id,
    length(NEW.content),
    NEW.sent_at
  );

  -- Recalculate rhythm score
  PERFORM public.calculate_connection_rhythm(NEW.conversation_id);

  RETURN NEW;
END;
$$;

-- Create trigger on messages table
DROP TRIGGER IF EXISTS trigger_message_stats ON public.messages;
CREATE TRIGGER trigger_message_stats
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_interaction_stats();

-- Permissions
GRANT EXECUTE ON FUNCTION public.update_interaction_stats(uuid, uuid, integer, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_connection_rhythm(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_connection_rhythm(uuid) TO authenticated;
