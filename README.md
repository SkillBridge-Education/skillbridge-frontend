# SkillBridge — Frontend

Interface React de la plateforme de troc de savoirs peer-to-peer.

## Stack

| Outil | Version | Rôle |
|---|---|---|
| React | 18 | Framework UI |
| Vite | 8 | Build tool |
| Tailwind CSS | 3 | Styling |
| React Router | 6 | Navigation SPA |
| Zustand | 4 | État global (auth, user, credits) |
| Axios | 1 | Appels HTTP vers l'API |
| Socket.IO client | 4 | Temps réel (chat) |
| Vitest + Testing Library | — | Tests |

## Lancer en local

```bash
# Cloner
git clone https://github.com/abidinetou-lgtm/skillbridge-frontend.git
cd skillbridge-frontend

# Installer (corepack fournit pnpm avec Node 20+)
corepack enable
pnpm install

# Configurer l'environnement
cp .env.example .env
# Modifier VITE_API_URL=http://localhost:5000

# Lancer
pnpm dev
# → http://localhost:5173 (port canonique, voir vite.config.js)
```

Le backend (voir `skillbridge-backend`) doit autoriser cette origine dans
`CORS_ORIGIN` pour que les appels API et la connexion Socket.IO fonctionnent.

## Tests

```bash
pnpm test
```

Tests Vitest + React Testing Library (`src/**/*.test.jsx`) : rendu des pages
clés (`HomePage`, `ForgotPassword`), `AuthModal` (login/register, succès et
erreur), et le client `services/api.js` (appels Axios mockés).

## Variables d'environnement

```env
VITE_API_URL=http://localhost:5000
```

En production :
```env
VITE_API_URL=https://jimel-api.octilabs.com
```

## Structure du projet

```
src/
├── components/
│   ├── AuthModal.jsx       # Login / Register modal
│   ├── Navbar.jsx          # Navigation principale
│   ├── MemberCard.jsx      # Card membre dans Connection
│   ├── ProfileModal.jsx    # Modal profil avec grille horaires
│   ├── AvailabilityGrid.jsx
│   └── CookieBanner.jsx
├── pages/
│   ├── HomePage.jsx        # Accueil
│   ├── Register.jsx        # Inscription multi-étapes (4 steps)
│   ├── Connection.jsx      # Découverte des membres par catégorie
│   ├── UserProfile.jsx     # Profil public d'un membre
│   ├── Profile.jsx         # Mon profil (protégé)
│   ├── BecomeSharer.jsx    # Créer son profil donneur
│   ├── Feed.jsx            # Feed communauté
│   ├── Chat.jsx            # Messagerie temps réel (Socket.IO)
│   ├── Sessions.jsx        # Mes sessions (donner / recevoir)
│   ├── NewSession.jsx      # Créer une session
│   ├── SessionRoom.jsx     # Salle de session Jitsi Meet
│   └── Credits.jsx         # Acheter des crédits
├── services/
│   ├── api.js              # Config Axios centralisée
│   └── socket.js           # Client Socket.IO authentifié (JWT)
├── store/
│   └── authStore.js        # État global Zustand
└── data/
    └── categories.js       # Catégories de compétences
```

## Temps réel — Socket.IO

`src/services/socket.js` ouvre une connexion Socket.IO authentifiée avec le
même JWT que les appels REST (`auth: { token }`), consommée dans `Chat.jsx`
pour remplacer le polling par les événements émis par le backend :
`message:new`. Voir le README du backend pour la liste complète des
événements (`notification:new`, `session:update`).

## Branches Git

```
main    → production
dev     → développement commun
feat/*  → features individuelles
fix/*   → corrections de bugs
```

**Avant tout travail :**
```bash
git checkout dev
git pull origin dev
git checkout -b feat/ma-feature
```

**Après :**
```bash
git add .
git commit -m "feat: description claire"
git push origin feat/ma-feature
# Pull Request → dev sur GitHub
```

## Pages et routes

| Route | Page | Accès |
|---|---|---|
| `/` | HomePage | Public |
| `/register` | Register | Public |
| `/connection` | Connection | Public |
| `/user/:id` | UserProfile | Public |
| `/feed` | Feed | Public |
| `/forgot-password` | ForgotPassword | Public |
| `/reset-password` | ResetPassword | Public |
| `/verify-email` | VerifyEmail | Public |
| `/profile` | Profile | Connecté |
| `/become-sharer` | BecomeSharer | Connecté |
| `/sessions` | Sessions | Connecté |
| `/sessions/new` | NewSession | Connecté |
| `/sessions/:id` | SessionRoom | Connecté |
| `/chat` | Chat | Connecté |
| `/credits` | Credits | Connecté |

La connexion se fait via la modale `AuthModal` (ouverte depuis n'importe
quelle page), il n'y a pas de route `/login` dédiée.

## Concept — Système de crédits

- **120 crédits offerts** à l'inscription (= 2 heures)
- **1 crédit = 1 minute** de cours reçu
- Donner un cours → **gagner** des crédits
- Recevoir un cours → **dépenser** des crédits
- Sessions de groupe → **gratuites**
- Crédits transférés automatiquement à la fin de la session

## Sécurité — git-crypt

Ce repo est prévu pour chiffrer `.env`/`.env.*` avec [git-crypt](https://github.com/AGWA/git-crypt)
(voir `.gitattributes`). Tant que `git-crypt init` n'a pas été lancé, ces
règles n'ont aucun effet — le filtre n'est pas encore enregistré. Une fois
initialisé (clé GPG requise) :

```bash
git-crypt init
git-crypt add-gpg-user <TON_KEY_ID>
```

**Ajouter un·e coéquipier·e :** iels génèrent et te partagent leur clé GPG
publique, puis :

```bash
git-crypt add-gpg-user <LEUR_KEY_ID>
```

**Important :** git-crypt ne protège que ce qui est chiffré à partir de son
activation — si `.env` a déjà été commité en clair par le passé, les secrets
qu'il contenait restent compromis dans l'historique et doivent être
régénérés manuellement (rotation), pas seulement chiffrés après coup.

## CI/CD — GitHub Actions

`.github/workflows/ci.yml` : sur chaque PR et push vers `main` — install
pnpm, lint, `vite build`, tests.

`.github/workflows/claude-review.yml` : revue automatique par Claude Code sur
chaque PR (`anthropics/claude-code-action`). Nécessite le secret de repo
`ANTHROPIC_API_KEY` (Settings → Secrets and variables → Actions → New
repository secret) — à créer manuellement, jamais commité en clair.

## Déploiement

Déployé sur **Vercel**.

```bash
npm install -g vercel
vercel
# Variable : VITE_API_URL=https://jimel-api.octilabs.com
```

## Équipe

| Membre | Rôle |
|---|---|
| Jimel Abidine Touré | Lead Frontend |
| Yanis Hocini | Frontend |
