# Handler: `handleIpfsContent`

**Fichier source :** `src/ipfs-handler.ts`

Ce handler est la seconde moitié, et la plus délicate, de notre architecture asynchrone "Parent-Enfant". Il est déclenché par le Graph Node **uniquement lorsque** le fichier JSON, dont le hash a été fourni par `handleCreateInstance`, a été récupéré avec succès depuis IPFS.

Son rôle est de traiter les données "off-chain" (les métadonnées riches) et de les lier à leur "parent" on-chain, l'entité `Market`.

## Une Philosophie : la Programmation Défensive

Contrairement aux données d'un événement de contrat intelligent qui sont structurées et fiables, **le contenu d'un fichier IPFS est considéré comme une entrée non fiable**. Le fichier pourrait être :

- Un JSON malformé.
- Un JSON valide, mais avec des champs manquants.
- Un JSON valide, mais avec des champs ayant un type de données incorrect (ex: un nombre là où on attend une chaîne de caractères).

Pour cette raison, ce handler est conçu pour être extrêmement **robuste et défensif**. Son objectif est d'extraire le maximum d'informations valides sans jamais faire crasher le subgraph, même si le fichier est corrompu.

## Logique de Fonctionnement Détaillée

### Étape 1 : Récupérer le Contexte

La première action du handler est de retrouver à quel marché il doit associer ces métadonnées. C'est ici que le `contexte`, passé par `handleCreateInstance`, entre en jeu.

```typescript
// Fichier: src/ipfs-handler.ts
let context = dataSource.context()
let marketId = context.getString("marketId")
```

- `dataSource.context()`: Récupère le conteneur de données qui a été passé lors de la création du template.
- `context.getString("marketId")`: Extrait l'ID de l'entité `Market` parente. C'est le lien magique qui connecte ce handler off-chain à son déclencheur on-chain.

### Étape 2 : Créer l'Entité Enfant `MarketMetadata`

Nous créons immédiatement l'entité "enfant" `MarketMetadata`. Son ID est l'ID du marché (`marketId`), ce qui garantit une relation 1-à-1 unique avec son parent.

```typescript
// Fichier: src/ipfs-handler.ts
let metadata = new MarketMetadata(marketId)
metadata.market = marketId // Établit le lien vers le parent
```

### Étape 3 : Parsing Sécurisé du JSON

C'est l'étape la plus critique. Nous ne faisons jamais l'hypothèse que les données sont valides.

```typescript
// Fichier: src/ipfs-handler.ts
let jsonResult = json.try_fromBytes(data)

if (jsonResult.isError) {
  log.warning("Erreur de parsing JSON pour le marché {}", [marketId])
  metadata.save() // On sauvegarde une entité vide pour ne pas retenter
  return
}
```

- `json.try_fromBytes(data)`: Tente de parser les `Bytes` bruts en un objet JSON. Cette fonction **ne fait pas crasher le subgraph en cas d'échec**. Elle retourne un objet `JSONResult` qui contient soit les données, soit une erreur.
- Si le parsing échoue, nous loguons un avertissement et sauvegardons une entité `MarketMetadata` vide. C'est une décision importante : cela empêche le Graph Node de tenter indéfiniment de retraiter un fichier qu'il sait corrompu.

### Étape 4 : Extraction Champ par Champ et Traitement des Données Nested

Si le JSON est valide, nous extrayons chaque champ un par un, en vérifiant systématiquement son existence, sa non-nullité et son type avant de l'assigner, y compris pour les données imbriquées comme les `MarketEvent`. (Pour le détail du code, se référer au fichier source).

## Principe Fondamental : Éviter la "Condition de Course" (Race Condition)

> **Règle d'or : Ce handler ne modifie JAMAIS l'entité `Market` parente.**

Cette règle n'est pas une simple convention, c'est une nécessité technique pour éviter une **condition de course** (race condition).

### Qu'est-ce qu'une Condition de Course ?

Une condition de course se produit lorsque deux processus parallèles tentent d'accéder ou de modifier la même ressource (dans notre cas, une entité en base de données), et que le résultat de l'opération dépend de l'ordre, imprévisible, dans lequel les processus s'exécutent.

### Le Scénario Catastrophe que nous Évitons :

1.  Le handler `handleCreateInstance` est déclenché. Il prépare l'entité `Market` et, avant même de la sauvegarder, il déclenche le template IPFS `IpfsContentTemplate.createWithContext(...)`.
2.  Le Graph Node traite les tâches de manière parallèle et optimisée. Il n'y a **aucune garantie** que le `market.save()` de `handleCreateInstance` sera terminé avant que `handleIpfsContent` ne commence son exécution.
3.  **Le problème :** Si `handleIpfsContent` essayait de charger l'entité parente avec `Market.load(marketId)`, il risquerait de recevoir `null`, car l'entité n'a pas encore été écrite en base de données.
4.  Toute tentative de modifier cette entité `null` (`market.isMetadataSynced = true`, par exemple) provoquerait une erreur fatale et **ferait crasher l'ensemble du subgraph**.

### Notre Solution : La Séparation Stricte

En décidant que `handleIpfsContent` ne fait que **créer une nouvelle entité `MarketMetadata`** et n'interagit jamais avec l'entité `Market`, nous éliminons complètement le risque de condition de course.

- Les informations de l'entité `Market` proviennent **uniquement** de la blockchain (via `handleCreateInstance`).
- Les informations de l'entité `MarketMetadata` proviennent **uniquement** d'IPFS (via `handleIpfsContent`).

Le lien entre les deux est géré de manière "virtuelle" et sécurisée au moment de la requête GraphQL grâce à la directive `@derivedFrom` dans le `schema.graphql`.

## Entités Affectées

- **`MarketMetadata`**: Création d'une nouvelle entité.
- **`MarketEvent`**: Création d'une ou plusieurs nouvelles entités, si elles sont présentes et valides dans le fichier IPFS.
