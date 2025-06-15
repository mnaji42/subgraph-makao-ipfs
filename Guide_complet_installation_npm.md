# Roadmap Complète Subgraph Alchemy Makao (Juin 2025)

## 1. Préparation de l’environnement

- **Installer Node.js v18+** (ou v20 recommandé)
- **Installer The Graph CLI** (dernière version)

```bash
npm install -g @graphprotocol/graph-cli@latest
```

- **Vérifier l’installation**

```bash
graph --version
```

- **Créer un compte Alchemy** (si ce n’est pas déjà fait) et récupérer une clé de déploiement

---

## 2. Récupérer les informations nécessaires

- **Adresse du contrat factory** (ex : `0xfc58FefaDA53D508FD584278B8EED8e7A02c34B2`)
- **ABI du contrat factory** (`EventContractInstance.json`)
- **ABI du contrat de marché** (`MakaoFixture.json`)
- **Réseau blockchain** (ex : `sepolia`, `mainnet`, etc.)
- **Block de déploiement du contrat factory** (optionnel, mais recommandé pour accélérer l’indexation)

---

## 3. Générer automatiquement la structure du subgraph

**Commande à utiliser :**

```bash
graph init --from-contract <NETWORK> <CONTRACT_ADDRESS> --abi <PATH_TO_ABI> <SUBGRAPH_NAME>
```

**Exemple concret :**

```bash
graph init --from-contract sepolia 0x5accdde8c2137B231d5cFEbc80Ccc52E9A200674 --abi ./abis/EventContractInstance.json makao-subgraph
```

> **Remarque** :
>
> - Si tu veux démarrer dans un dossier existant, ajoute `--directory .` à la fin.
> - Si tu veux utiliser un autre dossier pour les ABIs, adapte le chemin.

**Résultat :**

- **makao-subgraph/** (ou le dossier choisi)
  - `subgraph.yaml`
  - `schema.graphql`
  - `src/mappings.ts`
  - `abis/EventContractInstance.json`
  - `package.json`
  - `tsconfig.json`
  - `README.md`

---

## 4. Adapter la structure générée à ton projet

### a. Mettre à jour les ABIs

- **Copier l’ABI du contrat de marché** (`MakaoFixture.json`) dans `abis/`
- **Vérifier que les ABIs sont à jour** (régénère-les si besoin à partir de ton code Solidity)

### b. Adapter le manifeste `subgraph.yaml`

- **Ajouter le template pour le contrat de marché**
- **Ajouter le support IPFS**
- **Ajouter les indexerHints pour le pruning**
- **Ajouter le handler pour le hash IPFS**

**Exemple de `subgraph.yaml` adapté :**

```yaml
specVersion: 1.3.0
features:
  - ipfs
  - nonDeterministicIpfs
indexerHints:
  prune: auto

description: Subgraph Alchemy pour indexer les marchés Makao
repository: https://github.com/makao-team/makao-subgraph

schema:
  file: ./schema.graphql

dataSources:
  - kind: ethereum
    name: EventContractInstance
    network: sepolia # Adapte selon ton réseau
    source:
      address: "0x5accdde8c2137B231d5cFEbc80Ccc52E9A200674" # Remplace par ton adresse
      abi: EventContractInstance
      startBlock: 4500000 # Remplace par le block de déploiement
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
        - event: CreateInstance(indexed address,bytes) # Adapte selon ton event
          handler: handleCreateInstance
      file: ./src/mappings/factory.ts

templates:
  - kind: ethereum
    name: MakaoFixture
    network: sepolia # Même réseau que la datasource
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

### c. Adapter le schéma `schema.graphql`

**Exemple de schéma complet :**

```graphql
type Market @entity {
  id: ID!
  title: String!
  description: String!
  image: String!
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

### d. Structurer les mappings

- **Créer les dossiers et fichiers nécessaires**

```
src/
  mappings/
    factory.ts
    market.ts
    utils.ts
```

- **Utiliser les mappings adaptés à la gestion IPFS et aux templates**

> **Remarque** :
> Les mappings détaillés sont disponibles dans le guide précédent.
> Tu peux les copier/coller ou les adapter selon tes besoins.

### e. Préparer les exemples IPFS

- **Créer un dossier `ipfs-examples/`**
- **Créer un fichier `market-metadata.json`**

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
    }
  ]
}
```

- **Pinner ce fichier sur IPFS** (Pinata, nft.storage, ou Alchemy IPFS)

---

## 5. Générer et compiler le subgraph

```bash
cd makao-subgraph
graph codegen
graph build
```

---

## 6. Déployer le subgraph sur Alchemy

```bash
graph deploy makao-subgraph \
  --node https://subgraphs.alchemy.com/api/subgraphs/deploy \
  --deploy-key VOTRE_CLE_DEPLOIEMENT_ALCHEMY \
  --ipfs https://ipfs.satsuma.xyz
```

> **Remarque** :
> Remplace `VOTRE_CLE_DEPLOIEMENT_ALCHEMY` par ta clé Alchemy.

---

## 7. Vérifier et monitorer le subgraph

- **Accéder au dashboard Alchemy**
- **Vérifier la synchronisation**
- **Tester les requêtes GraphQL**

**Exemple de requête :**

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

---

## 8. Bonnes pratiques et optimisations

- **Ne jamais modifier manuellement les versions dans `package.json`**
  Utilise toujours `npm install --save-dev <package>@latest` pour rester à jour.
- **Vérifier régulièrement les mises à jour de The Graph et Alchemy**
- **Utiliser le pruning automatique** (`indexerHints: prune: auto`)
- **Valider les données IPFS avant de les utiliser**
- **Ajouter des fallbacks en cas d’échec IPFS**
- **Documenter chaque étape dans le README.md**

---

## 9. Structure finale recommandée

```
makao-subgraph/
├── abis/
│   ├── EventContractInstance.json
│   └── MakaoFixture.json
├── src/
│   └── mappings/
│       ├── factory.ts
│       ├── market.ts
│       └── utils.ts
├── config/
│   └── addresses.json
├── ipfs-examples/
│   └── market-metadata.json
├── subgraph.yaml
├── schema.graphql
├── package.json
├── tsconfig.json
└── README.md
```

---

## 10. Fichier Markdown pour ton IDE

```markdown
# Roadmap Subgraph Alchemy Makao

## 1. Préparation de l’environnement

- Installer Node.js v18+
- Installer The Graph CLI
- Récupérer la clé Alchemy

## 2. Générer la structure du subgraph
```

graph init --from-contract <NETWORK> <CONTRACT_ADDRESS> --abi <PATH_TO_ABI> <SUBGRAPH_NAME>

```
- Exemple :
```

graph init --from-contract sepolia 0x5accdde8c2137B231d5cFEbc80Ccc52E9A200674 --abi ./abis/EventContractInstance.json makao-subgraph

```

## 3. Adapter la structure
- Mettre à jour les ABIs
- Adapter `subgraph.yaml` (templates, IPFS, pruning)
- Adapter `schema.graphql`
- Structurer les mappings (`src/mappings/`)
- Préparer les exemples IPFS

## 4. Générer et compiler
```

graph codegen
graph build

```

## 5. Déployer sur Alchemy
```

graph deploy makao-subgraph \
--node https://subgraphs.alchemy.com/api/subgraphs/deploy \
--deploy-key VOTRE_CLE_DEPLOIEMENT_ALCHEMY \
--ipfs https://ipfs.satsuma.xyz

```

## 6. Vérifier et monitorer
- Accéder au dashboard Alchemy
- Tester les requêtes GraphQL

## 7. Bonnes pratiques
- Ne jamais modifier manuellement les versions dans `package.json`
- Utiliser le pruning automatique
- Valider les données IPFS
- Ajouter des fallbacks
- Documenter chaque étape dans le README.md
```

---

# Conclusion

**Cette roadmap est à jour, conforme aux bonnes pratiques 2025, et te permet de démarrer rapidement avec la commande d’initialisation automatique, puis de personnaliser la structure pour ton projet Makao (factory, IPFS, événements, etc.).**
**Tu n’as rien à modifier manuellement dans les versions des packages : tout est généré et maintenu à jour par les outils officiels.**
**Tu peux suivre cette roadmap étape par étape pour un déploiement réussi et professionnel.**
