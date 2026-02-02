-- Script pour créer 10 profils de test
-- Exécuter dans l'éditeur SQL de Supabase

-- D'abord, créer les utilisateurs auth (nécessaire car profiles.id référence auth.users.id)
-- Note: Ces utilisateurs ne pourront pas se connecter (pas de mot de passe réel)

DO $$
DECLARE
  user_ids uuid[] := ARRAY[
    'aaaaaaaa-0001-4000-8000-000000000001'::uuid,
    'aaaaaaaa-0002-4000-8000-000000000002'::uuid,
    'aaaaaaaa-0003-4000-8000-000000000003'::uuid,
    'aaaaaaaa-0004-4000-8000-000000000004'::uuid,
    'aaaaaaaa-0005-4000-8000-000000000005'::uuid,
    'aaaaaaaa-0006-4000-8000-000000000006'::uuid,
    'aaaaaaaa-0007-4000-8000-000000000007'::uuid,
    'aaaaaaaa-0008-4000-8000-000000000008'::uuid,
    'aaaaaaaa-0009-4000-8000-000000000009'::uuid,
    'aaaaaaaa-0010-4000-8000-000000000010'::uuid
  ];
  i int;
BEGIN
  -- Créer les auth users
  FOR i IN 1..10 LOOP
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, instance_id, aud, role)
    VALUES (
      user_ids[i],
      'test' || i || '@fake.shy.app',
      '$2a$10$abcdefghijklmnopqrstuvwxyz123456789', -- Hash bidon
      NOW(),
      NOW(),
      NOW(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated'
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- Maintenant insérer les profils
-- Profil 1: Sophie, 25 ans, Paris
INSERT INTO profiles (id, display_name, birth_date, gender, hair_color, bio, intention, availability, languages, interests, photos, location_enabled, latitude, longitude, search_radius, min_age_filter, max_age_filter, gender_filter, engagement_score, is_new_user, created_at, updated_at)
VALUES (
  'aaaaaaaa-0001-4000-8000-000000000001',
  'Sophie',
  '1999-03-15',
  'femme',
  'brun',
  'Passionnée de voyages et de photographie. J''adore découvrir de nouveaux restaurants et passer des soirées entre amis.',
  'dating',
  'disponible_semaine',
  ARRAY['fr', 'en'],
  ARRAY['voyages', 'photographie', 'cuisine', 'musique', 'yoga'],
  ARRAY['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'],
  true,
  48.8566 + (random() * 0.05 - 0.025), -- Paris avec variation
  2.3522 + (random() * 0.05 - 0.025),
  25,
  22,
  35,
  ARRAY['homme'],
  75,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Profil 2: Emma, 28 ans, Paris
INSERT INTO profiles (id, display_name, birth_date, gender, hair_color, bio, intention, availability, languages, interests, photos, location_enabled, latitude, longitude, search_radius, min_age_filter, max_age_filter, gender_filter, engagement_score, is_new_user, created_at, updated_at)
VALUES (
  'aaaaaaaa-0002-4000-8000-000000000002',
  'Emma',
  '1996-07-22',
  'femme',
  'blond',
  'Architecte le jour, danseuse la nuit. Je cherche quelqu''un pour partager des moments authentiques.',
  'dating',
  'disponible_soir',
  ARRAY['fr', 'en', 'es'],
  ARRAY['danse', 'architecture', 'art', 'cinema', 'restaurants'],
  ARRAY['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'],
  true,
  48.8606 + (random() * 0.05 - 0.025),
  2.3376 + (random() * 0.05 - 0.025),
  30,
  25,
  40,
  ARRAY['homme'],
  82,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Profil 3: Lucas, 30 ans, Paris
INSERT INTO profiles (id, display_name, birth_date, gender, hair_color, bio, intention, availability, languages, interests, photos, location_enabled, latitude, longitude, search_radius, min_age_filter, max_age_filter, gender_filter, engagement_score, is_new_user, created_at, updated_at)
VALUES (
  'aaaaaaaa-0003-4000-8000-000000000003',
  'Lucas',
  '1994-11-08',
  'homme',
  'brun',
  'Chef cuisinier passionné. Je cherche ma partenaire de vie pour explorer le monde ensemble.',
  'dating',
  'disponible_weekend',
  ARRAY['fr', 'en', 'it'],
  ARRAY['cuisine', 'voyages', 'vin', 'running', 'lecture'],
  ARRAY['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'],
  true,
  48.8496 + (random() * 0.05 - 0.025),
  2.3522 + (random() * 0.05 - 0.025),
  25,
  23,
  35,
  ARRAY['femme'],
  68,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Profil 4: Chloé, 24 ans, Paris
INSERT INTO profiles (id, display_name, birth_date, gender, hair_color, bio, intention, availability, languages, interests, photos, location_enabled, latitude, longitude, search_radius, min_age_filter, max_age_filter, gender_filter, engagement_score, is_new_user, created_at, updated_at)
VALUES (
  'aaaaaaaa-0004-4000-8000-000000000004',
  'Chloé',
  '2000-05-12',
  'femme',
  'roux',
  'Étudiante en médecine, future médecin. J''aime les cafés, les livres et les longues discussions.',
  'social',
  'disponible_semaine',
  ARRAY['fr'],
  ARRAY['lecture', 'cafe', 'science', 'nature', 'animaux'],
  ARRAY['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400'],
  true,
  48.8656 + (random() * 0.05 - 0.025),
  2.3212 + (random() * 0.05 - 0.025),
  20,
  21,
  30,
  ARRAY['homme', 'femme'],
  71,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Profil 5: Thomas, 27 ans, Paris
INSERT INTO profiles (id, display_name, birth_date, gender, hair_color, bio, intention, availability, languages, interests, photos, location_enabled, latitude, longitude, search_radius, min_age_filter, max_age_filter, gender_filter, engagement_score, is_new_user, created_at, updated_at)
VALUES (
  'aaaaaaaa-0005-4000-8000-000000000005',
  'Thomas',
  '1997-09-03',
  'homme',
  'blond',
  'Développeur web le jour, DJ le weekend. La musique est ma passion.',
  'dating',
  'disponible_soir',
  ARRAY['fr', 'en'],
  ARRAY['musique', 'technologie', 'gaming', 'soirees', 'sport'],
  ARRAY['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'],
  true,
  48.8736 + (random() * 0.05 - 0.025),
  2.2950 + (random() * 0.05 - 0.025),
  25,
  20,
  32,
  ARRAY['femme'],
  65,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Profil 6: Léa, 26 ans, Paris
INSERT INTO profiles (id, display_name, birth_date, gender, hair_color, bio, intention, availability, languages, interests, photos, location_enabled, latitude, longitude, search_radius, min_age_filter, max_age_filter, gender_filter, engagement_score, is_new_user, created_at, updated_at)
VALUES (
  'aaaaaaaa-0006-4000-8000-000000000006',
  'Léa',
  '1998-12-20',
  'femme',
  'brun',
  'Marketing manager avec une âme d''artiste. J''adore l''art contemporain et les brunchs.',
  'dating',
  'disponible_weekend',
  ARRAY['fr', 'en', 'de'],
  ARRAY['art', 'marketing', 'brunch', 'mode', 'voyages'],
  ARRAY['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400'],
  true,
  48.8516 + (random() * 0.05 - 0.025),
  2.3689 + (random() * 0.05 - 0.025),
  30,
  24,
  36,
  ARRAY['homme'],
  79,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Profil 7: Alexandre, 32 ans, Paris
INSERT INTO profiles (id, display_name, birth_date, gender, hair_color, bio, intention, availability, languages, interests, photos, location_enabled, latitude, longitude, search_radius, min_age_filter, max_age_filter, gender_filter, engagement_score, is_new_user, created_at, updated_at)
VALUES (
  'aaaaaaaa-0007-4000-8000-000000000007',
  'Alexandre',
  '1992-04-18',
  'homme',
  'noir',
  'Avocat passionné par son métier. Amateur de bons vins et de randonnées en montagne.',
  'dating',
  'disponible_semaine',
  ARRAY['fr', 'en'],
  ARRAY['droit', 'vin', 'randonnee', 'ski', 'politique'],
  ARRAY['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'],
  true,
  48.8456 + (random() * 0.05 - 0.025),
  2.3400 + (random() * 0.05 - 0.025),
  35,
  25,
  38,
  ARRAY['femme'],
  73,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Profil 8: Marie, 29 ans, Paris
INSERT INTO profiles (id, display_name, birth_date, gender, hair_color, bio, intention, availability, languages, interests, photos, location_enabled, latitude, longitude, search_radius, min_age_filter, max_age_filter, gender_filter, engagement_score, is_new_user, created_at, updated_at)
VALUES (
  'aaaaaaaa-0008-4000-8000-000000000008',
  'Marie',
  '1995-08-25',
  'femme',
  'chatain',
  'Infirmière dévouée avec un cœur en or. Je cherche quelqu''un de sincère et attentionné.',
  'dating',
  'disponible_soir',
  ARRAY['fr'],
  ARRAY['sante', 'bien-etre', 'cuisine', 'series', 'jardinage'],
  ARRAY['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'],
  true,
  48.8626 + (random() * 0.05 - 0.025),
  2.3292 + (random() * 0.05 - 0.025),
  25,
  26,
  40,
  ARRAY['homme'],
  77,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Profil 9: Hugo, 25 ans, Paris
INSERT INTO profiles (id, display_name, birth_date, gender, hair_color, bio, intention, availability, languages, interests, photos, location_enabled, latitude, longitude, search_radius, min_age_filter, max_age_filter, gender_filter, engagement_score, is_new_user, created_at, updated_at)
VALUES (
  'aaaaaaaa-0009-4000-8000-000000000009',
  'Hugo',
  '1999-01-30',
  'homme',
  'brun',
  'Photographe freelance. Je capture les moments et cherche à en créer de nouveaux.',
  'social',
  'disponible_weekend',
  ARRAY['fr', 'en', 'pt'],
  ARRAY['photographie', 'voyages', 'cinema', 'musees', 'skateboard'],
  ARRAY['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400'],
  true,
  48.8586 + (random() * 0.05 - 0.025),
  2.3470 + (random() * 0.05 - 0.025),
  20,
  20,
  30,
  ARRAY['femme', 'autre'],
  62,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Profil 10: Camille, 27 ans, Paris (non-binaire)
INSERT INTO profiles (id, display_name, birth_date, gender, hair_color, bio, intention, availability, languages, interests, photos, location_enabled, latitude, longitude, search_radius, min_age_filter, max_age_filter, gender_filter, engagement_score, is_new_user, created_at, updated_at)
VALUES (
  'aaaaaaaa-0010-4000-8000-000000000010',
  'Camille',
  '1997-06-14',
  'autre',
  'colore',
  'Artiste non-binaire. Je peins, je danse, je vis. Cherche des connexions authentiques.',
  'amical',
  'disponible_semaine',
  ARRAY['fr', 'en'],
  ARRAY['art', 'danse', 'lgbtq', 'musique', 'meditation'],
  ARRAY['https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400'],
  true,
  48.8676 + (random() * 0.05 - 0.025),
  2.3622 + (random() * 0.05 - 0.025),
  30,
  22,
  40,
  ARRAY['homme', 'femme', 'autre'],
  70,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Confirmation
SELECT 'Profils créés avec succès!' as message, COUNT(*) as total_profiles
FROM profiles
WHERE id IN (
  'aaaaaaaa-0001-4000-8000-000000000001',
  'aaaaaaaa-0002-4000-8000-000000000002',
  'aaaaaaaa-0003-4000-8000-000000000003',
  'aaaaaaaa-0004-4000-8000-000000000004',
  'aaaaaaaa-0005-4000-8000-000000000005',
  'aaaaaaaa-0006-4000-8000-000000000006',
  'aaaaaaaa-0007-4000-8000-000000000007',
  'aaaaaaaa-0008-4000-8000-000000000008',
  'aaaaaaaa-0009-4000-8000-000000000009',
  'aaaaaaaa-0010-4000-8000-000000000010'
);
