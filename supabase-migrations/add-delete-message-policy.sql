-- Migration: Allow users to delete their own messages
-- RLS policy for DELETE on messages table

-- Allow users to delete only their own messages
CREATE POLICY "Users can delete their own messages"
ON messages
FOR DELETE
USING (sender_id = auth.uid());
