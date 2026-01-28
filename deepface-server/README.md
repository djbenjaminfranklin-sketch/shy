# SHY DeepFace Verification Server

Serveur de vérification faciale utilisant DeepFace (open-source) pour comparer les photos de profil avec les photos de vérification.

## Coût

- **Serveur**: ~$6-12/mois (Hetzner, DigitalOcean, Railway)
- **Vérifications**: Illimitées

## Déploiement rapide sur Railway (Recommandé)

Railway est le plus simple pour déployer:

### 1. Créer un compte Railway

Aller sur [railway.app](https://railway.app) et créer un compte.

### 2. Déployer depuis GitHub

```bash
# Dans le dossier deepface-server
git init
git add .
git commit -m "DeepFace server"

# Créer un repo GitHub et pusher
gh repo create shy-deepface-server --private --source=. --push
```

Puis sur Railway:
1. New Project → Deploy from GitHub repo
2. Sélectionner `shy-deepface-server`
3. Railway détectera automatiquement le Dockerfile

### 3. Configurer les variables d'environnement

Dans Railway > Variables:
```
API_SECRET=votre-secret-tres-long-et-unique
PORT=8000
```

### 4. Récupérer l'URL

Railway vous donnera une URL comme: `https://shy-deepface-server-production.up.railway.app`

---

## Déploiement sur Hetzner (Moins cher)

### 1. Créer un serveur

- Aller sur [hetzner.com](https://www.hetzner.com/cloud)
- Créer un serveur CX21 (2 vCPU, 4 GB RAM) - ~€5.39/mois
- Choisir Ubuntu 22.04

### 2. Se connecter au serveur

```bash
ssh root@VOTRE_IP_SERVEUR
```

### 3. Installer Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### 4. Cloner et lancer

```bash
git clone https://github.com/VOTRE_REPO/shy-deepface-server.git
cd shy-deepface-server

# Créer le fichier .env
echo "API_SECRET=votre-secret-tres-long-et-unique" > .env

# Lancer
docker-compose up -d
```

### 5. Configurer un domaine (optionnel)

Pour HTTPS, installer Caddy:
```bash
apt install caddy

# Éditer /etc/caddy/Caddyfile
echo "deepface.votredomaine.com {
    reverse_proxy localhost:8000
}" > /etc/caddy/Caddyfile

systemctl restart caddy
```

---

## Test local

```bash
# Construire et lancer
docker-compose up --build

# Tester
curl http://localhost:8000/health

# Tester une vérification
curl -X POST http://localhost:8000/verify \
  -H "Content-Type: application/json" \
  -d '{
    "profile_photo_url": "https://example.com/photo1.jpg",
    "verification_photo_urls": ["https://example.com/photo2.jpg"],
    "user_id": "test-user",
    "api_secret": "shy-verification-secret-change-me"
  }'
```

---

## API Endpoints

### GET /health

Vérifier que le serveur fonctionne.

**Réponse:**
```json
{
  "status": "healthy",
  "model": "ArcFace"
}
```

### POST /verify

Vérifier si les photos de vérification correspondent à la photo de profil.

**Body:**
```json
{
  "profile_photo_url": "https://...",
  "verification_photo_urls": ["https://...", "https://...", "https://..."],
  "user_id": "uuid",
  "api_secret": "votre-secret"
}
```

**Réponse:**
```json
{
  "verified": true,
  "confidence": 92.5,
  "matched_photos": 3,
  "total_photos": 3,
  "details": [
    {"photo_index": 0, "matched": true, "distance": 0.3, "similarity_percent": 95.2},
    {"photo_index": 1, "matched": true, "distance": 0.35, "similarity_percent": 91.8},
    {"photo_index": 2, "matched": true, "distance": 0.32, "similarity_percent": 90.5}
  ]
}
```

---

## Sécurité

- **API_SECRET**: Toujours utiliser un secret long et unique
- **HTTPS**: Toujours utiliser HTTPS en production
- Ne jamais exposer le serveur sans authentification

---

## Performance

- Premier appel: ~5-10 secondes (chargement du modèle)
- Appels suivants: ~1-3 secondes par comparaison
- Le modèle reste en mémoire entre les appels
