-- =============================================
-- Migration: Niveau de Confort (Comfort Level)
-- Système de progression basé sur le consentement mutuel
-- =============================================

-- Table des niveaux de confort par utilisateur/conversation
CREATE TABLE IF NOT EXISTS public.comfort_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'chatting' CHECK (level IN ('chatting', 'flirting', 'open_to_meet')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_comfort_user_conversation UNIQUE (conversation_id, user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_comfort_levels_conversation ON public.comfort_levels(conversation_id);
CREATE INDEX IF NOT EXISTS idx_comfort_levels_user ON public.comfort_levels(user_id);

-- RLS
ALTER TABLE public.comfort_levels ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read comfort levels for their conversations
CREATE POLICY "Users can read own comfort levels" ON public.comfort_levels FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.conversations conv
    JOIN public.connections conn ON conn.id = conv.connection_id
    WHERE conv.id = conversation_id
    AND (conn.user1_id = auth.uid() OR conn.user2_id = auth.uid())
  ));

-- Policy: Users can insert their own comfort level
CREATE POLICY "Users can insert own comfort level" ON public.comfort_levels FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations conv
      JOIN public.connections conn ON conn.id = conv.connection_id
      WHERE conv.id = conversation_id
      AND (conn.user1_id = auth.uid() OR conn.user2_id = auth.uid())
    )
  );

-- Policy: Users can update their own comfort level
CREATE POLICY "Users can update own comfort level" ON public.comfort_levels FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function: Get mutual comfort level for a conversation
CREATE OR REPLACE FUNCTION public.get_mutual_comfort_level(p_conversation_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_levels text[];
  v_level_order text[] := ARRAY['chatting', 'flirting', 'open_to_meet'];
  v_min_index integer := 3;
  v_index integer;
  v_level text;
BEGIN
  SELECT ARRAY_AGG(level) INTO v_levels
  FROM public.comfort_levels
  WHERE conversation_id = p_conversation_id;

  IF v_levels IS NULL OR array_length(v_levels, 1) < 2 THEN
    RETURN 'chatting';
  END IF;

  FOREACH v_level IN ARRAY v_levels LOOP
    v_index := array_position(v_level_order, v_level);
    IF v_index < v_min_index THEN
      v_min_index := v_index;
    END IF;
  END LOOP;

  RETURN v_level_order[v_min_index];
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_mutual_comfort_level(uuid) TO authenticated;
