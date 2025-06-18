# Mappings : La Logique Métier du Subgraph

Les mappings sont le cœur logique de notre subgraph. Ce sont des fonctions écrites en AssemblyScript dont le rôle est de traduire les données brutes issues des événements blockchain (ou d'autres sources comme IPFS) et de les transformer en entités structurées, telles que définies dans notre `schema.graphql`.

Chaque fonction de "handler" listée dans notre fichier `subgraph.yaml` correspond à une fonction exportée dans nos fichiers de mapping. Cette section de la documentation détaille la logique implémentée dans chacun de ces handlers.

## Organisation des Fichiers de Mapping

Notre logique métier est répartie dans plusieurs fichiers au sein du dossier `src/`, chacun ayant une responsabilité claire :

- **`src/makao-factory.ts`**

  - **Responsabilité :** Gérer les événements émis par le contrat `MakaoFactory`.
  - **Handlers :** Contient principalement `handleCreateInstance`, qui orchestre la création de nouvelles entités `Market` et l'instanciation des templates dynamiques.

- **`src/market.ts`**

  - **Responsabilité :** Gérer les événements émis par les contrats `MakaoFixture`, instanciés dynamiquement.
  - **Handlers :** Contient toute la logique liée à l'activité d'un marché : `handleEngageChallenge`, `handleResolveEvent`, `handleEventCancelled`, etc.

- **`src/ipfs-handler.ts`**
  - **Responsabilité :** Gérer les données provenant de sources non-blockchain, spécifiquement les fichiers JSON récupérés d'IPFS.
  - **Handlers :** Contient `handleIpfsContent`, qui est déclenché de manière asynchrone pour parser et sauvegarder les métadonnées riches d'un marché.

## Principes de Développement Communs

Pour assurer la cohérence et la robustesse de notre code, nous suivons plusieurs conventions à travers tous nos mappings.

### 1. Stratégie d'Identifiants Uniques (IDs)

Le choix de l'ID est crucial pour l'unicité et la performance. Notre stratégie est la suivante :

- **Pour les entités uniques par contrat (`Market`) :** L'ID est l'adresse du contrat (`event.params.instanceAddress.toHexString()`).
- **Pour les entités liées à une transaction (`Engagement`) :** L'ID est un composite du hash de la transaction et de l'index du log (`event.transaction.hash.concatI32(event.logIndex.toI32())`). Cela garantit une unicité absolue, même si une transaction émet plusieurs événements identiques.
- **Pour les entités singleton (`GlobalStat`) :** L'ID est une chaîne de caractères constante, comme `"global"`.
- **Pour les entités issues d'IPFS (`MarketMetadata`) :** L'ID est le hash IPFS lui-même, garantissant que les métadonnées pour un fichier donné ne sont stockées qu'une seule fois.

### 2. Chargement et Création d'Entités

Nous utilisons systématiquement le pattern `load-then-create` pour éviter de dupliquer des entités.

```typescript
// Tenter de charger une entité existante
let entity = Entity.load(id)

// Si elle n'existe pas, la créer
if (!entity) {
  entity = new Entity(id)
}

// ... mettre à jour les champs de l'entité

// Sauvegarder les changements
entity.save()
```

### 3. Séparation des Responsabilités (On-chain vs. Off-chain)

Comme détaillé dans le document d'architecture, nous séparons strictement le traitement des données on-chain et off-chain :

- Les handlers d'événements blockchain (`handleCreateInstance`, `handleEngageChallenge`) sont rapides et ne traitent que les données directement disponibles dans l'événement.
- Le handler IPFS (`handleIpfsContent`) est le seul responsable du parsing des données externes et est conçu pour être défensif (vérification des nullités, des types, etc.).

## Documentation Détaillée des Handlers

Cliquez sur les liens ci-dessous pour une explication détaillée de chaque handler, incluant sa logique, les entités qu'il affecte et un extrait de son code.

- **Handlers du `src/makao-factory.ts`**

  - **[`handleCreateInstance`](./01-handleCreateInstance.md)** : Déclenché à la création d'un nouveau marché. Crée l'entité `Market` et active les templates.

- **Handlers du `src/market.ts`**

  - **[`handleEngageChallenge`](./02-handleEngageChallenge.md)** : Déclenché lorsqu'un utilisateur participe à un marché.
  - **[`handleEventCancelled`](./03-handleEventCancelled.md)** : Déclenché lorsqu'un marché est annulé.
  - **[`handleExitEvent`](./04-handleExitEvent.md)** : Déclenché lorsqu'un utilisateur se retire d'un marché.
  - **[`handleResolveEvent`](./05-handleResolveEvent.md)** : Déclenché à la résolution d'un marché.

- **Handlers du `src/ipfs-handler.ts`**
  - **[`handleIpfsContent`](./06-handleIpfsContent.md)** : Déclenché de manière asynchrone après la récupération d'un fichier sur IPFS.
