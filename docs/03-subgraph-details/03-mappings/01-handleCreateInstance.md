# Handler: `handleCreateInstance`

**Fichier source :** `src/makao-factory.ts`

Ce handler est le point de départ de la vie d'un marché dans notre subgraph. Il est déclenché par l'événement `CreateInstance` émis par le contrat `MakaoFactory`.

Sa mission semble simple : créer une nouvelle entité `Market`. Cependant, sa conception est le résultat d'une réflexion approfondie pour résoudre l'un des défis les plus courants dans le développement de subgraphs : la fusion de données on-chain et off-chain.

## Le Défi Fondamental : Synchroniser Deux Mondes

Un marché dans notre écosystème est défini par deux types de données :

1.  **Données On-Chain :** Fiables, structurées et critiques. Ce sont les données issues du contrat (adresses, deadlines, frais, etc.). Leur disponibilité est garantie.
2.  **Données Off-Chain (IPFS) :** Riches et descriptives, mais fondamentalement moins fiables. Ce sont les métadonnées (nom, description, image) stockées dans un fichier JSON sur IPFS.

Le défi est de combiner ces deux sources sans que la nature parfois lente ou incertaine d'IPFS ne vienne compromettre la robustesse de notre indexation on-chain.

## L'Approche Initiale (et ses Problèmes) : Le Piège de `ipfs.cat()`

La première approche, la plus intuitive, était d'appeler `ipfs.cat()` directement dans le handler `handleCreateInstance` pour récupérer le contenu du fichier JSON.

**Pourquoi c'est une mauvaise idée :**

- **Appel Bloquant :** `ipfs.cat()` est une opération **synchrone**. L'indexeur met en pause tout son travail pour attendre une réponse du réseau IPFS.
- **Source d'Échec Majeure :** Si le fichier IPFS n'est pas trouvé rapidement, la requête expire (timeout). Le Graph Node interprète ce timeout comme une erreur fatale, ce qui **fait crasher l'ensemble du subgraph**.

**La nature d'IPFS rend les timeouts fréquents.** IPFS est un réseau décentralisé. Lorsqu'un fichier est uploadé (par exemple sur Pinata), il faut un certain temps pour que l'information de son existence se propage sur le réseau. Le nœud IPFS utilisé par notre hébergeur doit attendre cette propagation. Ce délai est souvent plus long que la fenêtre de patience de l'indexeur, provoquant un crash.

## La Solution Adoptée : L'Architecture Asynchrone "Parent-Enfant"

Pour garantir une robustesse totale, nous avons découplé le traitement des données on-chain et off-chain en utilisant les **File Data Sources** de The Graph.

Le principe est simple :

1.  Le handler on-chain (`handleCreateInstance`) crée le "Parent" (`Market`) avec les données fiables de la blockchain et **délègue** la tâche de récupération IPFS.
2.  Un autre handler, off-chain (`handleIpfsContent`), s'exécutera **uniquement si et quand** le fichier IPFS est disponible, pour créer l'"Enfant" (`MarketMetadata`).

## Logique de Fonctionnement Détaillée

Voici la décomposition de la logique du code dans `handleCreateInstance`.

### Étape 1 : Création du "Squelette" On-Chain

Le handler commence par créer une nouvelle entité `Market`. Il s'agit du "squelette" de notre marché, rempli uniquement avec les données immédiatement disponibles et fiables de l'événement (`event.params`, `event.transaction`, `event.block`).

```typescript
// Fichier: src/makao-factory.ts
let marketId = event.params.instance.toHexString()
let market = new Market(marketId)

market.contractAddress = event.params.instance
market.creator = event.transaction.from
market.createdAt = event.block.timestamp

// Initialisation des valeurs par défaut
market.totalAmount = BigInt.fromI32(0)
market.isCancelled = false
market.isResolved = false
```

### Étape 2 : Lecture Sécurisée des Données Publiques du Contrat

Pour obtenir le reste des informations on-chain (comme `owner`, `stakeToken`, etc.), nous devons appeler les fonctions `view` du contrat de marché qui vient d'être créé.

> **Bonne Pratique :** Chaque appel de contrat est encapsulé dans un `try_...()`. Par exemple, `contract.try_owner()`. Cela rend notre subgraph résilient. Si pour une raison quelconque l'appel au contrat échouait (ex: contrat mal déployé, bug), l'opération est marquée comme `reverted` mais **ne fait pas crasher le subgraph**. Nous pouvons alors logger un avertissement (`log.warning`) et continuer.

### Étape 3 : Déclenchement Asynchrone du Traitement IPFS

C'est le cœur de notre architecture. Au lieu d'un appel bloquant à `ipfs.cat()`, nous déléguons la tâche au Graph Node.

```typescript
// Fichier: src/makao-factory.ts
let ipfsHashResult = contract.try_ipfsMetadataHash()
if (!ipfsHashResult.reverted) {
  let ipfsHash = ipfsHashResult.value
  market.ipfsHash = ipfsHash

  // 1. Créer un "contexte" pour passer l'ID du marché parent
  let context = new DataSourceContext()
  context.setString("marketId", marketId)

  // 2. Déclencher le template avec ce contexte
  IpfsContentTemplate.createWithContext(ipfsHash, context)
}
```

- **`IpfsContentTemplate.createWithContext(ipfsHash, context)`** est une instruction non bloquante. Elle dit au Graph Node :
  1.  "Dès que tu peux, va chercher le fichier correspondant à cet `ipfsHash`."
  2.  "Quand tu l'auras, exécute le handler `handleIpfsContent`."
  3.  "Et pour que ce handler sache à quel marché lier les données, je te passe l'ID du marché (`marketId`) dans ce `contexte`."

### Étape 4 : Finalisation et Activation du Template de Marché

Pour finir, nous sauvegardons notre entité `Market` et activons le template pour que le subgraph commence à écouter les événements sur ce nouveau contrat de marché.

```typescript
// Fichier: src/makao-factory.ts
market.save()
updateGlobalStats(true, event.block.timestamp) // Met à jour les statistiques globales
MakaoFixtureTemplate.create(event.params.instance) // Démarre la surveillance de ce marché
```

## Entités Affectées

- **`Market`**: Création d'une nouvelle entité avec toutes les données on-chain.
- **`GlobalStat`**: Mise à jour du compteur `totalMarkets`.

---

> **Pour la suite du processus :** Une fois que le Graph Node a récupéré le fichier IPFS, il exécute le handler `handleIpfsContent`. Pour comprendre comment les métadonnées sont parsées et liées, consultez la documentation de ce handler.
