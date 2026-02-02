-- Migration: Create delete_user_account RPC function
-- Run this in Supabase SQL Editor
-- IMPORTANT: This function requires SECURITY DEFINER to delete auth.users

-- Function to completely delete a user account (GDPR compliant)
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current user's ID
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Delete user's photos from storage
  -- Note: This deletes the storage.objects records, actual files are cleaned by Supabase
  DELETE FROM storage.objects
  WHERE bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = current_user_id::text;

  -- Delete user's videos from storage
  DELETE FROM storage.objects
  WHERE bucket_id = 'profile-videos'
    AND (storage.foldername(name))[1] = current_user_id::text;

  -- 2. Delete messages sent by user
  DELETE FROM messages WHERE sender_id = current_user_id;

  -- 3. Delete conversations where user is participant
  -- (This will cascade to remaining messages)
  DELETE FROM conversations
  WHERE connection_id IN (
    SELECT id FROM connections
    WHERE user1_id = current_user_id OR user2_id = current_user_id
  );

  -- 4. Delete connections
  DELETE FROM connections
  WHERE user1_id = current_user_id OR user2_id = current_user_id;

  -- 5. Delete invitations (sent and received) - correct column names
  DELETE FROM invitations
  WHERE sender_id = current_user_id OR receiver_id = current_user_id;

  -- 6. Delete reports made by or against user - correct column names
  DELETE FROM reports
  WHERE reporter_id = current_user_id OR reported_id = current_user_id;

  -- 7. Delete blocks made by or against user
  DELETE FROM blocks
  WHERE blocker_id = current_user_id OR blocked_id = current_user_id;

  -- 8. Delete user subscriptions and limits
  DELETE FROM user_subscriptions WHERE user_id = current_user_id;
  DELETE FROM user_limits WHERE user_id = current_user_id;
  DELETE FROM user_boosts WHERE user_id = current_user_id;
  DELETE FROM user_auto_reply WHERE user_id = current_user_id;

  -- 9. Delete comfort levels
  DELETE FROM comfort_levels WHERE user_id = current_user_id;

  -- 10. Delete quick meet proposals
  DELETE FROM quick_meet_proposals
  WHERE conversation_id IN (
    SELECT c.id FROM conversations c
    JOIN connections conn ON c.connection_id = conn.id
    WHERE conn.user1_id = current_user_id OR conn.user2_id = current_user_id
  );

  -- 11. Delete connection rhythm data
  DELETE FROM connection_rhythm WHERE user_id = current_user_id;

  -- 12. Delete engagement scores
  DELETE FROM engagement_scores WHERE user_id = current_user_id;
  DELETE FROM engagement_activities WHERE user_id = current_user_id;

  -- 13. Delete availability mode activations
  DELETE FROM availability_mode_activations WHERE user_id = current_user_id;

  -- 14. Delete profile (this might cascade other relations)
  DELETE FROM profiles WHERE id = current_user_id;

  -- 15. Finally, delete the auth user
  -- This requires the function to run with SECURITY DEFINER
  DELETE FROM auth.users WHERE id = current_user_id;

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
