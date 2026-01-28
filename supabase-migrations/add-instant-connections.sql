-- =====================================================
-- MIGRATION: Support pour les messages directs
-- (Femme → Homme, Non-binaire → Non-binaire)
-- =====================================================

-- Ajouter les colonnes pour les connexions instantanées
ALTER TABLE connections
ADD COLUMN IF NOT EXISTS is_instant BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS initiated_by UUID REFERENCES auth.users(id);

-- Rendre invitation_id nullable pour les connexions instantanées
ALTER TABLE connections
ALTER COLUMN invitation_id DROP NOT NULL;

-- Index pour les connexions instantanées
CREATE INDEX IF NOT EXISTS idx_connections_instant ON connections(is_instant) WHERE is_instant = TRUE;
CREATE INDEX IF NOT EXISTS idx_connections_initiated_by ON connections(initiated_by);

-- Mettre à jour la policy pour permettre les connexions instantanées
DROP POLICY IF EXISTS "Authenticated users can create connections" ON connections;

CREATE POLICY "Authenticated users can create connections" ON connections FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- Fonction pour créer une connexion instantanée
-- Vérifie que seules les femmes peuvent contacter les hommes directement
-- et que seuls les non-binaires peuvent contacter les non-binaires directement
CREATE OR REPLACE FUNCTION create_instant_connection(
  p_from_user_id UUID,
  p_to_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_from_gender TEXT;
  v_to_gender TEXT;
  v_user1 UUID;
  v_user2 UUID;
  v_connection_id UUID;
  v_conversation_id UUID;
BEGIN
  -- Récupérer les genres des utilisateurs
  SELECT gender INTO v_from_gender FROM profiles WHERE id = p_from_user_id;
  SELECT gender INTO v_to_gender FROM profiles WHERE id = p_to_user_id;

  -- Vérifier les permissions
  -- Femme → Homme : OK
  -- Non-binaire → Non-binaire : OK
  -- Autres cas : REFUSÉ
  IF NOT (
    (v_from_gender = 'femme' AND v_to_gender = 'homme') OR
    (v_from_gender = 'non-binaire' AND v_to_gender = 'non-binaire')
  ) THEN
    RAISE EXCEPTION 'Message direct non autorisé entre ces profils';
  END IF;

  -- S'assurer que user1_id < user2_id pour la contrainte UNIQUE
  IF p_from_user_id < p_to_user_id THEN
    v_user1 := p_from_user_id;
    v_user2 := p_to_user_id;
  ELSE
    v_user1 := p_to_user_id;
    v_user2 := p_from_user_id;
  END IF;

  -- Vérifier si une connexion existe déjà
  SELECT id INTO v_connection_id FROM connections
  WHERE user1_id = v_user1 AND user2_id = v_user2;

  IF v_connection_id IS NOT NULL THEN
    -- Retourner la connexion existante
    RETURN v_connection_id;
  END IF;

  -- Créer la connexion instantanée
  INSERT INTO connections (user1_id, user2_id, is_instant, initiated_by)
  VALUES (v_user1, v_user2, TRUE, p_from_user_id)
  RETURNING id INTO v_connection_id;

  -- Créer automatiquement la conversation
  INSERT INTO conversations (connection_id)
  VALUES (v_connection_id)
  RETURNING id INTO v_conversation_id;

  RETURN v_connection_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder l'accès à la fonction aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION create_instant_connection TO authenticated;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
