-- =============================================
-- Migration: Score d'Engagement
-- Algorithme de classement basé sur l'engagement réel
-- =============================================

-- Table des scores d'engagement
CREATE TABLE IF NOT EXISTS public.engagement_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Scores par composante (0-100)
  responsiveness_score integer DEFAULT 50,
  avg_response_time_minutes integer DEFAULT 60,
  response_rate numeric(5,2) DEFAULT 0,

  conversation_score integer DEFAULT 50,
  avg_conversation_length integer DEFAULT 0,
  conversations_started integer DEFAULT 0,
  conversations_continued integer DEFAULT 0,

  meeting_score integer DEFAULT 50,
  meetings_proposed integer DEFAULT 0,
  meetings_accepted integer DEFAULT 0,
  meetings_declined integer DEFAULT 0,

  activity_score integer DEFAULT 50,
  days_active_last_week integer DEFAULT 0,
  avg_sessions_per_day numeric(5,2) DEFAULT 0,

  -- Score total pondéré (0-100)
  total_score integer DEFAULT 50,
  previous_score integer DEFAULT 50,

  -- Métadonnées
  data_points integer DEFAULT 0,
  calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_engagement_user UNIQUE (user_id)
);

-- Table des boosts temporaires
CREATE TABLE IF NOT EXISTS public.engagement_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  boost_type text NOT NULL CHECK (boost_type IN ('new_user', 'returning', 'high_response', 'meeting_accepted')),
  multiplier numeric(3,2) NOT NULL DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- Table des activités (pour le calcul)
CREATE TABLE IF NOT EXISTS public.engagement_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('message_sent', 'message_replied', 'meeting_proposed', 'meeting_accepted', 'session_start')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_engagement_scores_user ON public.engagement_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_scores_total ON public.engagement_scores(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_boosts_user ON public.engagement_boosts(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_engagement_activities_user ON public.engagement_activities(user_id, created_at);

-- RLS
ALTER TABLE public.engagement_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_activities ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own engagement score" ON public.engagement_scores FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can read others engagement score" ON public.engagement_scores FOR SELECT USING (true);
CREATE POLICY "System can manage engagement scores" ON public.engagement_scores FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can read own boosts" ON public.engagement_boosts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can manage boosts" ON public.engagement_boosts FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "System can manage activities" ON public.engagement_activities FOR ALL USING (true) WITH CHECK (true);

-- Function: Get engagement score
CREATE OR REPLACE FUNCTION public.get_engagement_score(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_score record;
BEGIN
  SELECT * INTO v_score FROM public.engagement_scores WHERE user_id = p_user_id;

  IF v_score IS NULL THEN
    RETURN jsonb_build_object(
      'total_score', 50,
      'responsiveness_score', 50,
      'conversation_score', 50,
      'meeting_score', 50,
      'activity_score', 50,
      'data_points', 0
    );
  END IF;

  RETURN jsonb_build_object(
    'total_score', v_score.total_score,
    'responsiveness_score', v_score.responsiveness_score,
    'avg_response_time_minutes', v_score.avg_response_time_minutes,
    'response_rate', v_score.response_rate,
    'conversation_score', v_score.conversation_score,
    'avg_conversation_length', v_score.avg_conversation_length,
    'conversations_started', v_score.conversations_started,
    'conversations_continued', v_score.conversations_continued,
    'meeting_score', v_score.meeting_score,
    'meetings_proposed', v_score.meetings_proposed,
    'meetings_accepted', v_score.meetings_accepted,
    'meetings_declined', v_score.meetings_declined,
    'activity_score', v_score.activity_score,
    'days_active_last_week', v_score.days_active_last_week,
    'avg_sessions_per_day', v_score.avg_sessions_per_day,
    'last_active_at', (SELECT last_active_at FROM public.profiles WHERE id = p_user_id),
    'data_points', v_score.data_points,
    'calculated_at', v_score.calculated_at
  );
END;
$$;

-- Function: Calculate engagement score
CREATE OR REPLACE FUNCTION public.calculate_engagement_score(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_responsiveness integer;
  v_conversation integer;
  v_meeting integer;
  v_activity integer;
  v_total integer;
  v_data_points integer;
  v_avg_response_time integer;
  v_response_rate numeric;
  v_conv_length integer;
  v_conv_started integer;
  v_conv_continued integer;
  v_meet_proposed integer;
  v_meet_accepted integer;
  v_meet_declined integer;
  v_days_active integer;
BEGIN
  -- Count data points
  SELECT COUNT(*) INTO v_data_points FROM public.engagement_activities WHERE user_id = p_user_id AND created_at > now() - interval '30 days';

  -- Calculate responsiveness (based on message replies)
  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (reply.created_at - orig.created_at)) / 60), 60)::integer
  INTO v_avg_response_time
  FROM public.messages orig
  JOIN public.messages reply ON reply.conversation_id = orig.conversation_id AND reply.sender_id = p_user_id AND reply.created_at > orig.created_at
  WHERE orig.sender_id != p_user_id AND orig.created_at > now() - interval '14 days'
  LIMIT 100;

  v_avg_response_time := COALESCE(v_avg_response_time, 60);
  v_responsiveness := GREATEST(0, LEAST(100, 100 - (v_avg_response_time / 14.4)::integer));

  -- Calculate conversation score
  SELECT COUNT(DISTINCT conversation_id) INTO v_conv_started
  FROM public.messages WHERE sender_id = p_user_id AND created_at > now() - interval '30 days';

  SELECT COUNT(DISTINCT m.conversation_id) INTO v_conv_continued
  FROM public.messages m
  WHERE m.sender_id = p_user_id
  AND m.created_at > now() - interval '30 days'
  AND (SELECT COUNT(*) FROM public.messages WHERE conversation_id = m.conversation_id) >= 5;

  v_conv_length := COALESCE((SELECT AVG(msg_count)::integer FROM (SELECT COUNT(*) as msg_count FROM public.messages WHERE sender_id = p_user_id AND created_at > now() - interval '30 days' GROUP BY conversation_id) sub), 0);

  v_conversation := LEAST(100, (COALESCE(v_conv_continued, 0) * 10) + (COALESCE(v_conv_length, 0) * 2));

  -- Calculate meeting score
  SELECT COUNT(*) INTO v_meet_proposed FROM public.quick_meet_proposals WHERE proposer_id = p_user_id AND created_at > now() - interval '30 days';
  SELECT COUNT(*) INTO v_meet_accepted FROM public.quick_meet_proposals WHERE (proposer_id = p_user_id OR recipient_id = p_user_id) AND status = 'accepted' AND created_at > now() - interval '30 days';
  SELECT COUNT(*) INTO v_meet_declined FROM public.quick_meet_proposals WHERE recipient_id = p_user_id AND status = 'declined' AND created_at > now() - interval '30 days';

  v_meeting := LEAST(100, 50 + (COALESCE(v_meet_proposed, 0) * 10) + (COALESCE(v_meet_accepted, 0) * 20) - (COALESCE(v_meet_declined, 0) * 5));

  -- Calculate activity score
  SELECT COUNT(DISTINCT DATE(created_at)) INTO v_days_active FROM public.engagement_activities WHERE user_id = p_user_id AND created_at > now() - interval '7 days';
  v_activity := LEAST(100, COALESCE(v_days_active, 0) * 14);

  -- Calculate weighted total
  v_total := ((v_responsiveness * 30) + (v_conversation * 30) + (v_meeting * 20) + (v_activity * 20)) / 100;

  -- Upsert score
  INSERT INTO public.engagement_scores (user_id, responsiveness_score, avg_response_time_minutes, conversation_score, avg_conversation_length, conversations_started, conversations_continued, meeting_score, meetings_proposed, meetings_accepted, meetings_declined, activity_score, days_active_last_week, total_score, data_points, calculated_at)
  VALUES (p_user_id, v_responsiveness, v_avg_response_time, v_conversation, COALESCE(v_conv_length, 0), COALESCE(v_conv_started, 0), COALESCE(v_conv_continued, 0), v_meeting, COALESCE(v_meet_proposed, 0), COALESCE(v_meet_accepted, 0), COALESCE(v_meet_declined, 0), v_activity, COALESCE(v_days_active, 0), v_total, v_data_points, now())
  ON CONFLICT (user_id) DO UPDATE SET
    responsiveness_score = v_responsiveness,
    avg_response_time_minutes = v_avg_response_time,
    conversation_score = v_conversation,
    avg_conversation_length = COALESCE(v_conv_length, 0),
    conversations_started = COALESCE(v_conv_started, 0),
    conversations_continued = COALESCE(v_conv_continued, 0),
    meeting_score = v_meeting,
    meetings_proposed = COALESCE(v_meet_proposed, 0),
    meetings_accepted = COALESCE(v_meet_accepted, 0),
    meetings_declined = COALESCE(v_meet_declined, 0),
    activity_score = v_activity,
    days_active_last_week = COALESCE(v_days_active, 0),
    previous_score = engagement_scores.total_score,
    total_score = v_total,
    data_points = v_data_points,
    calculated_at = now(),
    updated_at = now();
END;
$$;

-- Function: Record engagement activity
CREATE OR REPLACE FUNCTION public.record_engagement_activity(p_user_id uuid, p_activity_type text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.engagement_activities (user_id, activity_type) VALUES (p_user_id, p_activity_type);
  PERFORM public.calculate_engagement_score(p_user_id);
END;
$$;

-- Function: Get ranked profiles for discover
CREATE OR REPLACE FUNCTION public.get_ranked_profiles(p_user_id uuid, p_max_distance integer, p_min_age integer, p_max_age integer, p_genders text[], p_limit integer)
RETURNS TABLE (profile_id uuid, engagement_score integer, boost_multiplier numeric, match_score integer) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as profile_id,
    COALESCE(es.total_score, 50) as engagement_score,
    COALESCE((SELECT SUM(eb.multiplier) FROM public.engagement_boosts eb WHERE eb.user_id = p.id AND eb.expires_at > now()), 1.0) as boost_multiplier,
    50 as match_score
  FROM public.profiles p
  LEFT JOIN public.engagement_scores es ON es.user_id = p.id
  WHERE p.id != p_user_id
    AND p.is_active = true
    AND NOT EXISTS (SELECT 1 FROM public.blocks WHERE blocker_id = p_user_id AND blocked_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM public.blocks WHERE blocker_id = p.id AND blocked_id = p_user_id)
  ORDER BY (COALESCE(es.total_score, 50) * COALESCE((SELECT SUM(eb.multiplier) FROM public.engagement_boosts eb WHERE eb.user_id = p.id AND eb.expires_at > now()), 1.0)) DESC
  LIMIT p_limit;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_engagement_score(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_engagement_score(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_engagement_activity(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ranked_profiles(uuid, integer, integer, integer, text[], integer) TO authenticated;
