# Guide de Développement

Ce document définit nos conventions de travail pour garantir l'efficacité, la qualité et la maintenabilité de ce projet.

### Nos 3 Principes Clés

- **Pragmatisme** : Nous appliquons des règles utiles qui ont un impact positif direct.
- **Communication** : Une incertitude ? Nous en discutons en équipe avant de continuer.
- **Responsabilité** : Chaque développeur est garant de la qualité et du bon fonctionnement de son code.

---

## Le Cycle de Développement

Chaque nouvelle tâche, qu'il s'agisse d'une fonctionnalité ou d'un correctif, suit ce processus structuré.

### Étape 1 : Développement sur une Branche Dédiée

**Règle fondamentale : ne jamais travailler directement sur la branche `main`.**

1.  **Synchronisez votre branche `main` locale** :
    `git checkout main && git pull origin main`

2.  **Créez une nouvelle branche** (voir conventions ci-dessous).

3.  **Développez la fonctionnalité**. Faites des commits réguliers pour sauvegarder votre progression.

### Étape 2 : Vérification et Documentation

Avant de proposer votre code, deux vérifications sont **impératives**.

#### A. Tests Locaux

1.  Lancez l'environnement : `docker compose up`
2.  Déployez votre version du subgraph : `npm run deploy-local`
3.  Vérifiez l'absence d'erreurs et la cohérence des données.

#### B. Mise à Jour de la Documentation

> **Règle d'or : Tout changement de code doit être reflété dans la documentation du dossier `/docs`.**

### Étape 3 : Intégration du Code via Pull Request

Votre code est prêt, testé et documenté. Il est temps de le partager avec l'équipe.
La PR doit suivre les conventions de nommage et être validée par une revue de code.

---

## Nos Conventions de Nommage

Pour un historique clair et une collaboration fluide, nous suivons une structure simple et prévisible.

### 1. Branches

Le nom de la branche doit indiquer son intention.
**Format :** `<type>/<description-courte>`

- **Exemples :**
  - `feature/gestion-profils-utilisateur`
  - `fix/calcul-incorrect-timestamp`
  - `chore/mise-a-jour-dependances`

### 2. Commits et Titres de Pull Request

Ils doivent suivre le format **Conventional Commits**.
**Format :** `<type>(<scope>): <description>`

| Type           | À utiliser pour...                                    | Exemple de commit                                           |
| :------------- | :---------------------------------------------------- | :---------------------------------------------------------- |
| **`feat`**     | Une nouvelle fonctionnalité                           | `feat(schema): ajoute l'entité NFTMetadata`                 |
| **`fix`**      | La correction d'un bug                                | `fix(mapping): corrige le calcul d'un solde`                |
| **`docs`**     | Des changements dans la documentation                 | `docs(readme): met à jour le guide de déploiement`          |
| **`refactor`** | Une modification du code qui n'ajoute rien de nouveau | `refactor(utils): simplifie la fonction de génération d'ID` |
| **`chore`**    | Des tâches de maintenance (dépendances, scripts...)   | `chore: met à jour la version de graph-cli`                 |

- **Le `(scope)`** est optionnel et précise la zone du code impactée (`schema`, `mapping`, etc.).
- **La `description`** doit être à l'impératif, en minuscule et sans point final.

**Un bon titre de Pull Request suit exactement la même règle.**

---

## ⚠️ Changements Critiques : Discussion Préalable Obligatoire

Pour toute modification sur les fichiers suivants, une **discussion avec l'équipe est requise AVANT de commencer le développement** :

- **`schema.graphql`**
- **`subgraph.yaml`**

Merci de suivre ce guide. Il est la clé d'un projet solide que nous pouvons faire évoluer sereinement.
