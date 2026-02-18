-- Migration: Add Ice Breaker tables
-- Ice Breaker: Feature that sends personalized messages to compatible profiles

-- Table to track user's Ice Breaker balance
CREATE TABLE IF NOT EXISTS user_icebreakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  icebreakers_available INTEGER NOT NULL DEFAULT 0,
  last_icebreaker_used_at TIMESTAMPTZ,
  total_icebreakers_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Table to track Ice Breaker purchases
CREATE TABLE IF NOT EXISTS icebreaker_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add 'icebreaker' type to invitations if column allows
-- First check if the column has a constraint, if so we need to update it
DO $$
BEGIN
  -- Check if the type column exists and if it has values
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'type') THEN
    -- The type column exists, we can use it for 'icebreaker' type
    RAISE NOTICE 'invitations.type column exists, icebreaker type can be used';
  ELSE
    -- Add type column if it doesn't exist
    ALTER TABLE invitations ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'standard';
    RAISE NOTICE 'Added type column to invitations';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE user_icebreakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE icebreaker_purchases ENABLE ROW LEVEL SECURITY;

-- Policies for user_icebreakers
CREATE POLICY "Users can view their own ice breaker state" ON user_icebreakers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own ice breaker state" ON user_icebreakers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ice breaker state" ON user_icebreakers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for icebreaker_purchases
CREATE POLICY "Users can view their own purchases" ON icebreaker_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" ON icebreaker_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_icebreakers_user_id ON user_icebreakers(user_id);
CREATE INDEX IF NOT EXISTS idx_icebreaker_purchases_user_id ON icebreaker_purchases(user_id);

-- Function to give free Ice Breakers to new users (optional - can be called during onboarding)
CREATE OR REPLACE FUNCTION give_free_icebreaker(target_user_id UUID, quantity INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_icebreakers (user_id, icebreakers_available)
  VALUES (target_user_id, quantity)
  ON CONFLICT (user_id)
  DO UPDATE SET
    icebreakers_available = user_icebreakers.icebreakers_available + quantity,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE user_icebreakers IS 'Tracks Ice Breaker balance for each user';
COMMENT ON TABLE icebreaker_purchases IS 'Records Ice Breaker purchase history';
COMMENT ON FUNCTION give_free_icebreaker IS 'Gives free Ice Breakers to a user (for promotions, onboarding, etc.)';

-- Add is_ice_breaker column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_ice_breaker BOOLEAN DEFAULT FALSE;

-- Index for faster Ice Breaker message lookups
CREATE INDEX IF NOT EXISTS idx_messages_is_ice_breaker ON messages(is_ice_breaker) WHERE is_ice_breaker = TRUE;

-- Table to track which users have seen the Ice Breaker info popup
CREATE TABLE IF NOT EXISTS icebreaker_info_seen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE icebreaker_info_seen ENABLE ROW LEVEL SECURITY;

-- Policies for icebreaker_info_seen
CREATE POLICY "Users can view their own info seen state" ON icebreaker_info_seen
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own info seen state" ON icebreaker_info_seen
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Table to track Ice Breaker results (which profiles received messages)
CREATE TABLE IF NOT EXISTS icebreaker_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_sent TEXT NOT NULL,
  common_interests TEXT[] DEFAULT '{}',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  connection_created BOOLEAN DEFAULT FALSE,
  connection_created_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE icebreaker_results ENABLE ROW LEVEL SECURITY;

-- Policies for icebreaker_results
CREATE POLICY "Users can view their own ice breaker results" ON icebreaker_results
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = target_user_id);

CREATE POLICY "Users can insert their own ice breaker results" ON icebreaker_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ice breaker results" ON icebreaker_results
  FOR UPDATE USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_icebreaker_results_user_id ON icebreaker_results(user_id);
CREATE INDEX IF NOT EXISTS idx_icebreaker_results_target_user_id ON icebreaker_results(target_user_id);
CREATE INDEX IF NOT EXISTS idx_icebreaker_info_seen_user_id ON icebreaker_info_seen(user_id);

COMMENT ON TABLE icebreaker_info_seen IS 'Tracks which users have seen the Ice Breaker explanation popup';
COMMENT ON TABLE icebreaker_results IS 'Records Ice Breaker message results and connection outcomes';
