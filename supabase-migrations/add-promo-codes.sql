-- =====================================================
-- SYSTÈME DE CODES PROMO
-- =====================================================

-- Table des codes promo
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_percent INTEGER NOT NULL CHECK (discount_percent IN (10, 20, 30, 40, 50)),
  description TEXT,

  -- Restrictions
  max_uses INTEGER, -- NULL = illimité
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ, -- NULL = pas d'expiration

  -- Applicabilité
  applicable_plans TEXT[] DEFAULT ARRAY['plus', 'premium'], -- Plans sur lesquels le code s'applique
  min_duration TEXT, -- Durée minimum (week, month, 3months, etc.)

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des utilisations de codes promo
CREATE TABLE IF NOT EXISTS promo_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  duration TEXT NOT NULL,
  original_price DECIMAL(10, 2) NOT NULL,
  discounted_price DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un utilisateur ne peut utiliser un code qu'une fois
  UNIQUE (promo_code_id, user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_user ON promo_code_uses(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_code ON promo_code_uses(promo_code_id);

-- RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;

-- Policies pour promo_codes
-- Tout le monde peut voir les codes actifs (pour validation)
CREATE POLICY "Anyone can view active promo codes" ON promo_codes
  FOR SELECT TO authenticated
  USING (is_active = TRUE);

-- Seuls les admins peuvent créer/modifier les codes
-- Note: On utilise une fonction pour vérifier le rôle admin
CREATE POLICY "Admins can manage promo codes" ON promo_codes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies pour promo_code_uses
CREATE POLICY "Users can view own promo uses" ON promo_code_uses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own promo uses" ON promo_code_uses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fonction pour valider et appliquer un code promo
CREATE OR REPLACE FUNCTION validate_promo_code(
  p_code TEXT,
  p_user_id UUID,
  p_plan_id TEXT,
  p_duration TEXT
)
RETURNS TABLE (
  is_valid BOOLEAN,
  discount_percent INTEGER,
  error_message TEXT
) AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_already_used BOOLEAN;
BEGIN
  -- Rechercher le code
  SELECT * INTO v_promo
  FROM promo_codes
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = TRUE;

  -- Code non trouvé
  IF v_promo IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'Code promo invalide'::TEXT;
    RETURN;
  END IF;

  -- Vérifier la validité temporelle
  IF v_promo.valid_from > NOW() THEN
    RETURN QUERY SELECT FALSE, 0, 'Ce code n''est pas encore actif'::TEXT;
    RETURN;
  END IF;

  IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < NOW() THEN
    RETURN QUERY SELECT FALSE, 0, 'Ce code a expiré'::TEXT;
    RETURN;
  END IF;

  -- Vérifier le nombre d'utilisations max
  IF v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses THEN
    RETURN QUERY SELECT FALSE, 0, 'Ce code a atteint sa limite d''utilisation'::TEXT;
    RETURN;
  END IF;

  -- Vérifier si l'utilisateur a déjà utilisé ce code
  SELECT EXISTS (
    SELECT 1 FROM promo_code_uses
    WHERE promo_code_id = v_promo.id AND user_id = p_user_id
  ) INTO v_already_used;

  IF v_already_used THEN
    RETURN QUERY SELECT FALSE, 0, 'Vous avez déjà utilisé ce code'::TEXT;
    RETURN;
  END IF;

  -- Vérifier si le plan est applicable
  IF NOT (p_plan_id = ANY(v_promo.applicable_plans)) THEN
    RETURN QUERY SELECT FALSE, 0, 'Ce code ne s''applique pas à ce plan'::TEXT;
    RETURN;
  END IF;

  -- Tout est OK
  RETURN QUERY SELECT TRUE, v_promo.discount_percent, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour utiliser un code promo
CREATE OR REPLACE FUNCTION use_promo_code(
  p_code TEXT,
  p_user_id UUID,
  p_plan_id TEXT,
  p_duration TEXT,
  p_original_price DECIMAL(10, 2)
)
RETURNS TABLE (
  success BOOLEAN,
  discounted_price DECIMAL(10, 2),
  error_message TEXT
) AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_discount DECIMAL(10, 2);
  v_final_price DECIMAL(10, 2);
BEGIN
  -- Rechercher et verrouiller le code
  SELECT * INTO v_promo
  FROM promo_codes
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = TRUE
  FOR UPDATE;

  -- Validations de base (simplifiées car validate_promo_code est appelé avant)
  IF v_promo IS NULL THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL(10,2), 'Code invalide'::TEXT;
    RETURN;
  END IF;

  -- Calculer le prix réduit
  v_discount := p_original_price * (v_promo.discount_percent::DECIMAL / 100);
  v_final_price := p_original_price - v_discount;

  -- Enregistrer l'utilisation
  INSERT INTO promo_code_uses (promo_code_id, user_id, plan_id, duration, original_price, discounted_price)
  VALUES (v_promo.id, p_user_id, p_plan_id, p_duration, p_original_price, v_final_price);

  -- Incrémenter le compteur
  UPDATE promo_codes
  SET current_uses = current_uses + 1, updated_at = NOW()
  WHERE id = v_promo.id;

  RETURN QUERY SELECT TRUE, v_final_price, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION validate_promo_code TO authenticated;
GRANT EXECUTE ON FUNCTION use_promo_code TO authenticated;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
