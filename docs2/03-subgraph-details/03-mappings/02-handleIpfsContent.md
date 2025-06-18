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

```

// Fichier: src/ipfs-handler.ts
let context = dataSource.context()
let marketId = context.getString("marketId")

```

- `dataSource.context()`: Récupère le conteneur de données qui a été passé lors de la création du template.
- `context.getString("marketId")`: Extrait l'ID de l'entité `Market` parente. C'est le lien magique qui connecte ce handler off-chain à son déclencheur on-chain.

### Étape 2 : Créer l'Entité Enfant `MarketMetadata`

Nous créons immédiatement l'entité "enfant" `MarketMetadata`. Son ID est l'ID du marché (`marketId`), ce qui garantit une relation 1-à-1 unique avec son parent.

```

// Fichier: src/ipfs-handler.ts
let metadata = new MarketMetadata(marketId)
metadata.market = marketId // Établit le lien vers le parent

```

### Étape 3 : Parsing Sécurisé du JSON

C'est l'étape la plus critique. Nous ne faisons jamais l'hypothèse que les données sont valides.

```

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

### Étape 4 : Extraction Champ par Champ

Si le JSON est valide, nous extrayons chaque champ un par un, en vérifiant systématiquement son existence et sa non-nullité avant de l'assigner.

```

// Fichier: src/ipfs-handler.ts
let jsonData = jsonResult.value.toObject()

let nameValue = jsonData.get("name")
if (nameValue \&\& !nameValue.isNull()) {
metadata.name = nameValue.toString()
}

// ... même logique pour `description` et `image`

```

### Étape 5 : Traitement des Données Nested (`MarketEvent`)

La récupération des sous-événements est l'exemple le plus avancé de notre approche défensive. Nous devons traverser la structure JSON en validant chaque niveau.

```

// Fichier: src/ipfs-handler.ts
// 1. On vérifie que `properties` existe et est un objet
let propertiesValue = jsonData.get("properties")
if (propertiesValue \&\& propertiesValue.kind == JSONValueKind.OBJECT) {
// 2. On vérifie que `events` existe et est un tableau
let eventsValue = propertiesObj.get("events")
if (eventsValue \&\& eventsValue.kind == JSONValueKind.ARRAY) {
// 3. On boucle sur le tableau
let eventsArray = eventsValue.toArray()
for (let i = 0; i < eventsArray.length; i++) {
// 4. On vérifie que l'élément est un objet
if (eventsArray[i].kind != JSONValueKind.OBJECT) continue

            // 5. On vérifie que TOUS les champs requis existent, ne sont pas nuls ET sont du bon type
            if (eventIdValue && eventIdValue.kind == JSONValueKind.NUMBER && ...) {
                // SEULEMENT MAINTENANT, on peut créer l'entité MarketEvent en toute sécurité
                let marketEvent = new MarketEvent(...)
                marketEvent.save()
            }
        }
    }
    }

```

Chaque `if` est une porte de sécurité qui nous protège contre un JSON mal formé.

## Principe Fondamental : la Séparation des Données

> **Règle d'or : Ce handler ne modifie JAMAIS l'entité `Market` parente.**

Cette règle est cruciale pour la cohérence des données. Les informations de l'entité `Market` proviennent _uniquement_ de la blockchain. Les informations de l'entité `MarketMetadata` proviennent _uniquement_ d'IPFS. Cette séparation nette évite les conditions de course et rend le système beaucoup plus facile à déboguer. Le lien entre les deux est géré de manière "virtuelle" au moment de la requête grâce à la directive `@derivedFrom` dans le `schema.graphql`.

## Entités Affectées

- **`MarketMetadata`**: Création d'une nouvelle entité.
- **`MarketEvent`**: Création d'une ou plusieurs nouvelles entités, si elles sont présentes et valides dans le fichier IPFS.
