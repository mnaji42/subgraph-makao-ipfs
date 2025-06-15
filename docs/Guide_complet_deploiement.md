# Guide Complet pour Déployer un Subgraph Alchemy avec IPFS - Makao (Juin 2025)

## Table des matières

- [Introduction](#introduction)
- [Préparation de l'environnement](#pr%C3%A9paration-de-lenvironnement)
- [Structure du projet](#structure-du-projet)
- [Création des fichiers du subgraph](#cr%C3%A9ation-des-fichiers-du-subgraph)
- [Intégration IPFS](#int%C3%A9gration-ipfs)
- [Déploiement et monitoring](#d%C3%A9ploiement-et-monitoring)
- [Bonnes pratiques et optimisations](#bonnes-pratiques-et-optimisations)
- [Ressources additionnelles](#ressources-additionnelles)

## Introduction

Ce guide complet vous permettra de déployer un subgraph Alchemy pour votre plateforme Makao, en indexant vos contrats avec un pattern factory et en intégrant des métadonnées IPFS [^1]. Alchemy Subgraphs offre une indexation jusqu'à 5x plus rapide et une réduction de 50% de la latence des données par rapport aux solutions traditionnelles [^2].

## Préparation de l'environnement

### Outils requis

- **Node.js v16+** (installation via `nvm`)
- **The Graph CLI** (dernière version compatible)
- **Compte Alchemy** avec clé API de déploiement [^3]

### Installation des outils

```bash
# Installation de The Graph CLI
npm install -g @graphprotocol/graph-cli@latest

# Vérification de l'installation
graph --version
```

### Informations nécessaires

Avant de commencer, assurez-vous d'avoir les informations suivantes:

1. Adresse du contrat factory `EventContractInstance` [^4] => 0xfc58FefaDA53D508FD584278B8EED8e7A02c34B2
2. Block de déploiement du contrat factory => 8553252
3. Réseau blockchain utilisé (Ethereum, Polygon, etc.) => sepolia
4. ABIs des contrats à jour (EventContractInstance et MakaoFixture) [^5]

## Structure du projet

Créez la structure de dossiers suivante pour votre projet de subgraph [^5][^6]:

```
makao-subgraph/
├── abis/                      # ABIs des contrats
│   ├── EventContractInstance.js
│   └── MakaoFixture.js
├── src/                       # Code source des mappings
│   ├── mappings/
│   │   ├── factory.ts
│   │   ├── market.ts
│   │   └── utils.ts
├── config/                    # Configuration du réseau et adresses
│   └── addresses.json
├── ipfs-examples/             # Exemples de métadonnées IPFS
│   └── market-metadata.json
├── subgraph.yaml              # Manifest du subgraph
├── schema.graphql             # Schéma GraphQL
├── package.json               # Dépendances npm
├── tsconfig.json              # Configuration TypeScript
└── README.md                  # Documentation
```

Commençons par installer les dépendances nécessaires [^6][^7]:

```bash
# Création du projet
mkdir makao-subgraph && cd makao-subgraph

# Initialisation du package.json
npm init -y

# Installation des dépendances
npm install --save-dev @graphprotocol/graph-ts typescript ts-node
```

## Création des fichiers du subgraph

### 1. Fichier package.json

Créez ou mettez à jour votre `package.json` avec le contenu suivant [^6]:

```json
{
  "name": "makao-subgraph",
  "version": "0.1.0",
  "description": "Subgraph pour indexer les marchés Makao",
  "scripts": {
    "codegen": "graph codegen",
    "build": "graph build",
    "deploy": "graph deploy --node https://subgraphs.alchemy.com/api/subgraphs/deploy --ipfs https://ipfs.satsuma.xyz",
    "deploy-prod": "graph deploy makao-subgraph --version-label prod-$(date +%Y%m%d-%H%M%S) --node https://subgraphs.alchemy.com/api/subgraphs/deploy --deploy-key YOUR_DEPLOY_KEY --ipfs https://ipfs.satsuma.xyz"
  },
  "dependencies": {
    "@graphprotocol/graph-ts": "^0.32.0"
  },
  "devDependencies": {
    "@graphprotocol/graph-cli": "^0.67.2",
    "typescript": "^5.2.2"
  }
}
```

### 2. Fichier tsconfig.json

Créez un fichier `tsconfig.json` à la racine du projet [^5]:

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "noImplicitAny": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*", "generated/**/*"],
  "exclude": ["node_modules", "build", "dist"]
}
```

### 3. Fichier schema.graphql

Ce fichier définit le modèle de données que votre subgraph exposera via GraphQL [^5][^8]:

```graphql
type Market @entity {
  id: ID!
  title: String! # Récupéré depuis IPFS
  description: String! # Récupéré depuis IPFS
  image: String! # Récupéré depuis IPFS
  owner: Bytes!
  stakeToken: Bytes!
  engagementDeadline: BigInt!
  resolutionDeadline: BigInt!
  creatorFee: BigInt!
  predictionCount: BigInt!
  totalAmount: BigInt!
  createdAt: BigInt!
  isCancelled: Boolean!
  isResolved: Boolean!
  winningChallenges: [BigInt!]
  challenges: [Challenge!]! @derivedFrom(field: "market")
  engagements: [Engagement!]! @derivedFrom(field: "market")
  collections: [Collection!]! @derivedFrom(field: "market")
  events: [MarketEvent!]! @derivedFrom(field: "market")
}

type Challenge @entity {
  id: ID!
  challengeId: BigInt!
  market: Market!
  totalAmount: BigInt!
  isWinner: Boolean
  engagements: [Engagement!]! @derivedFrom(field: "challenge")
}

type Engagement @entity {
  id: ID!
  user: User!
  market: Market!
  challenge: Challenge!
  amount: BigInt!
  timestamp: BigInt!
  hasCollected: Boolean!
  referrer: Bytes
}

type Collection @entity {
  id: ID!
  user: User!
  market: Market!
  amount: BigInt!
  timestamp: BigInt!
  recipient: Bytes!
}

type User @entity {
  id: ID!
  engagements: [Engagement!]! @derivedFrom(field: "user")
  collections: [Collection!]! @derivedFrom(field: "user")
  marketsCreated: [Market!]
  totalStaked: BigInt!
  totalCollected: BigInt!
  firstActivityAt: BigInt!
  lastActivityAt: BigInt!
}

type MarketEvent @entity {
  id: ID!
  title: String!
  description: String!
  market: Market!
}

type GlobalStat @entity {
  id: ID!
  totalMarkets: BigInt!
  totalUsers: BigInt!
  totalVolume: BigInt!
  activeMarkets: BigInt!
  resolvedMarkets: BigInt!
  cancelledMarkets: BigInt!
}
```

### 4. Fichier subgraph.yaml

Ce manifest définit comment votre subgraph indexera les données blockchain [^5][^8][^9]:

```yaml
specVersion: 1.3.0
features:
  - ipfs
  - nonDeterministicIpfs
indexerHints:
  prune: auto

description: Subgraph Alchemy pour indexer les marchés Makao
repository: https://github.com/mnaji42/subgraph-makao-ipfs.git

schema:
  file: ./schema.graphql

dataSources:
  - kind: ethereum
    name: EventContractInstance
    network: sepolia # Changez selon votre réseau (mainnet, polygon, etc.)
    source:
      address: "0x5accdde8c2137B231d5cFEbc80Ccc52E9A200674" # Remplacez par l'adresse de votre factory
      abi: EventContractInstance
      startBlock: 4500000 # Remplacez par le bloc de déploiement du contrat
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Market
        - User
        - GlobalStat
      abis:
        - name: EventContractInstance
          file: ./abis/EventContractInstance.json
        - name: MakaoFixture
          file: ./abis/MakaoFixture.json
      eventHandlers:
        - event: CreateInstance(indexed address,bytes)
          handler: handleCreateInstance
      file: ./src/mappings/factory.ts

templates:
  - kind: ethereum
    name: MakaoFixture
    network: sepolia # Même réseau que la datasource principale
    source:
      abi: MakaoFixture
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Market
        - Challenge
        - Engagement
        - Collection
        - User
        - GlobalStat
        - MarketEvent
      abis:
        - name: MakaoFixture
          file: ./abis/MakaoFixture.json
      eventHandlers:
        - event: EngageChallenge(address,uint256,uint256)
          handler: handleEngageChallenge
        - event: EventCancelled()
          handler: handleEventCancelled
        - event: ExitEvent(indexed address,address,uint256)
          handler: handleExitEvent
        - event: ResolveEvent(uint256[])
          handler: handleResolveEvent
      file: ./src/mappings/market.ts
```

### 5. Dossier src/mappings/

#### factory.ts

Ce fichier gère l'indexation des nouveaux marchés créés par le factory [^10][^11][^9]:

```typescript
import {
  BigInt,
  Address,
  ipfs,
  json,
  log,
  ByteArray,
} from "@graphprotocol/graph-ts"
import { CreateInstance } from "../../generated/EventContractInstance/EventContractInstance"
import { MakaoFixture as MakaoFixtureTemplate } from "../../generated/templates"
import { MakaoFixture } from "../../generated/templates/MakaoFixture/MakaoFixture"
import { Market, GlobalStat, User, MarketEvent } from "../../generated/schema"
import { getGlobalStats, getUser } from "./utils"

export function handleCreateInstance(event: CreateInstance): void {
  // Récupérer l'adresse de l'instance créée et son IPFS hash
  let marketAddress = event.params.instance
  let ipfsHash = event.params.ipfsMetadataHash.toString()
  let marketId = marketAddress.toHexString()

  // Commencer à suivre ce nouveau contrat
  MakaoFixtureTemplate.create(marketAddress)

  // Créer une nouvelle entité Market
  let market = new Market(marketId)

  // Récupérer les données IPFS
  if (ipfsHash) {
    log.info("Récupération des données IPFS: {}", [ipfsHash])
    let rawData = ipfs.cat(ipfsHash)

    if (rawData) {
      let metadata = json.fromBytes(rawData).toObject()

      // Remplir les champs IPFS
      market.title = metadata.get("title")
        ? metadata.get("title").toString()
        : "Marché Makao"
      market.description = metadata.get("description")
        ? metadata.get("description").toString()
        : "Description non disponible"
      market.image = metadata.get("image")
        ? metadata.get("image").toString()
        : ""

      // Traiter les événements depuis IPFS
      if (metadata.get("events")) {
        let events = metadata.get("events").toArray()
        for (let i = 0; i < events.length; i++) {
          let eventData = events[i].toObject()
          let eventId = marketId + "-event-" + i.toString()

          let marketEvent = new MarketEvent(eventId)
          marketEvent.title = eventData.get("title").toString()
          marketEvent.description = eventData.get("description").toString()
          marketEvent.market = marketId
          marketEvent.save()
        }
      }
    } else {
      // Fallback si IPFS échoue
      market.title = "Marché Makao #" + marketId.slice(0, 6)
      market.description = "Description non disponible"
      market.image = ""
    }
  } else {
    // Fallback si pas d'IPFS hash
    market.title = "Marché Makao #" + marketId.slice(0, 6)
    market.description = "Description non disponible"
    market.image = ""
  }

  // Récupérer les informations du contrat
  let contract = MakaoFixture.bind(marketAddress)

  // Récupérer les données du contrat avec try_* pour éviter les erreurs
  let owner = contract.owner()
  let stakeToken = contract.stakeToken()
  let engagementDeadline = contract.engagementDeadline()
  let resolutionDeadline = contract.resolutionDeadline()
  let creatorFee = contract.creatorFee()
  let predictionCount = contract.predictionCount()

  // Remplir les champs de l'entité Market
  market.owner = owner
  market.stakeToken = stakeToken
  market.engagementDeadline = engagementDeadline
  market.resolutionDeadline = resolutionDeadline
  market.creatorFee = creatorFee
  market.predictionCount = predictionCount
  market.totalAmount = BigInt.fromI32(0)
  market.createdAt = event.block.timestamp
  market.isCancelled = false
  market.isResolved = false

  // Sauvegarder l'entité Market
  market.save()

  // Créer les entités Challenge pour ce marché
  for (let i = 0; i < predictionCount.toI32(); i++) {
    let challengeId = BigInt.fromI32(i)
    let challenge = new Challenge(marketId + "-" + challengeId.toString())
    challenge.challengeId = challengeId
    challenge.market = marketId
    challenge.totalAmount = BigInt.fromI32(0)
    challenge.isWinner = null
    challenge.save()
  }

  // Mettre à jour l'utilisateur (créateur du marché)
  let user = getUser(owner)
  let marketsCreated = user.marketsCreated || []
  marketsCreated.push(marketId)
  user.marketsCreated = marketsCreated
  user.lastActivityAt = event.block.timestamp

  if (user.firstActivityAt.equals(BigInt.fromI32(0))) {
    user.firstActivityAt = event.block.timestamp
  }

  user.save()

  // Mettre à jour les statistiques globales
  let stats = getGlobalStats()
  stats.totalMarkets = stats.totalMarkets.plus(BigInt.fromI32(1))
  stats.activeMarkets = stats.activeMarkets.plus(BigInt.fromI32(1))
  stats.save()
}
```

#### market.ts

Ce fichier gère les événements pour chaque marché créé [^6][^11]:

```typescript
import { BigInt, Address, log } from "@graphprotocol/graph-ts"
import {
  EngageChallenge,
  EventCancelled,
  ExitEvent,
  ResolveEvent,
  MakaoFixture,
} from "../../generated/templates/MakaoFixture/MakaoFixture"
import {
  Market,
  Challenge,
  Engagement,
  Collection,
  User,
  GlobalStat,
} from "../../generated/schema"
import { getGlobalStats, getUser } from "./utils"

export function handleEngageChallenge(event: EngageChallenge): void {
  let marketAddress = event.address
  let marketId = marketAddress.toHexString()
  let userAddress = event.params.sender
  let userId = userAddress.toHexString()
  let challengeId = event.params.prediction
  let amount = event.params.stake

  // Charger le marché
  let market = Market.load(marketId)
  if (market == null) {
    log.error("Market not found: {}", [marketId])
    return
  }

  // Charger le challenge
  let challengeEntityId = marketId + "-" + challengeId.toString()
  let challenge = Challenge.load(challengeEntityId)
  if (challenge == null) {
    log.error("Challenge not found: {}", [challengeEntityId])
    return
  }

  // Créer un nouvel engagement
  let engagementId = marketId + "-" + userId + "-" + challengeId.toString()
  let engagement = new Engagement(engagementId)
  engagement.user = userId
  engagement.market = marketId
  engagement.challenge = challengeEntityId
  engagement.amount = amount
  engagement.timestamp = event.block.timestamp
  engagement.hasCollected = false

  // Récupérer le referrer si disponible
  let contract = MakaoFixture.bind(marketAddress)
  let referrer = contract.referrerByUser(userAddress)
  if (referrer.notEqual(Address.zero())) {
    engagement.referrer = referrer
  }

  engagement.save()

  // Mettre à jour le challenge
  challenge.totalAmount = challenge.totalAmount.plus(amount)
  challenge.save()

  // Mettre à jour le marché
  market.totalAmount = market.totalAmount.plus(amount)
  market.save()

  // Mettre à jour l'utilisateur
  let user = getUser(userAddress)
  user.totalStaked = user.totalStaked.plus(amount)
  user.lastActivityAt = event.block.timestamp

  if (user.firstActivityAt.equals(BigInt.fromI32(0))) {
    user.firstActivityAt = event.block.timestamp
  }

  user.save()

  // Mettre à jour les statistiques globales
  let stats = getGlobalStats()
  stats.totalVolume = stats.totalVolume.plus(amount)
  stats.save()
}

export function handleResolveEvent(event: ResolveEvent): void {
  let marketAddress = event.address
  let marketId = marketAddress.toHexString()
  let winningChallenges = event.params.challenges

  // Charger le marché
  let market = Market.load(marketId)
  if (market == null) {
    log.error("Market not found: {}", [marketId])
    return
  }

  // Mettre à jour le marché
  market.isResolved = true
  market.winningChallenges = winningChallenges
  market.save()

  // Mettre à jour les challenges gagnants
  for (let i = 0; i < winningChallenges.length; i++) {
    let challengeId = winningChallenges[i]
    let challengeEntityId = marketId + "-" + challengeId.toString()
    let challenge = Challenge.load(challengeEntityId)

    if (challenge != null) {
      challenge.isWinner = true
      challenge.save()
    }
  }

  // Mettre à jour les statistiques globales
  let stats = getGlobalStats()
  stats.activeMarkets = stats.activeMarkets.minus(BigInt.fromI32(1))
  stats.resolvedMarkets = stats.resolvedMarkets.plus(BigInt.fromI32(1))
  stats.save()
}

export function handleEventCancelled(event: EventCancelled): void {
  let marketAddress = event.address
  let marketId = marketAddress.toHexString()

  // Charger le marché
  let market = Market.load(marketId)
  if (market == null) {
    log.error("Market not found: {}", [marketId])
    return
  }

  // Mettre à jour le marché
  market.isCancelled = true
  market.save()

  // Mettre à jour les statistiques globales
  let stats = getGlobalStats()
  stats.activeMarkets = stats.activeMarkets.minus(BigInt.fromI32(1))
  stats.cancelledMarkets = stats.cancelledMarkets.plus(BigInt.fromI32(1))
  stats.save()
}

export function handleExitEvent(event: ExitEvent): void {
  let marketAddress = event.address
  let marketId = marketAddress.toHexString()
  let userAddress = event.params.sender
  let userId = userAddress.toHexString()
  let recipientAddress = event.params.to
  let amount = event.params.amount

  // Charger le marché
  let market = Market.load(marketId)
  if (market == null) {
    log.error("Market not found: {}", [marketId])
    return
  }

  // Créer une nouvelle collection
  let collectionId = marketId + "-" + userId
  let collection = new Collection(collectionId)
  collection.user = userId
  collection.market = marketId
  collection.amount = amount
  collection.timestamp = event.block.timestamp
  collection.recipient = recipientAddress
  collection.save()

  // Mettre à jour les engagements de l'utilisateur pour ce marché
  let contract = MakaoFixture.bind(marketAddress)
  let challengesResult = contract.getChallengesByUser(userAddress)
  let challenges = challengesResult.value0

  for (let i = 0; i < challenges.length; i++) {
    let challengeId = challenges[i]
    let engagementId = marketId + "-" + userId + "-" + challengeId.toString()
    let engagement = Engagement.load(engagementId)

    if (engagement != null) {
      engagement.hasCollected = true
      engagement.save()
    }
  }

  // Mettre à jour l'utilisateur
  let user = getUser(userAddress)
  user.totalCollected = user.totalCollected.plus(amount)
  user.lastActivityAt = event.block.timestamp
  user.save()
}
```

#### utils.ts

Fichier d'utilitaires pour factoriser le code commun [^6]:

```typescript
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { User, GlobalStat, Challenge } from "../../generated/schema"

// Initialiser ou charger les statistiques globales
export function getGlobalStats(): GlobalStat {
  let stats = GlobalStat.load("global")

  if (stats == null) {
    stats = new GlobalStat("global")
    stats.totalMarkets = BigInt.fromI32(0)
    stats.totalUsers = BigInt.fromI32(0)
    stats.totalVolume = BigInt.fromI32(0)
    stats.activeMarkets = BigInt.fromI32(0)
    stats.resolvedMarkets = BigInt.fromI32(0)
    stats.cancelledMarkets = BigInt.fromI32(0)
    stats.save()
  }

  return stats
}

// Initialiser ou charger un utilisateur
export function getUser(address: Address): User {
  let userId = address.toHexString()
  let user = User.load(userId)

  if (user == null) {
    user = new User(userId)
    user.totalStaked = BigInt.fromI32(0)
    user.totalCollected = BigInt.fromI32(0)
    user.firstActivityAt = BigInt.fromI32(0)
    user.lastActivityAt = BigInt.fromI32(0)
    user.marketsCreated = []

    // Mettre à jour les statistiques globales
    let stats = getGlobalStats()
    stats.totalUsers = stats.totalUsers.plus(BigInt.fromI32(1))
    stats.save()

    user.save()
  }

  return user
}
```

## Intégration IPFS

### Format des métadonnées IPFS

Créez un fichier `ipfs-examples/market-metadata.json` avec un exemple de métadonnées [^8][^10]:

```json
{
  "title": "Élection Présidentielle 2027",
  "description": "Prédisez le vainqueur des élections françaises de 2027",
  "image": "ipfs://QmX8J5.../election.jpg",
  "events": [
    {
      "title": "Victoire de la Gauche",
      "description": "Le candidat de gauche l'emporte avec +50%"
    },
    {
      "title": "Victoire de la Droite",
      "description": "Le candidat de droite remporte l'élection"
    },
    {
      "title": "Victoire du Centre",
      "description": "Le candidat centriste conserve le pouvoir"
    }
  ]
}
```

### Services de pinning IPFS recommandés

Pour garantir la disponibilité de vos métadonnées IPFS, utilisez un service de pinning fiable [^8][^10]:

1. **Pinata** - Service professionnel et fiable (plans gratuits et payants)
2. **nft.storage** - Service gratuit soutenu par Protocol Labs
3. **Alchemy IPFS** - Via la passerelle `ipfs.satsuma.xyz` (optimisé pour Alchemy Subgraphs)

### Processus de création et de pinning

1. Créez votre JSON de métadonnées
2. Uploadez-le sur Pinata/nft.storage/Alchemy IPFS
3. Récupérez le hash IPFS (format CID v0 ou v1)
4. Utilisez ce hash lors de la création d'un nouveau marché via votre contrat factory [^8][^10]

## Déploiement et monitoring

### Génération du code et compilation

```bash
# Générer le code TypeScript à partir des ABIs
graph codegen

# Compiler le subgraph
graph build
```

### Déploiement sur Alchemy

```bash
# Déploiement en version de développement
graph deploy makao-subgraph-dev \
  --version-label dev-$(date +%Y%m%d-%H%M%S) \
  --node https://subgraphs.alchemy.com/api/subgraphs/deploy \
  --deploy-key VOTRE_CLE_DEPLOIEMENT_ALCHEMY \
  --ipfs https://ipfs.satsuma.xyz
```

### Vérification et monitoring

Après le déploiement, accédez au dashboard Alchemy pour [^3][^2]:

1. Vérifier l'état de synchronisation
2. Tester les requêtes GraphQL
3. Surveiller les performances et les erreurs

### Exemple de requête GraphQL

```graphql
query GetMarketDetails($id: ID!) {
  market(id: $id) {
    id
    title
    description
    image
    owner
    totalAmount
    isCancelled
    isResolved
    createdAt
    challenges {
      challengeId
      totalAmount
      isWinner
    }
    events {
      title
      description
    }
  }
}
```

## Bonnes pratiques et optimisations

### Optimisations de performance

1. **Pruning automatique** - Activé via `indexerHints: prune: auto` pour réduire la taille de la base de données [^5]
2. **Gestion des erreurs robuste** - Utilisation de `try_*` methods pour les appels aux contrats [^11]
3. **Logging structuré** - Logging des opérations clés pour faciliter le debugging [^11]

### Sécurité des données

1. **Validation des données IPFS** - Toujours vérifier que les données IPFS sont présentes avant de les utiliser [^10]
2. **Fallbacks appropriés** - Fournir des valeurs par défaut en cas d'échec des appels IPFS [^10][^11]
3. **Protection contre les entrées malveillantes** - Validation des données avant enregistrement [^11]

### Versioning et mise à jour

1. **Versioning sémantique** - Utilisation de `--version-label` pour chaque déploiement [^4][^12]
2. **Stratégie de rollback** - Conservation des versions précédentes pour retour rapide en cas de problème [^12]
3. **Monitoring continu** - Surveillance des erreurs et des performances [^12]

## Ressources additionnelles

- [Documentation officielle Alchemy Subgraphs](https://www.alchemy.com/subgraphs) [^3][^2]
- [Guide d'intégration IPFS avec The Graph](https://thegraph.com/blog/file-data-sources-tutorial/) [^8]
- [Exemples de subgraphs avec pattern factory](https://thegraph.com/blog/data-source-templates/) [^9]
- [Forum de support Alchemy](https://forum.alchemy.com) [^3]

---

Ce guide vous a fourni toutes les étapes nécessaires pour déployer un subgraph Alchemy optimisé pour vos contrats Makao, avec intégration IPFS et pattern factory. Suivez les étapes dans l'ordre indiqué pour une mise en place efficace et performante [^3][^2][^5].
