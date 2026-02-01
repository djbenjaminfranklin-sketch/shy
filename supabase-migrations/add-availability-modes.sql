-- =============================================
-- Migration: Modes de Disponibilité Temporaire
-- Feature: Permet aux utilisateurs d'activer des modes temporaires (24h/72h)
-- pour ne voir que les profils dans le même mode.
-- =============================================

-- Table principale des modes actifs
CREATE TABLE IF NOT EXISTS public.availability_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode_type text NOT NULL CHECK (mode_type IN ('relaxed', 'spontaneous', 'explorer')),
  duration_hours integer NOT NULL CHECK (duration_hours IN (24, 72)),
  activated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  show_badge boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),

  -- Un seul mode actif par utilisateur
  CONSTRAINT one_active_mode_per_user UNIQUE (user_id, is_active)
    DEFERRABLE INITIALLY DEFERRED
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_availability_modes_user_active
  ON public.availability_modes(user_id, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_availability_modes_mode_type_active
  ON public.availability_modes(mode_type, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_availability_modes_expires_at
  ON public.availability_modes(expires_at)
  WHERE is_active = true;

-- Historique des activations (pour limite 7 jours gratuits)
CREATE TABLE IF NOT EXISTS public.availability_mode_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode_type text NOT NULL,
  duration_hours integer NOT NULL,
  activated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mode_activations_user_date
  ON public.availability_mode_activations(user_id, activated_at);

-- RLS Policies
ALTER TABLE public.availability_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_mode_activations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own mode
CREATE POLICY "Users can read own availability mode"
  ON public.availability_modes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can read other users' active modes (for filtering)
CREATE POLICY "Users can read active modes for filtering"
  ON public.availability_modes
  FOR SELECT
  USING (is_active = true);

-- Policy: Users can insert their own mode
CREATE POLICY "Users can insert own availability mode"
  ON public.availability_modes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own mode
CREATE POLICY "Users can update own availability mode"
  ON public.availability_modes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own mode
CREATE POLICY "Users can delete own availability mode"
  ON public.availability_modes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy for activations history
CREATE POLICY "Users can read own activations"
  ON public.availability_mode_activations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activations"
  ON public.availability_mode_activations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Functions
-- =============================================

-- Function: Check if user can activate a mode (based on subscription and weekly limit)
CREATE OR REPLACE FUNCTION public.can_activate_availability_mode(
  p_user_id uuid,
  p_duration_hours integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_plan text;
  v_activations_this_week integer;
  v_is_premium boolean;
  v_has_active_mode boolean;
BEGIN
  -- Get user's subscription plan
  SELECT COALESCE(plan_id, 'free') INTO v_subscription_plan
  FROM public.user_subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  LIMIT 1;

  IF v_subscription_plan IS NULL THEN
    v_subscription_plan := 'free';
  END IF;

  -- Check if user is premium (plus or premium)
  v_is_premium := v_subscription_plan IN ('plus', 'premium');

  -- Check if user already has an active mode
  SELECT EXISTS(
    SELECT 1 FROM public.availability_modes
    WHERE user_id = p_user_id AND is_active = true AND expires_at > now()
  ) INTO v_has_active_mode;

  IF v_has_active_mode THEN
    RETURN jsonb_build_object(
      'can_activate', false,
      'reason', 'already_active',
      'message', 'Vous avez déjà un mode actif'
    );
  END IF;

  -- For free users: check 72h restriction
  IF NOT v_is_premium AND p_duration_hours = 72 THEN
    RETURN jsonb_build_object(
      'can_activate', false,
      'reason', 'premium_required',
      'message', 'La durée 72h est réservée aux abonnés'
    );
  END IF;

  -- For free users: check weekly limit (1 per 7 days)
  IF NOT v_is_premium THEN
    SELECT COUNT(*) INTO v_activations_this_week
    FROM public.availability_mode_activations
    WHERE user_id = p_user_id
      AND activated_at > now() - interval '7 days';

    IF v_activations_this_week >= 1 THEN
      RETURN jsonb_build_object(
        'can_activate', false,
        'reason', 'weekly_limit',
        'message', 'Limite hebdomadaire atteinte. Passez Premium pour des activations illimitées.',
        'activations_this_week', v_activations_this_week
      );
    END IF;
  END IF;

  -- User can activate
  RETURN jsonb_build_object(
    'can_activate', true,
    'is_premium', v_is_premium,
    'subscription_plan', v_subscription_plan
  );
END;
$$;

-- Function: Activate availability mode
CREATE OR REPLACE FUNCTION public.activate_availability_mode(
  p_user_id uuid,
  p_mode_type text,
  p_duration_hours integer,
  p_show_badge boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_can_activate jsonb;
  v_new_mode_id uuid;
  v_expires_at timestamptz;
BEGIN
  -- Check if user can activate
  v_can_activate := public.can_activate_availability_mode(p_user_id, p_duration_hours);

  IF NOT (v_can_activate->>'can_activate')::boolean THEN
    RETURN v_can_activate;
  END IF;

  -- Calculate expiration
  v_expires_at := now() + (p_duration_hours || ' hours')::interval;

  -- Deactivate any existing mode (should not exist, but just in case)
  UPDATE public.availability_modes
  SET is_active = false
  WHERE user_id = p_user_id AND is_active = true;

  -- Create new mode
  INSERT INTO public.availability_modes (
    user_id, mode_type, duration_hours, expires_at, show_badge
  )
  VALUES (
    p_user_id, p_mode_type, p_duration_hours, v_expires_at, p_show_badge
  )
  RETURNING id INTO v_new_mode_id;

  -- Record activation in history
  INSERT INTO public.availability_mode_activations (
    user_id, mode_type, duration_hours
  )
  VALUES (
    p_user_id, p_mode_type, p_duration_hours
  );

  RETURN jsonb_build_object(
    'success', true,
    'mode_id', v_new_mode_id,
    'mode_type', p_mode_type,
    'expires_at', v_expires_at,
    'duration_hours', p_duration_hours
  );
END;
$$;

-- Function: Deactivate availability mode
CREATE OR REPLACE FUNCTION public.deactivate_availability_mode(
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mode_id uuid;
BEGIN
  -- Find and deactivate active mode
  UPDATE public.availability_modes
  SET is_active = false
  WHERE user_id = p_user_id AND is_active = true
  RETURNING id INTO v_mode_id;

  IF v_mode_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'no_active_mode',
      'message', 'Aucun mode actif à désactiver'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'deactivated_mode_id', v_mode_id
  );
END;
$$;

-- Function: Get user's active mode
CREATE OR REPLACE FUNCTION public.get_active_availability_mode(
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mode record;
BEGIN
  SELECT * INTO v_mode
  FROM public.availability_modes
  WHERE user_id = p_user_id
    AND is_active = true
    AND expires_at > now()
  LIMIT 1;

  IF v_mode IS NULL THEN
    RETURN jsonb_build_object(
      'has_active_mode', false
    );
  END IF;

  RETURN jsonb_build_object(
    'has_active_mode', true,
    'mode_id', v_mode.id,
    'mode_type', v_mode.mode_type,
    'duration_hours', v_mode.duration_hours,
    'activated_at', v_mode.activated_at,
    'expires_at', v_mode.expires_at,
    'show_badge', v_mode.show_badge,
    'remaining_minutes', EXTRACT(EPOCH FROM (v_mode.expires_at - now())) / 60
  );
END;
$$;

-- Function: Auto-expire modes (to be called by a cron job or trigger)
CREATE OR REPLACE FUNCTION public.expire_availability_modes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired_count integer;
BEGIN
  UPDATE public.availability_modes
  SET is_active = false
  WHERE is_active = true AND expires_at <= now();

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  RETURN v_expired_count;
END;
$$;

-- Function: Get profiles with same active mode (for filtering in discover)
CREATE OR REPLACE FUNCTION public.get_profiles_with_same_mode(
  p_user_id uuid,
  p_mode_type text
)
RETURNS TABLE(profile_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT am.user_id
  FROM public.availability_modes am
  WHERE am.mode_type = p_mode_type
    AND am.is_active = true
    AND am.expires_at > now()
    AND am.user_id != p_user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.can_activate_availability_mode(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_availability_mode(uuid, text, integer, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_availability_mode(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_availability_mode(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profiles_with_same_mode(uuid, text) TO authenticated;
