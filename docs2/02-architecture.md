# Architecture du Subgraph Makao

Ce document décrit l'architecture technique du Subgraph Makao. Il a pour but d'expliquer comment les données circulent depuis les contrats intelligents sur la blockchain jusqu'à l'API GraphQL interrogeable, en incluant la gestion des données off-chain stockées sur IPFS.

## 1. Vue d'Ensemble

Le subgraph Makao sert de pont entre les contrats intelligents de notre écosystème et les applications clientes (frontend, backend). Il écoute les événements émis sur la blockchain, les traite, les enrichit avec des données externes (IPFS), et les organise dans une base de données structurée qui peut être interrogée facilement via GraphQL.

Voici une vue simplifiée du flux global :

```

graph TD
A[Blockchain: Contrats Makao] -- Événements --> B((Graph Node: Indexer));
B -- Données On-Chain --> C{Base de Données};
B -- Demande de métadonnées --> D[IPFS];
D -- Fichier JSON --> B;
B -- Données Off-Chain --> C;
C -- API GraphQL --> E[Application Cliente];

```

## 2. Les Composants Clés

Notre architecture s'articule autour de trois piliers fondamentaux.

### A. Les Contrats Intelligents (Source de Vérité On-Chain)

- **`MakaoFactory.sol`**: Le point d'entrée unique pour la création de marchés. Son seul rôle est de déployer de nouvelles instances de marchés via un proxy. Il émet un événement crucial :
  - `CreateInstance(address)` : Signale qu'un nouveau marché a été créé à une adresse spécifique.
- **`MakaoFixture.sol`**: Le contrat modèle (template) pour chaque marché individuel. C'est sur ces instances que se déroule toute l'activité (participations, résolution, etc.). Le subgraph écoute les événements de chaque instance de ce contrat :
  - `EngageChallenge(...)`
  - `ResolveEvent(...)`
  - `EventCancelled(...)`, et autres.

### B. Le Subgraph (Le Moteur d'Indexation)

C'est le cœur de notre projet. Il est composé de :

- **`subgraph.yaml`**: Le fichier manifeste qui définit quels contrats écouter, à partir de quel bloc, et quels "handlers" (fonctions) appeler pour chaque événement.
- **`schema.graphql`**: La structure de notre base de données. Il définit les entités (ex: `Market`, `Engagement`) et leurs relations.
- **Mappings (Code AssemblyScript)**: La logique métier. Ce sont les scripts qui transforment les données brutes des événements en entités structurées.

### C. IPFS (Pour les Métadonnées Riches)

Stocker des données complexes comme des descriptions longues ou des images sur la blockchain est très coûteux. Nous utilisons IPFS pour stocker les métadonnées de chaque marché (nom, description, image, etc.) dans un fichier JSON. Le subgraph est capable de récupérer ces fichiers de manière asynchrone.

## 3. Flux de Données Détaillé : Création d'un Marché

Le processus le plus complexe de notre architecture est la création d'un marché, car il combine des données on-chain et off-chain. Voici le déroulement exact :

````

sequenceDiagram
participant User as Utilisateur
participant Blockchain
participant GraphNode as Graph Node
participant IPFS

    User->>Blockchain: Appelle `createInstance()` sur le contrat Factory
    Blockchain-->>GraphNode: Émet l'événement `CreateInstance`

    Note over GraphNode: 1. Traitement ON-CHAIN (Rapide et fiable)
    GraphNode->>GraphNode: Exécute `handleCreateInstance(event)`

    Note right of GraphNode: - Crée l'entité Market (squelette)<br>- Sauvegarde les données on-chain (adresses, deadlines...)<br>- Déclenche le template IPFS de manière asynchrone

    Note over GraphNode: 2. Traitement OFF-CHAIN (Asynchrone)
    GraphNode->>IPFS: Récupère le fichier JSON (en arrière-plan)
    IPFS-->>GraphNode: Fournit le contenu du fichier

    Note over GraphNode: 3. Enrichissement des données
    GraphNode->>GraphNode: Exécute `handleIpfsContent(data)`

    Note right of GraphNode: - Crée l'entité MarketMetadata (enfant)<br>- Parse le JSON de manière sécurisée<br>- Lie l'entité "enfant" au "parent" (Market)<br>- Sauvegarde les nouvelles entités
    ```

### Explication du flux :

1.  **Handler On-Chain (`handleCreateInstance`)** : Ce handler, déclenché par l'événement, est conçu pour être **rapide et fiable**. Son rôle est uniquement de traiter les données disponibles immédiatement sur la blockchain.
    -   Il crée une entité `Market` qui sert de "squelette" contenant les informations du contrat (adresses, timestamps, etc.).
    -   Il **ne tente PAS de récupérer le fichier IPFS directement** pour ne pas bloquer l'indexation.
    -   Il utilise `IpfsContentTemplate.createWithContext(...)` pour dire au Graph Node : "Quand tu auras un moment, va chercher ce fichier sur IPFS et, une fois que tu l'as, utilise l'ID de ce marché pour savoir à qui il appartient".

2.  **Handler Off-Chain (`handleIpfsContent`)** : Ce handler est déclenché par le Graph Node **uniquement lorsque le fichier IPFS a été récupéré avec succès**.
    -   Il est conçu pour être **robuste et défensif**, car le contenu d'un fichier JSON est imprévisible. Il vérifie que chaque champ existe, n'est pas nul et est du bon type avant de l'utiliser.
    -   Pour éviter tout conflit, il **ne modifie jamais l'entité `Market` parente**.
    -   Il crée une nouvelle entité `MarketMetadata` (l'enfant) et la lie au `Market` (le parent) via son ID. Cela sépare clairement les données dont la source est la blockchain de celles dont la source est IPFS.

## 4. Organisation du Code

L'architecture conceptuelle se reflète directement dans la structure de nos fichiers.

-   `src/makao-factory.ts` : Contient le mapping `handleCreateInstance`, qui gère les événements du contrat Factory.
-   `src/market.ts` : Contient tous les mappings pour les événements des contrats `MakaoFixture` (ex: `handleEngageChallenge`).
-   `src/ipfs-handler.ts` : Contient le mapping `handleIpfsContent` pour le traitement des fichiers JSON récupérés d'IPFS.
-   `abis/` : Contient les interfaces (ABI) de nos contrats. Nous utilisons des versions **"Light"** de ces fichiers (ex: `MakaoFactoryLight.json`). Ce sont des versions condensées ne contenant que les fonctions et événements nécessaires au subgraph. Cela permet de **réduire significativement la taille du build final** et d'améliorer les temps de compilation et de déploiement.
````
