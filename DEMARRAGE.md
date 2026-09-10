# Démarrer sur ce dépôt

De « je clone » à « les tests passent chez moi ». Compte trente minutes la
première fois.

Ce dépôt contient **le site public**. Pour ce qu'est SkillBridge et comment les
quatre dépôts s'articulent, lis `PROJET.md`.

## 1. Ce dont tu as besoin

- **Node 22** — la version exacte est dans `.nvmrc`. Avec nvm : `nvm use`.
- **pnpm 11.9.0** — `corepack enable` suffit.
- **Le backend qui tourne**, sinon toutes les pages resteront vides.

Vérifie ce que tu as :

```bash
node --version      # doit afficher v22.x
pnpm --version      # doit afficher 11.9.0
```

Si `pnpm` est absent : `corepack enable`, puis rouvre ton terminal.

## 2. Récupérer le code

```bash
git clone https://github.com/SkillBridge-Education/skillbridge-frontend.git
cd skillbridge-frontend
git checkout develop      # on ne travaille jamais depuis main
pnpm install
```

## 3. Les secrets

Les fichiers `.env` sont **chiffrés par git-crypt**. Sans la clé tu verras du
binaire à leur place : c'est normal, ce n'est pas une corruption.

Demande la clé à Jimel — jamais par un ticket, un commit ou une conversation
publique. Puis :

```bash
git-crypt unlock /chemin/vers/la/cle
```

Tu peux travailler sans la clé en partant de `.env.example`, ce que décrit
l'étape suivante.

## 4. Le fichier `.env`

```bash
cp .env.example .env
```

| Variable | Ce que c'est |
|---|---|
| `VITE_API_URL` | `http://localhost:5000` — l'API. C'est la seule variable que ce dépôt lit. |

Rien ici n'est secret : Vite **inline** ces valeurs dans le bundle envoyé au
navigateur. N'y mets jamais une clé.

## 5. Lancer

```bash
pnpm run dev        # http://localhost:5173
```

## 6. Vérifier que tout marche

Ces commandes sont **exactement** celles que la CI exécute. Si elles passent chez
toi, elles passeront sur la pull request.

```bash
pnpm run lint
pnpm test
pnpm run build
```

Lance-les **avant chaque push**, pas après. Une CI rouge qu'on découvre à
l'ouverture d'une PR coûte du temps à toute l'équipe, et la faire passer par
essais successifs en coûte encore plus.

## 7. Les pièges de ce dépôt

**Aucun bouton mort.** Un contrôle désactivé avec « bientôt disponible » alors
que la route existe côté serveur est un défaut, pas une précaution. Les droits
RGPD sont restés indisponibles des mois pour cette raison : un commentaire
périmé annonçait des routes manquantes qui fonctionnaient très bien.

**Tout texte passe par i18next**, en français et en anglais. Une chaîne écrite
en dur dans le JSX ne sera jamais traduite.

**Aucune règle métier ici.** Si une valeur est calculée à deux endroits, c'est
le backend qui a raison.

## 8. Quand quelque chose ne marche pas

**Ne relance pas un job de CI sans avoir lu pourquoi il a échoué.**

```bash
gh run list --limit 5
gh run view <ID> --log-failed
```

Sur une pull request :

```bash
gh pr checks <numéro>
gh pr view <numéro> --comments
```

## Et ensuite

- `CONTRIBUTING.md` — le circuit `develop → staging → main`, les messages de
  commit, comment ouvrir une pull request.
- `AGENTS.md` — les mêmes règles, écrites pour un assistant IA.
- `PROJET.md` — ce qu'est SkillBridge et le rôle de ce dépôt.
