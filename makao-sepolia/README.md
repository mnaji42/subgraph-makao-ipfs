# Makao Subgraph - Local Development Guide

Ce guide explique comment configurer et exécuter le subgraph Makao en local pour le développement et les tests.

## Prérequis

Avant de commencer, assurez-vous d'avoir les éléments suivants installés sur votre machine :

*   **Git**
*   **Node.js** (version 18 ou supérieure recommandée)
*   **npm** ou **Yarn** (npm est utilisé dans ce guide)
*   **Docker** et **Docker Compose** (pour exécuter les services locaux Graph Node, IPFS et PostgreSQL)
*   **Graph CLI** (`npm install -g @graphprotocol/graph-cli`)

## 1. Cloner le dépôt

Si ce n'est pas déjà fait, clonez le dépôt du projet :

```bash
git clone https://github.com/mnaji42/subgraph-makao-ipfs.git
```

## 2. Installer les dépendances

Naviguez dans le répertoire du subgraph et installez les dépendances Node.js :

```bash
npm install
```

## 3. Démarrer les services locaux (Graph Node, IPFS, PostgreSQL)

Le subgraph nécessite un Graph Node local, un service IPFS et une base de données PostgreSQL pour fonctionner. Ceux-ci sont configurés via Docker Compose. Assurez-vous que Docker est en cours d'exécution.

Dans le répertoire `makao-sepolia`, lancez les services Docker :

```bash
docker compose up
```

Laissez cette fenêtre de terminal ouverte, car les services doivent rester en cours d'exécution.

## 4. Créer le subgraph localement

Dans une **nouvelle fenêtre de terminal**,

Vous devez d'abord créer le subgraph sur votre Graph Node local. Le nom du subgraph est `makao-sepolia`.

```bash
npm run create-local
```

Cette commande utilise le script `create-local` défini dans votre `package.json`, qui exécute `graph create --node http://localhost:8020/ makao-sepolia`.

## 5. Construire le subgraph

Compilez le code AssemblyScript de votre subgraph :

```bash
npm run build
```

Cette commande générera les fichiers optimisés nécessaires au déploiement.

## 6. Déployer le subgraph localement

Maintenant, déployez le subgraph sur votre Graph Node local :

```bash
npm run deploy-local
```

Cette commande utilise le script `deploy-local` défini dans votre `package.json`, qui exécute `graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001/ makao-sepolia`.

Si le déploiement est réussi, vous verrez une URL de l'interface utilisateur du Graph Node local (par exemple, `http://localhost:8000/subgraphs/name/makao-sepolia/graphql`) où vous pourrez interroger votre subgraph.

## 7. Arrêter les services locaux

Lorsque vous avez terminé de travailler sur le subgraph, vous pouvez arrêter les services Docker en revenant à la fenêtre de terminal où `docker compose up` est en cours d'exécution et en appuyant sur `Ctrl+C`. Pour supprimer les conteneurs et les volumes (et donc les données de la base de données et d'IPFS), utilisez :

```bash
docker compose down -v
```

---

N'hésitez pas si vous avez d'autres questions ou si vous rencontrez des problèmes lors de ces étapes !