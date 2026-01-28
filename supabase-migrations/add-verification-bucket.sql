-- =====================================================
-- MIGRATION: Ajout du bucket de vérification faciale
-- et du champ verified_at sur la table profiles
-- =====================================================

-- 1. Ajouter le champ verified_at à la table profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- 2. Créer le bucket pour les photos de vérification
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-photos',
  'verification-photos',
  true, -- Public pour permettre à l'Edge Function d'y accéder
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Politique: Les utilisateurs peuvent voir les photos de vérification (pour l'Edge Function)
CREATE POLICY "Public read verification photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'verification-photos');

-- 4. Politique: Les utilisateurs peuvent upload leurs propres photos de vérification
CREATE POLICY "Users can upload verification photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'verification-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5. Politique: Les utilisateurs peuvent supprimer leurs propres photos de vérification
CREATE POLICY "Users can delete verification photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'verification-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 6. Index pour améliorer les requêtes sur is_verified
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON public.profiles(is_verified)
WHERE is_verified = true;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
