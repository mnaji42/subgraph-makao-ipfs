# Makao Subgraph

## Aperçu

Le Subgraph Makao est un projet développé avec The Graph Protocol pour indexer et organiser les données de la blockchain liées à l'écosystème Makao. Il écoute les événements émis par nos contrats intelligents et les transforme en une API GraphQL structurée, permettant d'interroger efficacement les données on-chain.

Ce projet suit les meilleures pratiques pour le développement de modèles de données afin d'assurer la flexibilité et la cohérence [^7].

## Table des matières

- [Fonctionnalités Clés](#fonctionnalit%C3%A9s-cl%C3%A9s)
- [Démarrage Rapide](#d%C3%A9marrage-rapide)
- [Documentation Complète](#documentation-compl%C3%A8te)
- [Structure du Projet](#structure-du-projet)
- [Contribuer](#contribuer)
- [Licence](#licence)

## Fonctionnalités Clés

- **Indexation des contrats :** Indexe les événements des contrats X, Y, Z.
- **Schéma de données optimisé :** Entités `User`, `Transaction`, etc., conçues pour des requêtes performantes.
- **API GraphQL :** Fournit un point d'accès unique et simple pour accéder aux données de l'écosystème.

## Démarrage Rapide

### Prérequis

Assurez-vous d'avoir les outils suivants installés :

- **Git**
- **Node.js** (v18+)
- **npm** ou **Yarn**
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

Pour des instructions détaillées, consultez le [guide de déploiement local](./docs/04-deployment.md).

## Documentation Complète

Pour une compréhension approfondie du projet, de son architecture et de son fonctionnement technique, veuillez consulter notre **[documentation complète dans le dossier /docs](./docs)**. Vous y trouverez des informations détaillées sur le schéma, les mappings et la manière d'interroger les données [^3].

## Structure du Projet

Une vue d'ensemble de la structure des dossiers du projet [^1] :

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

## Licence

Ce projet est sous licence MIT.
