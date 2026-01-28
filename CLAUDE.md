# SHY - Guide Claude Code

## Vue d'Ensemble du Projet

**SHY** est une application mobile de rencontres sociale pour adultes consentants (18+), conforme Apple/GDPR.

### Stack Technique
- **React Native** + **Expo** SDK 52+
- **TypeScript** strict
- **Expo Router** (file-based routing)
- **Backend**: Supabase (à configurer)

### Build Info
- iOS Bundle ID: `eu.shydating.app`
- Android Package: `eu.shydating.app`
- Theme: Light mode (couleurs chaudes)

---

## Structure du Projet

```
SHY/
├── app/                          # Écrans Expo Router
│   ├── (auth)/                   # Authentification
│   │   ├── welcome.tsx           # Écran d'accueil
│   │   ├── login.tsx             # Connexion
│   │   ├── register.tsx          # Inscription
│   │   ├── verify-age.tsx        # Vérification 18+
│   │   └── forgot-password.tsx   # Mot de passe oublié
│   ├── (onboarding)/             # Configuration profil
│   │   ├── profile-photo.tsx     # Photo de profil
│   │   ├── basic-info.tsx        # Infos de base
│   │   ├── intention.tsx         # Choix intention
│   │   ├── interests.tsx         # Centres d'intérêt
│   │   └── location-consent.tsx  # Consentement géoloc
│   ├── (tabs)/                   # Navigation principale
│   │   ├── discover.tsx          # Découverte (swipe)
│   │   ├── matches.tsx           # Liste matchs
│   │   ├── messages.tsx          # Conversations
│   │   └── profile.tsx           # Mon profil
│   ├── chat/                     # Chat privé
│   ├── profile/                  # Profils & paramètres
│   ├── legal/                    # CGU, confidentialité
│   └── moderation/               # Signalement
├── src/
│   ├── components/               # Composants réutilisables
│   ├── contexts/                 # State global
│   ├── services/                 # API Supabase
│   ├── hooks/                    # Hooks personnalisés
│   ├── types/                    # Types TypeScript
│   ├── constants/                # Constantes app
│   ├── theme/                    # Design tokens
│   └── utils/                    # Utilitaires
└── assets/                       # Images, icônes
```

---

## Commandes de Développement

```bash
# Installation
yarn install

# Développement
npx expo start           # Serveur de dev
npx expo start --ios     # iOS
npx expo start --android # Android
npx expo start --clear   # Nettoyer cache

# Type check
npx tsc --noEmit
```

---

## Fonctionnalités Clés

### Géolocalisation
- Désactivée par défaut
- Activation volontaire uniquement
- Distance approximative seulement
- Bouton "Masquer ma position"

### Filtres Autorisés
- Rayon de recherche (5, 25, 50 km)
- Âge
- Genre
- Couleur de cheveux
- Centres d'intérêt
- Langue
- Intention

### Intentions (OBLIGATOIRE)
- Social / discuter
- Dating
- Rencontres amicales
- Découvrir des gens localement

### Disponibilité
- "Disponible aujourd'hui"
- "Disponible cet après-midi"
- "Disponible ce soir"
- "Disponible ce week-end"

### Modération
- Signalement utilisateur
- Blocage
- Suppression compte immédiate
- Suppression données GDPR

---

## Design System

### Couleurs (chaudes)
```typescript
primary: '#FF6B6B'      // Corail vif
secondary: '#FFB347'    // Orange doux
accent: '#FF85A2'       // Rose doux
background: '#FFF9F5'   // Crème chaud
```

### Couleurs Intentions
```typescript
intentionSocial: '#64B5F6'  // Bleu
intentionDating: '#FF6B6B'  // Corail
intentionAmical: '#81C784'  // Vert
intentionLocal: '#FFB347'   // Orange
```

---

## Mentions Légales

### Disclaimer Obligatoire
> "Cette application est une plateforme sociale de mise en relation entre adultes consentants. Elle ne propose ni ne facilite aucun service sexuel rémunéré."

### Conformité
- Apple App Store ✅
- GDPR ✅
- Pas assimilable à prostitution ✅

---

## Prochaines Étapes

1. [ ] Configurer Supabase (auth, database, realtime)
2. [ ] Implémenter AuthContext
3. [ ] Créer les services API
4. [ ] Implémenter le système de swipe
5. [ ] Ajouter la messagerie temps réel
6. [ ] Tests et optimisation

---

## Règles Importantes

### À FAIRE
- TypeScript strict (pas de `any`)
- Vérification âge 18+ obligatoire
- Intention obligatoire sur chaque profil
- Géoloc opt-in uniquement

### À NE PAS FAIRE
- ❌ Filtres horaires précis
- ❌ Rencontre immédiate
- ❌ Critères sexuels explicites
- ❌ Incitation à rencontrer
- ❌ Négociation
