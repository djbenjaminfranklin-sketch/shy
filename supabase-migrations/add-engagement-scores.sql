-- =====================================================
-- MIGRATION: Système de Score d'Engagement (type ELO)
-- =====================================================
-- Ce système classe les utilisateurs par engagement
-- pour montrer les profils "populaires" aux autres profils "populaires"
-- =====================================================

-- =====================================================
-- ÉTAPE 1: Ajouter colonnes à profiles
-- =====================================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS engagement_score DECIMAL(5, 2) DEFAULT 50,
ADD COLUMN IF NOT EXISTS is_new_user BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS new_user_boost_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_profiles_engagement ON profiles(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at DESC);

-- =====================================================
-- ÉTAPE 2: Table des scores d'engagement (détaillée)
-- =====================================================
CREATE TABLE IF NOT EXISTS profile_engagement_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Métriques brutes des invitations
  invitations_received INTEGER DEFAULT 0,
  invitations_sent INTEGER DEFAULT 0,
  invitations_accepted INTEGER DEFAULT 0,
  invitations_refused INTEGER DEFAULT 0,

  -- Taux calculés (0.0 à 1.0)
  acceptance_rate DECIMAL(5, 4) DEFAULT 0.5,  -- % d'invitations envoyées acceptées
  response_rate DECIMAL(5, 4) DEFAULT 0.5,    -- % de réponses aux invitations reçues

  -- Métriques profil
  profile_completeness DECIMAL(5, 4) DEFAULT 0,  -- 0.0 à 1.0
  photo_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,

  -- Métriques d'activité
  days_since_last_activity INTEGER DEFAULT 0,
  messages_sent_count INTEGER DEFAULT 0,
  average_response_time_hours DECIMAL(10, 2) DEFAULT 24,

  -- Scores calculés (0-100)
  desirability_score DECIMAL(5, 2) DEFAULT 50,  -- Basé sur invitations reçues
  activity_score DECIMAL(5, 2) DEFAULT 50,      -- Basé sur activité récente
  quality_score DECIMAL(5, 2) DEFAULT 50,       -- Basé sur profil complet
  engagement_score DECIMAL(5, 2) DEFAULT 50,    -- Score final composite

  -- Boost nouveaux utilisateurs
  is_new_user BOOLEAN DEFAULT TRUE,
  new_user_boost_expires_at TIMESTAMPTZ,

  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engagement_scores_score ON profile_engagement_scores(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_scores_user ON profile_engagement_scores(user_id);

-- =====================================================
-- ÉTAPE 3: RLS pour profile_engagement_scores
-- =====================================================
ALTER TABLE profile_engagement_scores ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir uniquement leur propre score (le score n'est JAMAIS affiché publiquement)
CREATE POLICY "Users can view own engagement score" ON profile_engagement_scores
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Le système peut tout faire (via service role)
CREATE POLICY "Service can manage engagement scores" ON profile_engagement_scores
  FOR ALL TO service_role
  USING (true);

-- =====================================================
-- ÉTAPE 4: Fonction d'initialisation du score
-- =====================================================
CREATE OR REPLACE FUNCTION initialize_engagement_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer l'entrée de score d'engagement pour le nouveau profil
  INSERT INTO profile_engagement_scores (
    user_id,
    is_new_user,
    new_user_boost_expires_at,
    engagement_score
  ) VALUES (
    NEW.id,
    TRUE,
    NOW() + INTERVAL '7 days',
    65  -- Score de départ avec boost (50 * 1.3)
  );

  -- Mettre à jour le profil avec les valeurs initiales
  UPDATE profiles SET
    engagement_score = 65,
    is_new_user = TRUE,
    new_user_boost_expires_at = NOW() + INTERVAL '7 days',
    last_active_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÉTAPE 5: Fonction de calcul de complétude du profil
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_profile_completeness(p_user_id UUID)
RETURNS DECIMAL(5, 4) AS $$
DECLARE
  v_profile RECORD;
  v_score DECIMAL(5, 4) := 0;
  v_total_fields INTEGER := 8;
  v_filled_fields INTEGER := 0;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Vérifier chaque champ (chaque champ vaut 1/8 = 0.125)
  IF v_profile.display_name IS NOT NULL AND v_profile.display_name != '' THEN
    v_filled_fields := v_filled_fields + 1;
  END IF;

  IF v_profile.bio IS NOT NULL AND LENGTH(v_profile.bio) >= 20 THEN
    v_filled_fields := v_filled_fields + 1;
  END IF;

  IF v_profile.photos IS NOT NULL AND array_length(v_profile.photos, 1) >= 1 THEN
    v_filled_fields := v_filled_fields + 1;
  END IF;

  IF v_profile.photos IS NOT NULL AND array_length(v_profile.photos, 1) >= 3 THEN
    v_filled_fields := v_filled_fields + 1;
  END IF;

  IF v_profile.intention IS NOT NULL THEN
    v_filled_fields := v_filled_fields + 1;
  END IF;

  IF v_profile.interests IS NOT NULL AND array_length(v_profile.interests, 1) >= 3 THEN
    v_filled_fields := v_filled_fields + 1;
  END IF;

  IF v_profile.languages IS NOT NULL AND array_length(v_profile.languages, 1) >= 1 THEN
    v_filled_fields := v_filled_fields + 1;
  END IF;

  IF v_profile.is_verified = TRUE THEN
    v_filled_fields := v_filled_fields + 1;
  END IF;

  v_score := v_filled_fields::DECIMAL / v_total_fields;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÉTAPE 6: Fonction principale de calcul du score
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_engagement_score(p_user_id UUID)
RETURNS DECIMAL(5, 2) AS $$
DECLARE
  v_scores RECORD;
  v_profile RECORD;
  v_desirability DECIMAL(5, 2) := 50;
  v_activity DECIMAL(5, 2) := 50;
  v_quality DECIMAL(5, 2) := 50;
  v_final_score DECIMAL(5, 2);
  v_boost DECIMAL(3, 2) := 1.0;
  v_decay DECIMAL(5, 4) := 1.0;
  v_days_inactive INTEGER;
BEGIN
  -- Récupérer les données de score existantes
  SELECT * INTO v_scores FROM profile_engagement_scores WHERE user_id = p_user_id;
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN 50; -- Score par défaut
  END IF;

  -- =====================================================
  -- CALCUL DÉSIRABILITÉ (40% du score final)
  -- Basé sur: invitations reçues, taux d'acceptation
  -- =====================================================
  IF v_scores.invitations_received > 0 THEN
    -- Score basé sur le nombre d'invitations reçues (plafonné à 100)
    v_desirability := LEAST(100, 20 + (v_scores.invitations_received * 2));

    -- Bonus si taux d'acceptation élevé (les gens acceptent souvent d'être contactés)
    IF v_scores.acceptance_rate > 0.5 THEN
      v_desirability := v_desirability * (1 + (v_scores.acceptance_rate - 0.5) * 0.3);
    END IF;
  ELSE
    v_desirability := 40; -- Score de base pour nouveau profil
  END IF;

  -- =====================================================
  -- CALCUL ACTIVITÉ (30% du score final)
  -- Basé sur: dernière connexion, temps de réponse
  -- =====================================================
  IF v_profile.last_active_at IS NOT NULL THEN
    v_days_inactive := EXTRACT(DAY FROM (NOW() - v_profile.last_active_at));

    IF v_days_inactive = 0 THEN
      v_activity := 100;
    ELSIF v_days_inactive <= 1 THEN
      v_activity := 90;
    ELSIF v_days_inactive <= 3 THEN
      v_activity := 70;
    ELSIF v_days_inactive <= 7 THEN
      v_activity := 50;
    ELSIF v_days_inactive <= 14 THEN
      v_activity := 30;
    ELSE
      v_activity := 10;
    END IF;

    -- Bonus pour temps de réponse rapide
    IF v_scores.average_response_time_hours IS NOT NULL AND v_scores.average_response_time_hours < 2 THEN
      v_activity := LEAST(100, v_activity * 1.2);
    ELSIF v_scores.average_response_time_hours IS NOT NULL AND v_scores.average_response_time_hours < 6 THEN
      v_activity := LEAST(100, v_activity * 1.1);
    END IF;
  ELSE
    v_activity := 50;
  END IF;

  -- =====================================================
  -- CALCUL QUALITÉ (30% du score final)
  -- Basé sur: photos, bio, vérification
  -- =====================================================
  v_quality := calculate_profile_completeness(p_user_id) * 100;

  -- Bonus vérification (très important pour la confiance)
  IF v_profile.is_verified = TRUE THEN
    v_quality := LEAST(100, v_quality * 1.25);
  END IF;

  -- =====================================================
  -- SCORE FINAL = 40% désirabilité + 30% activité + 30% qualité
  -- =====================================================
  v_final_score := (v_desirability * 0.40) + (v_activity * 0.30) + (v_quality * 0.30);

  -- =====================================================
  -- MODIFICATEURS
  -- =====================================================

  -- Boost nouveaux utilisateurs (+30% pendant 7 jours)
  IF v_scores.is_new_user = TRUE AND v_scores.new_user_boost_expires_at > NOW() THEN
    v_boost := 1.3;
  END IF;

  -- Décroissance si inactif > 24h (-2% par jour, max -30%)
  IF v_profile.last_active_at IS NOT NULL THEN
    v_days_inactive := EXTRACT(DAY FROM (NOW() - v_profile.last_active_at));
    IF v_days_inactive > 1 THEN
      v_decay := GREATEST(0.70, 1.0 - ((v_days_inactive - 1) * 0.02));
    END IF;
  END IF;

  v_final_score := v_final_score * v_boost * v_decay;

  -- Score minimum garanti de 10 (jamais invisible)
  v_final_score := GREATEST(10, LEAST(100, v_final_score));

  RETURN v_final_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÉTAPE 7: Fonction de mise à jour complète du score
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_engagement_score(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_new_score DECIMAL(5, 2);
  v_profile_completeness DECIMAL(5, 4);
  v_photo_count INTEGER;
  v_is_verified BOOLEAN;
  v_invitations_received INTEGER;
  v_invitations_sent INTEGER;
  v_invitations_accepted INTEGER;
  v_invitations_refused INTEGER;
  v_acceptance_rate DECIMAL(5, 4);
  v_response_rate DECIMAL(5, 4);
BEGIN
  -- Calculer les métriques d'invitations
  SELECT COUNT(*) INTO v_invitations_received
  FROM invitations WHERE receiver_id = p_user_id;

  SELECT COUNT(*) INTO v_invitations_sent
  FROM invitations WHERE sender_id = p_user_id;

  SELECT COUNT(*) INTO v_invitations_accepted
  FROM invitations WHERE sender_id = p_user_id AND status = 'accepted';

  SELECT COUNT(*) INTO v_invitations_refused
  FROM invitations WHERE sender_id = p_user_id AND status = 'refused';

  -- Calculer les taux
  IF v_invitations_sent > 0 THEN
    v_acceptance_rate := v_invitations_accepted::DECIMAL / v_invitations_sent;
  ELSE
    v_acceptance_rate := 0.5;
  END IF;

  IF v_invitations_received > 0 THEN
    SELECT COUNT(*)::DECIMAL / v_invitations_received INTO v_response_rate
    FROM invitations
    WHERE receiver_id = p_user_id AND status IN ('accepted', 'refused');
  ELSE
    v_response_rate := 0.5;
  END IF;

  -- Calculer les métriques de profil
  v_profile_completeness := calculate_profile_completeness(p_user_id);

  SELECT
    COALESCE(array_length(photos, 1), 0),
    COALESCE(is_verified, FALSE)
  INTO v_photo_count, v_is_verified
  FROM profiles WHERE id = p_user_id;

  -- Mettre à jour la table profile_engagement_scores
  INSERT INTO profile_engagement_scores (
    user_id,
    invitations_received,
    invitations_sent,
    invitations_accepted,
    invitations_refused,
    acceptance_rate,
    response_rate,
    profile_completeness,
    photo_count,
    is_verified,
    last_calculated_at
  ) VALUES (
    p_user_id,
    v_invitations_received,
    v_invitations_sent,
    v_invitations_accepted,
    v_invitations_refused,
    v_acceptance_rate,
    v_response_rate,
    v_profile_completeness,
    v_photo_count,
    v_is_verified,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    invitations_received = EXCLUDED.invitations_received,
    invitations_sent = EXCLUDED.invitations_sent,
    invitations_accepted = EXCLUDED.invitations_accepted,
    invitations_refused = EXCLUDED.invitations_refused,
    acceptance_rate = EXCLUDED.acceptance_rate,
    response_rate = EXCLUDED.response_rate,
    profile_completeness = EXCLUDED.profile_completeness,
    photo_count = EXCLUDED.photo_count,
    is_verified = EXCLUDED.is_verified,
    last_calculated_at = NOW(),
    updated_at = NOW();

  -- Calculer et sauvegarder le score final
  v_new_score := calculate_engagement_score(p_user_id);

  UPDATE profile_engagement_scores
  SET
    engagement_score = v_new_score,
    desirability_score = (SELECT (LEAST(100, 20 + (invitations_received * 2))) FROM profile_engagement_scores WHERE user_id = p_user_id),
    activity_score = v_new_score, -- Approximation, le vrai calcul est dans la fonction
    quality_score = v_profile_completeness * 100
  WHERE user_id = p_user_id;

  -- Mettre à jour le score dans la table profiles
  UPDATE profiles SET
    engagement_score = v_new_score,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÉTAPE 8: Trigger sur création de profil
-- =====================================================
DROP TRIGGER IF EXISTS trigger_init_engagement_score ON profiles;
CREATE TRIGGER trigger_init_engagement_score
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_engagement_score();

-- =====================================================
-- ÉTAPE 9: Fonction de mise à jour sur activité invitation
-- =====================================================
CREATE OR REPLACE FUNCTION on_invitation_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le score de l'expéditeur
  PERFORM update_user_engagement_score(NEW.sender_id);

  -- Mettre à jour le score du destinataire
  PERFORM update_user_engagement_score(NEW.receiver_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÉTAPE 10: Trigger sur activité invitation
-- =====================================================
DROP TRIGGER IF EXISTS trigger_invitation_score_update ON invitations;
CREATE TRIGGER trigger_invitation_score_update
  AFTER INSERT OR UPDATE ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION on_invitation_activity();

-- =====================================================
-- ÉTAPE 11: Fonction de mise à jour de last_active_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET last_active_at = NOW() WHERE id = NEW.sender_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur envoi de message
DROP TRIGGER IF EXISTS trigger_update_last_active_on_message ON messages;
CREATE TRIGGER trigger_update_last_active_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active();

-- =====================================================
-- ÉTAPE 12: Fonction pour expirer le boost nouveau utilisateur
-- =====================================================
CREATE OR REPLACE FUNCTION expire_new_user_boost()
RETURNS void AS $$
BEGIN
  -- Mettre à jour les profils dont le boost a expiré
  UPDATE profiles SET
    is_new_user = FALSE
  WHERE is_new_user = TRUE
    AND new_user_boost_expires_at IS NOT NULL
    AND new_user_boost_expires_at < NOW();

  -- Mettre à jour la table engagement_scores
  UPDATE profile_engagement_scores SET
    is_new_user = FALSE,
    updated_at = NOW()
  WHERE is_new_user = TRUE
    AND new_user_boost_expires_at IS NOT NULL
    AND new_user_boost_expires_at < NOW();

  -- Recalculer les scores des utilisateurs affectés
  PERFORM update_user_engagement_score(user_id)
  FROM profile_engagement_scores
  WHERE is_new_user = FALSE
    AND new_user_boost_expires_at IS NOT NULL
    AND new_user_boost_expires_at > NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÉTAPE 13: Fonction pour recalculer tous les scores (batch)
-- À exécuter périodiquement via cron job
-- =====================================================
CREATE OR REPLACE FUNCTION recalculate_all_engagement_scores()
RETURNS void AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- D'abord, expirer les boosts des nouveaux utilisateurs
  PERFORM expire_new_user_boost();

  -- Recalculer tous les scores
  FOR v_user_id IN SELECT id FROM profiles
  LOOP
    PERFORM update_user_engagement_score(v_user_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÉTAPE 14: Réaltime pour profile_engagement_scores (optionnel)
-- =====================================================
-- Note: Ne pas exposer les scores en realtime aux utilisateurs
-- Les scores sont internes au système

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
