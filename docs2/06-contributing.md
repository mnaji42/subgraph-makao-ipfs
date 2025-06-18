# Guide de Développement Interne

Ce document a pour but de définir nos conventions de travail pour garantir que le projet reste cohérent, maintenable et de haute qualité.

## Philosophie

- **Pragmatisme avant tout** : Appliquons les règles qui ont du sens pour nous.
- **Communication** : Une question ou une incertitude ? On en parle avant de passer des heures à coder.
- **Responsabilité** : Chaque développeur est responsable de la qualité et de l'impact de son code.

## Workflow de Développement

Chaque nouvelle fonctionnalité ou correctif doit suivre ce processus simple en 6 étapes.

#### 1. Créer une Branche

Ne travaillez jamais directement sur la branche `main`. Partez toujours d'une version à jour de `main` pour créer votre branche.

Utilisez une convention de nommage claire :

- **`feature/<nom-feature>`** pour une nouvelle fonctionnalité (ex: `feature/add-nft-metadata`).
- **`fix/<nom-bug>`** pour un correctif (ex: `fix/user-balance-calculation`).
- **`chore/<tache>`** pour la maintenance, la documentation, etc. (ex: `chore/update-dependencies`).

```


# 1. Se mettre à jour avec la branche principale

git checkout main
git pull origin main

# 2. Créer sa branche

git checkout -b feature/nom-de-la-feature

```

#### 2. Développer

Codez votre fonctionnalité ou votre correctif. N'hésitez pas à faire des commits réguliers sur votre branche pour sauvegarder votre progression.

#### 3. Tester Localement

Avant de considérer votre travail comme terminé, il est **impératif** de le tester localement.

1.  Lancez l'environnement avec `docker compose up`.
2.  Déployez votre version du subgraph avec `npm run deploy-local`.
3.  Vérifiez que l'indexation se déroule sans erreur et que les données interrogées via l'interface GraphiQL locale sont correctes.

#### 4. Documenter vos Changements

La documentation est aussi importante que le code.

> **Règle d'or : tout changement de logique métier, d'entité ou de handler doit être reflété dans la documentation du dossier `/docs`.**

Si vous modifiez le `handleSetAttribute`, mettez à jour `docs/03-subgraph-details/03-mappings/02-handleSetAttribute.md`. C'est simple, rapide, et crucial pour l'équipe.

#### 5. Faire des Commits Propres

Utilisez le format "Conventional Commits". C'est une convention simple qui rend l'historique Git lisible et nous prépare à une automatisation future.

Format : `<type>(<scope>): <sujet>`

- **`feat`** : Nouvelle fonctionnalité.
- **`fix`** : Correction de bug.
- **`docs`** : Changement dans la documentation.
- **`style`** : Changement de style de code (formatage, etc.).
- **`refactor`** : Refactoring de code sans changement de fonctionnalité.
- **`test`** : Ajout ou modification de tests.
- **`chore`** : Tâches de maintenance.

**Exemples :**

```

feat(entities): add support for optional NFT metadata
fix(mapping): correct timestamp conversion for Instance creation
docs(readme): update deployment instructions

```

#### 6. Créer une Pull Request (PR)

Une fois que votre branche est prête, poussez-la sur le dépôt et ouvrez une Pull Request vers la branche `main`.

## Processus de Pull Request

La Pull Request est notre principal outil de revue de code et de validation.

#### Titre et Description

- **Titre clair** : Le titre de votre PR doit être explicite (ex: `feat: Add User profile entity`).
- **Description utile** : Utilisez un modèle simple pour décrire votre PR :
  - **Objectif** : Qu'est-ce que cette PR accomplit ? Pourquoi est-elle nécessaire ?
  - **Changements techniques** : Un résumé des modifications apportées.
  - **Comment tester** : Quelques étapes pour que le relecteur puisse valider votre travail.

#### Revue de Code

- Au moins **un autre développeur** doit relire et approuver votre PR.
- La revue a pour but d'améliorer la qualité du code, de partager la connaissance et de détecter les éventuels problèmes. Soyez ouvert aux commentaires et constructif dans vos retours.

#### Fusion (Merge)

- Une fois la PR approuvée, c'est à **l'auteur de la PR** de la fusionner dans `main`.
- Cochez l'option "Delete branch after merging" pour garder le dépôt propre.

## Gérer les Changements Critiques

Certains fichiers sont plus sensibles que d'autres.

- **`schema.graphql`** : Toute modification sur ce fichier a un impact majeur sur toute la structure de données. **Discutez-en avec l'équipe AVANT de commencer à coder.**
- **`subgraph.yaml`** : L'ajout d'un contrat, d'une source de données ou d'un handler doit également faire l'objet d'une discussion préalable.

Merci de suivre ces directives pour que nous puissions construire ensemble un projet solide et agréable à maintenir !
