# Face Verification Edge Function

Cette Edge Function utilise AWS Rekognition pour comparer les photos de vérification avec la photo de profil et détecter les faux profils.

## Prérequis

1. **Compte AWS** avec accès à Rekognition
2. **Clés d'accès AWS** (IAM user avec permissions Rekognition)

## Configuration AWS

### 1. Créer un utilisateur IAM

1. Aller sur AWS Console > IAM > Users
2. Créer un nouvel utilisateur (ex: `shy-rekognition`)
3. Attacher la politique `AmazonRekognitionFullAccess`
4. Créer des clés d'accès (Access Key ID + Secret Access Key)

### 2. Configurer les secrets Supabase

```bash
# Installer Supabase CLI si pas déjà fait
npm install -g supabase

# Se connecter
supabase login

# Lier au projet
supabase link --project-ref YOUR_PROJECT_REF

# Ajouter les secrets
supabase secrets set AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
supabase secrets set AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set AWS_REGION=eu-west-1
```

## Déploiement

```bash
# Depuis le dossier racine du projet
supabase functions deploy verify-face
```

## Test

```bash
# Tester localement
supabase functions serve verify-face --env-file ./supabase/.env.local

# Appeler la fonction
curl -X POST http://localhost:54321/functions/v1/verify-face \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "profilePhotoUrl": "https://example.com/profile.jpg",
    "verificationPhotoUrls": ["https://example.com/verify1.jpg", "https://example.com/verify2.jpg"],
    "userId": "user-uuid"
  }'
```

## Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `profilePhotoUrl` | string | URL de la photo de profil |
| `verificationPhotoUrls` | string[] | URLs des photos de vérification (3 photos) |
| `userId` | string | UUID de l'utilisateur |

## Réponse

```json
{
  "verified": true,
  "confidence": 95.5,
  "matchedPhotos": 3,
  "totalPhotos": 3,
  "details": [
    { "photoIndex": 0, "matched": true, "similarity": 96.2 },
    { "photoIndex": 1, "matched": true, "similarity": 94.8 },
    { "photoIndex": 2, "matched": true, "similarity": 95.5 }
  ]
}
```

## Seuils de vérification

- **Seuil de similarité**: 85% (configurable dans `SIMILARITY_THRESHOLD`)
- **Photos minimum**: 2/3 doivent correspondre (configurable dans `MIN_MATCHING_PHOTOS`)

## Coûts AWS Rekognition

- ~$1 pour 1000 comparaisons de visages
- Chaque vérification = 3 comparaisons
- Donc ~$1 pour ~333 vérifications

## Sécurité

- Les clés AWS sont stockées en tant que secrets Supabase (jamais exposées côté client)
- La comparaison se fait côté serveur uniquement
- Les photos de vérification sont stockées temporairement et peuvent être supprimées après vérification
