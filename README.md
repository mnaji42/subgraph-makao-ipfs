# Makao Subgraph

## Aperçu

Le Subgraph Makao est un projet développé avec The Graph Protocol pour indexer et organiser les données de la blockchain liées à l'écosystème Makao. Il écoute les événements émis par nos contrats intelligents et les transforme en une API GraphQL structurée, permettant d'interroger efficacement les données on-chain.

Ce projet suit les meilleures pratiques pour le développement de modèles de données afin d'assurer la flexibilité et la cohérence.

## Table des matières

- [Fonctionnalités Clés](#fonctionnalités-clés)
- [Démarrage Rapide](#démarrage-rapide)
- [Documentation Complète](#documentation-complète)
- [Structure du Projet](#structure-du-projet)
- [Directives de Développement](#directives-de-développement)
- [Licence](#licence)

## Fonctionnalités Clés

- **Indexation des contrats :** Indexe les événements des principaux contrats de l'écosystème Makao (`MakaoFactory`, `MakaoFixture`).
- **Schéma de données optimisé :** Entités `Market`, `Engagement`, `MarketMetadata`, etc., conçues pour séparer clairement les données on-chain et off-chain.
- **Intégration IPFS Asynchrone :** Récupère les métadonnées riches depuis IPFS de manière robuste, sans jamais bloquer l'indexation.
- **API GraphQL :** Fournit un point d'accès unique et simple pour accéder à toutes les données de l'écosystème.

## Démarrage Rapide

### Prérequis

Assurez-vous d'avoir les outils suivants installés :

- **Git**
- **Node.js** (v18+) et **npm**
- **Docker** et **Docker Compose**
- **Graph CLI** (`npm install -g @graphprotocol/graph-cli`)

### Installation et Déploiement Local

1. **Cloner le dépôt :**

```bash
git clone https://github.com/mnaji42/subgraph-makao-ipfs.git
cd subgraph-makao-ipfs
```

2. **Installer les dépendances :**

```bash
npm install
```

3. **Lancer l'environnement local (dans un premier terminal) :**

```bash
docker compose up
```

4. **Créer et déployer le subgraph localement (dans un second terminal) :**

```bash
npm run create-local
npm run deploy-local
```

Pour des instructions détaillées, consultez le [guide de déploiement complet](./docs/04-deployment.md).

## Documentation Complète

La documentation technique complète est centralisée dans le dossier `/docs`. Elle est essentielle pour comprendre en profondeur l'architecture et la logique du subgraph.

- **[📄 1. Introduction](./docs/01-introduction.md)** : Objectifs et périmètre du subgraph.
- **[🏗️ 2. Architecture](./docs/02-architecture.md)** : Vue d'ensemble du flux de données, des contrats aux requêtes GraphQL.
- **[⚙️ 3. Détails Techniques](./docs/03-subgraph-details/)** :
  - **[Schéma GraphQL](./docs/03-subgraph-details/01-schema-graphql.md)** : Description des entités et de leurs relations.
  - **[Sources de Données](./docs/03-subgraph-details/02-data-sources.md)** : Configuration des contrats et événements écoutés.
  - **[Logique des Mappings](./docs/03-subgraph-details/03-mappings/00-overview.md)** : **(Point de départ)** Explication détaillée de chaque fonction de mapping (handler).
- **[🚀 4. Déploiement](./docs/04-deployment.md)** : Procédures de déploiement sur différents environnements.
- **[❓ 5. Comment Interroger les Données](./docs/05-how-to-query.md)** : Exemples de requêtes GraphQL.
- **[📝 6. Contribution](./docs/06-contributing.md)** : Guide des bonnes pratiques pour contribuer au projet.

## Structure du Projet

```
.
├── abis/              # ABIs des contrats intelligents
├── docs/              # Documentation complète du projet
├── generated/         # Fichiers et types générés par The Graph CLI
├── src/               # Code source des mappings (AssemblyScript)
├── subgraph.yaml      # Le fichier manifeste du subgraph
├── schema.graphql     # Le schéma de données GraphQL
└── package.json       # Dépendances et scripts du projet
```

## Directives de Développement

Ce projet est développé en interne. Pour assurer la qualité et la cohérence du code, tous les développeurs travaillant sur ce subgraph sont priés de suivre les bonnes pratiques ci-dessous.

- **Gestion des branches** : Tout développement doit se faire sur une branche dédiée (`feature/...`, `fix/...`). Ne jamais commit directement sur `main`.
- **Tests** : Avant de soumettre une Pull Request, assurez-vous que le subgraph se déploie et s'indexe correctement en local.
- **Documentation** : **Toute modification du code** (ajout d'un handler, modification d'une entité) **doit être accompagnée d'une mise à jour de la documentation** correspondante dans le dossier `/docs`.
- **Pull Requests** : Décrivez clairement les changements effectués dans la description de la PR.

Pour des directives plus détaillées, veuillez consulter le [**guide de contribution interne**](./docs/06-contributing.md).

## Licence

Ce projet est sous licence MIT.
