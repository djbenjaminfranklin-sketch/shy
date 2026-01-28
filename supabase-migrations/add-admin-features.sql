-- Add admin features to profiles table
-- Run this in Supabase SQL Editor

-- Add role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS warning_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- Create reports table if not exists
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at);

-- RLS policies for reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Admins can view and manage all reports
CREATE POLICY "Admins can manage all reports" ON reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to increment warning count
CREATE OR REPLACE FUNCTION increment_warning(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE profiles
  SET warning_count = warning_count + 1
  WHERE id = user_id
  RETURNING warning_count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update last_active_at automatically
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_active_at on profile updates
DROP TRIGGER IF EXISTS update_profile_last_active ON profiles;
CREATE TRIGGER update_profile_last_active
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active();

-- SET YOUR USER AS ADMIN (Replace with your actual user ID)
-- You can find your user ID by running: SELECT id FROM auth.users WHERE email = 'your-email@example.com';
-- Then run: UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID';

-- Example (uncomment and modify):
-- UPDATE profiles SET role = 'admin' WHERE email = 'djbenjaminfranklin@hotmail.com';

COMMENT ON COLUMN profiles.role IS 'User role: user, moderator, admin';
COMMENT ON COLUMN profiles.is_banned IS 'Whether user is banned from the platform';
COMMENT ON COLUMN profiles.is_verified IS 'Whether user has verified their identity';
COMMENT ON COLUMN profiles.warning_count IS 'Number of warnings received';
COMMENT ON COLUMN profiles.subscription_tier IS 'Subscription level: free, plus, premium';
