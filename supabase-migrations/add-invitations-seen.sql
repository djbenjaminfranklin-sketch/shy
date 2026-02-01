-- Migration: Add seen_at column to invitations table
-- This allows tracking when a user has viewed an invitation
-- so the badge can be cleared without requiring accept/refuse action

-- Add the seen_at column
ALTER TABLE invitations
ADD COLUMN IF NOT EXISTS seen_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add an index for performance when querying unseen invitations
CREATE INDEX IF NOT EXISTS idx_invitations_receiver_seen
ON invitations(receiver_id, seen_at)
WHERE status = 'pending';

-- Comment for documentation
COMMENT ON COLUMN invitations.seen_at IS 'Timestamp when the receiver viewed this invitation. NULL means unseen.';
