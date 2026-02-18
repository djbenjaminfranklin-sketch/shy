-- Supprimer les 20 faux profils de test
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer les données liées (invitations, connections, messages, etc.)
DELETE FROM messages WHERE conversation_id IN (
  SELECT c.id FROM conversations c
  JOIN connections conn ON c.connection_id = conn.id
  WHERE conn.user1_id IN (
    SELECT id FROM profiles WHERE id::text LIKE 'aaaaaaaa-%' OR id::text LIKE 'bbbbbbbb-%'
  )
  OR conn.user2_id IN (
    SELECT id FROM profiles WHERE id::text LIKE 'aaaaaaaa-%' OR id::text LIKE 'bbbbbbbb-%'
  )
);

DELETE FROM conversations WHERE connection_id IN (
  SELECT id FROM connections
  WHERE user1_id IN (
    SELECT id FROM profiles WHERE id::text LIKE 'aaaaaaaa-%' OR id::text LIKE 'bbbbbbbb-%'
  )
  OR user2_id IN (
    SELECT id FROM profiles WHERE id::text LIKE 'aaaaaaaa-%' OR id::text LIKE 'bbbbbbbb-%'
  )
);

DELETE FROM connections WHERE user1_id IN (
  SELECT id FROM profiles WHERE id::text LIKE 'aaaaaaaa-%' OR id::text LIKE 'bbbbbbbb-%'
)
OR user2_id IN (
  SELECT id FROM profiles WHERE id::text LIKE 'aaaaaaaa-%' OR id::text LIKE 'bbbbbbbb-%'
);

DELETE FROM invitations WHERE sender_id IN (
  SELECT id FROM profiles WHERE id::text LIKE 'aaaaaaaa-%' OR id::text LIKE 'bbbbbbbb-%'
)
OR receiver_id IN (
  SELECT id FROM profiles WHERE id::text LIKE 'aaaaaaaa-%' OR id::text LIKE 'bbbbbbbb-%'
);

DELETE FROM likes WHERE liker_id IN (
  SELECT id FROM profiles WHERE id::text LIKE 'aaaaaaaa-%' OR id::text LIKE 'bbbbbbbb-%'
)
OR liked_id IN (
  SELECT id FROM profiles WHERE id::text LIKE 'aaaaaaaa-%' OR id::text LIKE 'bbbbbbbb-%'
);

DELETE FROM passes WHERE passer_id IN (
  SELECT id FROM profiles WHERE id::text LIKE 'aaaaaaaa-%' OR id::text LIKE 'bbbbbbbb-%'
)
OR passed_id IN (
  SELECT id FROM profiles WHERE id::text LIKE 'aaaaaaaa-%' OR id::text LIKE 'bbbbbbbb-%'
);

-- 2. Supprimer les profils
DELETE FROM profiles WHERE id::text LIKE 'aaaaaaaa-%' OR id::text LIKE 'bbbbbbbb-%';

-- 3. Supprimer les auth users
DELETE FROM auth.users WHERE id::text LIKE 'aaaaaaaa-%' OR id::text LIKE 'bbbbbbbb-%';
