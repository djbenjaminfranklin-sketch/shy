-- Migration: Mode Voyage / International
-- Permet aux utilisateurs Premium de se localiser dans une autre ville

-- Table pour stocker les modes voyage actifs
CREATE TABLE IF NOT EXISTS public.travel_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Destination
  city text NOT NULL,
  country text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,

  -- Dates du voyage
  arrival_date date NOT NULL,
  departure_date date,

  -- État
  is_active boolean DEFAULT true,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Un seul mode voyage actif par utilisateur
  CONSTRAINT unique_active_travel_mode UNIQUE (user_id, is_active)
    DEFERRABLE INITIALLY DEFERRED
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_travel_modes_user_id ON public.travel_modes(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_modes_active ON public.travel_modes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_travel_modes_location ON public.travel_modes(latitude, longitude) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_travel_modes_dates ON public.travel_modes(arrival_date, departure_date) WHERE is_active = true;

-- RLS Policies
ALTER TABLE public.travel_modes ENABLE ROW LEVEL SECURITY;

-- Lecture : tout le monde peut voir les modes voyage actifs (pour le matching)
CREATE POLICY "travel_modes_select_policy" ON public.travel_modes
  FOR SELECT USING (true);

-- Insertion : uniquement son propre mode voyage
CREATE POLICY "travel_modes_insert_policy" ON public.travel_modes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Modification : uniquement son propre mode voyage
CREATE POLICY "travel_modes_update_policy" ON public.travel_modes
  FOR UPDATE USING (auth.uid() = user_id);

-- Suppression : uniquement son propre mode voyage
CREATE POLICY "travel_modes_delete_policy" ON public.travel_modes
  FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour activer un mode voyage
CREATE OR REPLACE FUNCTION activate_travel_mode(
  p_user_id uuid,
  p_city text,
  p_country text,
  p_latitude double precision,
  p_longitude double precision,
  p_arrival_date date,
  p_departure_date date DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_travel_id uuid;
BEGIN
  -- Désactiver tout mode voyage existant
  UPDATE public.travel_modes
  SET is_active = false, updated_at = now()
  WHERE user_id = p_user_id AND is_active = true;

  -- Créer le nouveau mode voyage
  INSERT INTO public.travel_modes (
    user_id, city, country, latitude, longitude,
    arrival_date, departure_date, is_active
  ) VALUES (
    p_user_id, p_city, p_country, p_latitude, p_longitude,
    p_arrival_date, p_departure_date, true
  )
  RETURNING id INTO v_travel_id;

  RETURN v_travel_id;
END;
$$;

-- Fonction pour désactiver le mode voyage
CREATE OR REPLACE FUNCTION deactivate_travel_mode(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.travel_modes
  SET is_active = false, updated_at = now()
  WHERE user_id = p_user_id AND is_active = true;

  RETURN FOUND;
END;
$$;

-- Fonction pour récupérer le mode voyage actif d'un utilisateur
CREATE OR REPLACE FUNCTION get_active_travel_mode(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  city text,
  country text,
  latitude double precision,
  longitude double precision,
  arrival_date date,
  departure_date date
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tm.id,
    tm.city,
    tm.country,
    tm.latitude,
    tm.longitude,
    tm.arrival_date,
    tm.departure_date
  FROM public.travel_modes tm
  WHERE tm.user_id = p_user_id
    AND tm.is_active = true
    AND tm.arrival_date <= CURRENT_DATE + INTERVAL '30 days';
END;
$$;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_travel_mode_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER travel_modes_updated_at
  BEFORE UPDATE ON public.travel_modes
  FOR EACH ROW
  EXECUTE FUNCTION update_travel_mode_timestamp();
