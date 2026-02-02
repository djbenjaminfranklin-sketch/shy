-- Script pour créer 10 profils de test supplémentaires
-- Exécuter dans l'éditeur SQL de Supabase

-- Créer les utilisateurs auth
DO $$
DECLARE
  user_ids uuid[] := ARRAY[
    'bbbbbbbb-0011-4000-8000-000000000011'::uuid,
    'bbbbbbbb-0012-4000-8000-000000000012'::uuid,
    'bbbbbbbb-0013-4000-8000-000000000013'::uuid,
    'bbbbbbbb-0014-4000-8000-000000000014'::uuid,
    'bbbbbbbb-0015-4000-8000-000000000015'::uuid,
    'bbbbbbbb-0016-4000-8000-000000000016'::uuid,
    'bbbbbbbb-0017-4000-8000-000000000017'::uuid,
    'bbbbbbbb-0018-4000-8000-000000000018'::uuid,
    'bbbbbbbb-0019-4000-8000-000000000019'::uuid,
    'bbbbbbbb-0020-4000-8000-000000000020'::uuid
  ];
  i int;
BEGIN
  FOR i IN 1..10 LOOP
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, instance_id, aud, role)
    VALUES (
      user_ids[i],
      'test' || (10 + i) || '@fake.shy.app',
      '$2a$10$abcdefghijklmnopqrstuvwxyz123456789',
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

-- Profil 11: Julie, 23 ans, Paris
INSERT INTO profiles (id, display_name, birth_date, gender, hair_color, bio, intention, availability, languages, interests, photos, location_enabled, latitude, longitude, search_radius, min_age_filter, max_age_filter, gender_filter, engagement_score, is_new_user, created_at, updated_at)
VALUES (
  'bbbbbbbb-0011-4000-8000-000000000011',
  'Julie',
  '2001-02-14',
  'femme',
  'blond',
  'Étudiante en design, passionnée de mode et de créativité. Toujours partante pour un verre !',
  'dating',
  'disponible_soir',
  ARRAY['fr', 'en'],
  ARRAY['design', 'mode', 'shopping', 'soirees', 'instagram'],
  ARRAY['https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400'],
  true,
  48.8530 + (random() * 0.05 - 0.025),
  2.3499 + (random() * 0.05 - 0.025),
  25,
  21,
  32,
  ARRAY['homme'],
  80,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Profil 12: Maxime, 29 ans, Paris
INSERT INTO profiles (id, display_name, birth_date, gender, hair_color, bio, intention, availability, languages, interests, photos, location_enabled, latitude, longitude, search_radius, min_age_filter, max_age_filter, gender_filter, engagement_score, is_new_user, created_at, updated_at)
VALUES (
  'bbbbbbbb-0012-4000-8000-000000000012',
  'Maxime',
  '1995-10-05',
  'homme',
  'chatain',
  'Entrepreneur dans la tech. Je travaille dur mais je sais aussi profiter de la vie.',
  'dating',
  'disponible_weekend',
  ARRAY['fr', 'en', 'es'],
  ARRAY['startup', 'technologie', 'fitness', 'voyages', 'networking'],
  ARRAY['https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400'],
  true,
  48.8720 + (random() * 0.05 - 0.025),
  2.3310 + (random() * 0.05 - 0.025),
  30,
  23,
  35,
  ARRAY['femme'],
  85,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Profil 13: Inès, 26 ans, Paris
INSERT INTO profiles (id, display_name, birth_date, gender, hair_color, bio, intention, availability, languages, interests, photos, location_enabled, latitude, longitude, search_radius, min_age_filter, max_age_filter, gender_filter, engagement_score, is_new_user, created_at, updated_at)
VALUES (
  'bbbbbbbb-0013-4000-8000-000000000013',
  'Inès',
  '1998-06-30',
  'femme',
  'noir',
  'Journaliste curieuse de tout. J''aime les histoires et les gens qui en ont à raconter.',
  'social',
  'disponible_semaine',
  ARRAY['fr', 'en', 'ar'],
  ARRAY['journalisme', 'actualites', 'podcasts', 'ecriture', 'cafes'],
  ARRAY['https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400'],
  true,
  48.8590 + (random() * 0.05 - 0.025),
  2.3470 + (random() * 0.05 - 0.025),
  25,
  24,
  38,
  ARRAY['homme', 'femme'],
  74,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Profil 14: Antoine, 31 ans, Paris
INSERT INTO profiles (id, display_name, birth_date, gender, hair_color, bio, intention, availability, languages, interests, photos, location_enabled, latitude, longitude, search_radius, min_age_filter, max_age_filter, gender_filter, engagement_score, is_new_user, created_at, updated_at)
VALUES (
  'bbbbbbbb-0014-4000-8000-000000000014',
  'Antoine',
  '1993-03-22',
  'homme',
  'brun',
  'Médecin urgentiste. Horaires difficiles mais je sais apprécier mes jours de repos.',
  'dating',
  'disponible_weekend',
  ARRAY['fr', 'en'],
  ARRAY['medecine', 'sport', 'cinema', 'gastronomie', 'voyages'],
  ARRAY['https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400'],
  true,
  48.8450 + (random() * 0.05 - 0.025),
  2.3600 + (random() * 0.05 - 0.025),
  35,
  25,
  38,
  ARRAY['femme'],
  78,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Profil 15: Clara, 24 ans, Paris
INSERT INTO profiles (id, display_name, birth_date, gender, hair_color, bio, intention, availability, languages, interests, photos, location_enabled, latitude, longitude, search_radius, min_age_filter, max_age_filter, gender_filter, engagement_score, is_new_user, created_at, updated_at)
VALUES (
  'bbbbbbbb-0015-4000-8000-000000000015',
  'Clara',
  '2000-09-18',
  'femme',
  'roux',
  'Danseuse professionnelle. La scène est ma vie, mais je cherche aussi des moments off.',
  'dating',
  'disponible_soir',
  ARRAY['fr', 'en', 'ru'],
  ARRAY['danse', 'theatre', 'fitness', 'nutrition', 'musique'],
  ARRAY['https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400'],
  true,
  48.8680 + (random() * 0.05 - 0.025),
  2.3350 + (random() * 0.05 - 0.025),
  20,
  22,
  34,
  ARRAY['homme'],
  83,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Profil 16: Nicolas, 28 ans, Paris
INSERT INTO profiles (id, display_name, birth_date, gender, hair_color, bio, intention, availability, languages, interests, photos, location_enabled, latitude, longitude, search_radius, min_age_filter, max_age_filter, gender_filter, engagement_score, is_new_user, created_at, updated_at)
VALUES (
  'bbbbbbbb-0016-4000-8000-000000000016',
  'Nicolas',
  '1996-12-01',
  'homme',
  'blond',
  'Architecte d''intérieur. Je dessine des espaces de vie et je cherche quelqu''un pour partager le mien.',
  'dating',
  'disponible_semaine',
  ARRAY['fr', 'en', 'it'],
  ARRAY['architecture', 'design', 'art', 'immobilier', 'decoration'],
  ARRAY['https://images.unsplash.com/photo-1463453091185-61582044d556?w=400'],
  true,
  48.8550 + (random() * 0.05 - 0.025),
  2.3580 + (random() * 0.05 - 0.025),
  25,
  23,
  33,
  ARRAY['femme'],
  69,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Profil 17: Sarah, 27 ans, Paris
INSERT INTO profiles (id, display_name, birth_date, gender, hair_color, bio, intention, availability, languages, interests, photos, location_enabled, latitude, longitude, search_radius, min_age_filter, max_age_filter, gender_filter, engagement_score, is_new_user, created_at, updated_at)
VALUES (
  'bbbbbbbb-0017-4000-8000-000000000017',
  'Sarah',
  '1997-04-25',
  'femme',
  'brun',
  'Avocate spécialisée en droit international. Je voyage beaucoup pour le travail.',
  'dating',
  'disponible_weekend',
  ARRAY['fr', 'en', 'de', 'es'],
  ARRAY['droit', 'voyages', 'langues', 'tennis', 'oenologie'],
  ARRAY['https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'],
  true,
  48.8610 + (random() * 0.05 - 0.025),
  2.3420 + (random() * 0.05 - 0.025),
  30,
  26,
  40,
  ARRAY['homme'],
  81,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Profil 18: Romain, 26 ans, Paris
INSERT INTO profiles (id, display_name, birth_date, gender, hair_color, bio, intention, availability, languages, interests, photos, location_enabled, latitude, longitude, search_radius, min_age_filter, max_age_filter, gender_filter, engagement_score, is_new_user, created_at, updated_at)
VALUES (
  'bbbbbbbb-0018-4000-8000-000000000018',
  'Romain',
  '1998-08-12',
  'homme',
  'noir',
  'Coach sportif et préparateur physique. La santé du corps et de l''esprit, c''est ma philosophie.',
  'amical',
  'disponible_semaine',
  ARRAY['fr', 'en'],
  ARRAY['fitness', 'nutrition', 'crossfit', 'running', 'bien-etre'],
  ARRAY['https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400'],
  true,
  48.8480 + (random() * 0.05 - 0.025),
  2.3550 + (random() * 0.05 - 0.025),
  25,
  20,
  35,
  ARRAY['femme', 'homme'],
  72,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Profil 19: Manon, 25 ans, Paris
INSERT INTO profiles (id, display_name, birth_date, gender, hair_color, bio, intention, availability, languages, interests, photos, location_enabled, latitude, longitude, search_radius, min_age_filter, max_age_filter, gender_filter, engagement_score, is_new_user, created_at, updated_at)
VALUES (
  'bbbbbbbb-0019-4000-8000-000000000019',
  'Manon',
  '1999-11-07',
  'femme',
  'chatain',
  'Vétérinaire passionnée par les animaux. Si tu aimes les chiens, on va bien s''entendre !',
  'dating',
  'disponible_soir',
  ARRAY['fr', 'en'],
  ARRAY['animaux', 'nature', 'randonnee', 'camping', 'photographie'],
  ARRAY['https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400'],
  true,
  48.8700 + (random() * 0.05 - 0.025),
  2.3480 + (random() * 0.05 - 0.025),
  25,
  23,
  32,
  ARRAY['homme'],
  76,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Profil 20: Jordan, 24 ans, Paris (non-binaire)
INSERT INTO profiles (id, display_name, birth_date, gender, hair_color, bio, intention, availability, languages, interests, photos, location_enabled, latitude, longitude, search_radius, min_age_filter, max_age_filter, gender_filter, engagement_score, is_new_user, created_at, updated_at)
VALUES (
  'bbbbbbbb-0020-4000-8000-000000000020',
  'Jordan',
  '2000-07-19',
  'autre',
  'colore',
  'Musicien·ne et compositeur·rice. Je crée des sons et cherche des vibrations positives.',
  'social',
  'disponible_weekend',
  ARRAY['fr', 'en'],
  ARRAY['musique', 'composition', 'concerts', 'festivals', 'vinyles'],
  ARRAY['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'],
  true,
  48.8640 + (random() * 0.05 - 0.025),
  2.3380 + (random() * 0.05 - 0.025),
  30,
  20,
  35,
  ARRAY['homme', 'femme', 'autre'],
  67,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Confirmation
SELECT 'Profils supplémentaires créés!' as message, COUNT(*) as total_profiles
FROM profiles
WHERE id LIKE 'bbbbbbbb-%';
