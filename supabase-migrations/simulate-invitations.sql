-- Script pour simuler 8 invitations reçues
-- Remplace 'TON_USER_ID' par ton vrai user ID (ou ton email)

DO $$
DECLARE
  target_user_id uuid;
  sender_ids uuid[] := ARRAY[
    'aaaaaaaa-0001-4000-8000-000000000001'::uuid,
    'aaaaaaaa-0002-4000-8000-000000000002'::uuid,
    'aaaaaaaa-0003-4000-8000-000000000003'::uuid,
    'aaaaaaaa-0004-4000-8000-000000000004'::uuid,
    'aaaaaaaa-0005-4000-8000-000000000005'::uuid,
    'aaaaaaaa-0006-4000-8000-000000000006'::uuid,
    'aaaaaaaa-0007-4000-8000-000000000007'::uuid,
    'aaaaaaaa-0008-4000-8000-000000000008'::uuid
  ];
  sender_id uuid;
  expires_date timestamp;
BEGIN
  -- Récupérer ton user ID depuis ton email (modifie l'email si nécessaire)
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'djbenjaminfranklin@hotmail.com' LIMIT 1;

  -- Si pas trouvé par email, tu peux mettre ton ID directement:
  -- target_user_id := 'ton-uuid-ici'::uuid;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non trouvé. Modifie l''email dans le script.';
  END IF;

  -- Date d'expiration dans 7 jours
  expires_date := NOW() + INTERVAL '7 days';

  -- Créer les invitations
  FOREACH sender_id IN ARRAY sender_ids
  LOOP
    -- Vérifier que le sender existe
    IF EXISTS (SELECT 1 FROM profiles WHERE id = sender_id) THEN
      -- Insérer l'invitation si elle n'existe pas déjà
      INSERT INTO invitations (sender_id, receiver_id, status, expires_at, created_at)
      VALUES (sender_id, target_user_id, 'pending', expires_date, NOW())
      ON CONFLICT DO NOTHING;

      RAISE NOTICE 'Invitation créée de % vers %', sender_id, target_user_id;
    END IF;
  END LOOP;

  RAISE NOTICE 'Invitations créées avec succès!';
END $$;

-- Vérifier les invitations créées
SELECT
  i.id,
  p.display_name as sender_name,
  i.status,
  i.created_at
FROM invitations i
JOIN profiles p ON p.id = i.sender_id
WHERE i.receiver_id = (SELECT id FROM auth.users WHERE email = 'djbenjaminfranklin@hotmail.com' LIMIT 1)
ORDER BY i.created_at DESC;
