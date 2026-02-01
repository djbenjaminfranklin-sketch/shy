-- =============================================
-- Migration: Pause Café (Quick Meet)
-- Propositions de rendez-vous courts dans des lieux publics
-- =============================================

-- Table des propositions de rendez-vous
CREATE TABLE IF NOT EXISTS public.quick_meet_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  proposer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Détails
  duration integer NOT NULL CHECK (duration IN (15, 30)),
  proposed_slots jsonb NOT NULL DEFAULT '[]',
  selected_slot_id text,
  suggested_places jsonb NOT NULL DEFAULT '[]',
  selected_place_id text,
  message text,

  -- Statut
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  decline_reason text CHECK (decline_reason IN ('busy', 'not_ready', 'prefer_chat', 'other')),

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  responded_at timestamptz
);

-- Index
CREATE INDEX IF NOT EXISTS idx_quick_meet_conversation ON public.quick_meet_proposals(conversation_id);
CREATE INDEX IF NOT EXISTS idx_quick_meet_proposer ON public.quick_meet_proposals(proposer_id);
CREATE INDEX IF NOT EXISTS idx_quick_meet_recipient ON public.quick_meet_proposals(recipient_id);
CREATE INDEX IF NOT EXISTS idx_quick_meet_status ON public.quick_meet_proposals(status, expires_at);

-- RLS
ALTER TABLE public.quick_meet_proposals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read proposals they're involved in
CREATE POLICY "Users can read own proposals" ON public.quick_meet_proposals FOR SELECT
  USING (proposer_id = auth.uid() OR recipient_id = auth.uid());

-- Policy: Users can create proposals
CREATE POLICY "Users can create proposals" ON public.quick_meet_proposals FOR INSERT
  WITH CHECK (proposer_id = auth.uid());

-- Policy: Users can update proposals they're involved in
CREATE POLICY "Users can update own proposals" ON public.quick_meet_proposals FOR UPDATE
  USING (proposer_id = auth.uid() OR recipient_id = auth.uid());

-- Function: Auto-expire old proposals
CREATE OR REPLACE FUNCTION public.expire_quick_meet_proposals()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.quick_meet_proposals
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.expire_quick_meet_proposals() TO authenticated;
