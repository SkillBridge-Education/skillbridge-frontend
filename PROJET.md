## SkillBridge

SkillBridge est une plateforme d'échange de compétences entre pairs. On y
enseigne ce qu'on sait et on apprend ce qu'on ignore, sans argent : la monnaie
est le temps.

**1 crédit = 1 minute d'enseignement.** Chaque compte reçoit 120 crédits à
l'inscription, plafonnés à 500. Les crédits sont débités à l'acceptation d'une
session et versés à l'enseignant à la fin, au temps réellement écoulé — le
reliquat est remboursé.

### Deux univers

La plateforme a deux modes qui ne se comportent pas pareil.

**Compte personnel** — l'échange entre particuliers, avec l'économie de crédits
décrite ci-dessus.

**Mon établissement** — un espace fermé pour une école. Les cours y sont un
service de l'établissement, pas un échange marchand : **aucun crédit
n'intervient**. Un élève ne choisit pas ses compétences à l'inscription, c'est
l'école qui déclare son domaine. On y entre avec un identifiant délivré par
l'établissement (`PROF-XXXXXX`, `STU-XXXXXX`), lié à une adresse e-mail précise.

### Ce qui contraint tout le reste

Le public compte des **mineurs de 15 à 18 ans**, et la plateforme est soumise au
**RGPD** et au **DSA**. Ce n'est pas une note de bas de page : c'est ce qui
décide, en cas de doute, de la façon de trancher.

Concrètement, cela veut dire qu'une fonctionnalité de sécurité qui *semble*
fonctionner sans fonctionner est plus grave qu'une fonctionnalité absente. Un
bouton « Bloquer » qui écrit une ligne en base sans rien empêcher est pire que
pas de bouton du tout : il promet une protection qui n'existe pas.

### Les quatre dépôts

| Dépôt | Rôle |
|---|---|
| `skillbridge-backend` | L'API. Toute la logique métier, la base, les sockets. Seule source de vérité. |
| `skillbridge-frontend` | Le site public. Inscription, découverte, sessions, chat. |
| `skillbridge-mobile` | L'application Expo / React Native. C'est là que se fait l'essentiel des tests réels. |
| `skillbridge-admin` | Le back-office. Modération, recours, établissements, audit. |

Le backend est en amont de tout : un changement de contrat d'API s'y décide, et
les trois clients suivent.

### Le rôle de ce dépôt

C'est **le site public** : la porte d'entrée pour qui découvre SkillBridge
depuis un navigateur.

React 18, Vite, JavaScript (pas TypeScript), Tailwind, Zustand, i18next en
français et en anglais.

Il consomme l'API et ne décide de rien : aucune règle métier ne doit s'écrire
ici. Si une valeur est calculée à deux endroits, c'est le backend qui a raison.

Deux exigences propres à ce dépôt :

- **Aucun bouton mort.** Un contrôle désactivé avec « bientôt disponible » alors
  que la route existe côté serveur est un défaut. C'est déjà arrivé sur les
  droits RGPD, indisponibles des mois durant alors qu'ils fonctionnaient, à
  cause d'un commentaire périmé que personne n'avait vérifié.
- **Tout texte passe par i18next**, dans les deux langues.

### Où trouver le reste

- `CONTRIBUTING.md` — le circuit de contribution, les branches, la CI.
- `AGENTS.md` — les consignes pour les assistants IA qui écrivent ici.
