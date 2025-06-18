# Data Sources et le Manifeste (`subgraph.yaml`)

Le fichier `subgraph.yaml` est le manifeste de notre projet. Il agit comme un chef d'orchestre, indiquant au système d'indexation (le Graph Node) quelles sont les sources de données à surveiller et comment réagir aux informations qu'elles émettent.

Comprendre ce fichier, c'est comprendre le flux de données complet de notre subgraph.

## 1. Configuration Générale et Choix de Conception

Au début du fichier, plusieurs paramètres définissent le comportement global et les capacités de notre subgraph.

```yaml
specVersion: 1.2.0
indexerHints:
prune: auto
```

- **`specVersion: 1.2.0`**: Indique que notre subgraph est compatible avec des versions de nœuds modernes, comme celles utilisées par Alchemy, et nous donne accès à des fonctionnalités récentes.
- **`indexerHints.prune: auto`**: Une instruction d'optimisation qui autorise le nœud d'indexation à supprimer automatiquement les données historiques non nécessaires pour économiser de l'espace.
- **Fonctionnalités en attente (`features`)**: Les lignes commentées sont des fonctionnalités puissantes que nous pourrions activer à l'avenir :
  - `fullTextSearch` : Permettrait des recherches textuelles complexes, idéales pour une barre de recherche.
  - `grafting` : Permettrait de "greffer" un nouveau subgraph sur un ancien pour éviter de tout ré-indexer lors d'une mise à jour.
  - `nonFatalErrors` : Permettrait au subgraph de continuer à fonctionner même s'il rencontre une erreur sur un bloc, en l'ignorant. Non recommandé car cela peut mener à des données incomplètes.

## 2. La Source de Données Statique : `dataSources`

Cette section définit les contrats intelligents dont l'adresse est fixe et connue au moment du déploiement. Pour nous, il s'agit du contrat `MakaoFactory`. C'est le point d'entrée de notre écosystème.

```yaml
dataSources:
  - kind: ethereum
name: MakaoFactory
network: sepolia
source:
address: "0x68b7e0417ec5cAc421E5DC4C172a80D7dD8dAa04"
abi: MakaoFactory
startBlock: 8568022
mapping:

# ...

eventHandlers:
  - event: CreateInstance(indexed address)
handler: handleCreateInstance
file: ./src/makao-factory.ts
```

| Paramètre                       | Description                                                                                                                                             |
| :------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `name: MakaoFactory`            | Un nom interne pour identifier cette source de données.                                                                                                 |
| `source.address`                | L'adresse du contrat `MakaoFactory` que nous surveillons.                                                                                               |
| `source.startBlock`             | **Crucial :** Indique au subgraph de ne commencer l'indexation qu'à partir de ce bloc. Cela évite de scanner toute l'histoire de la chaîne inutilement. |
| `eventHandlers`                 | **Le cœur de la logique :** Cette section mappe des événements à des fonctions.                                                                         |
| `event: CreateInstance(...)`    | L'événement spécifique que nous écoutons sur le contrat Factory.                                                                                        |
| `handler: handleCreateInstance` | La fonction dans `src/makao-factory.ts` qui sera exécutée chaque fois que l'événement `CreateInstance` est détecté.                                     |

## 3. Les Sources de Données Dynamiques : `templates`

Un `template` est un modèle de source de données "dormant". Il n'est pas actif au démarrage, mais peut être "réveillé" (instancié) par notre code pour commencer à surveiller une nouvelle adresse de contrat. C'est la solution parfaite pour notre architecture de type "Factory".

Notre manifeste définit deux templates :

### Template 1 : Le Contrat de Marché (`MakaoFixture`)

Ce template est utilisé pour surveiller chaque marché individuel créé par la factory.

```yaml
templates:

- kind: ethereum
name: MakaoFixture
network: sepolia
source:
abi: MakaoFixture
mapping:

# ...

eventHandlers:
- event: EngageChallenge(...)
handler: handleEngageChallenge
\# ... autres événements du marché
```

- **La différence clé :** Notez l'absence d'une `source.address`. C'est normal, car nous ne connaissons pas encore l'adresse du marché qui sera créé.
- **Activation :** Ce template est activé depuis notre code, dans la fonction `handleCreateInstance`, via un appel à `MakaoFixture.create(newInstanceAddress)`. Dès cet instant, le subgraph commence à surveiller cette nouvelle adresse pour les événements comme `EngageChallenge`, `ResolveEvent`, etc.

### Template 2 : Le Contenu IPFS (`IpfsContent`)

Ce template est radicalement différent. Son but n'est pas de surveiller un contrat, mais de récupérer un fichier sur IPFS.

```yaml
templates:
  - name: IpfsContent
kind: file/ipfs
mapping:
apiVersion: 0.0.9
language: wasm/assemblyscript
file: ./src/ipfs-handler.ts
handler: handleIpfsContent
entities:
  - Market
  - MarketMetadata
  - MarketEvent
```

- **`kind: file/ipfs`**: Indique que la source de données est un fichier IPFS, pas un contrat Ethereum.
- **Activation :** Ce template est également activé depuis `handleCreateInstance` via un appel à `IpfsContent.create(ipfsHash)`. Le Graph Node tentera alors de récupérer le fichier correspondant au hash et, en cas de succès, exécutera la fonction `handleIpfsContent` du fichier `src/ipfs-handler.ts`.
- **Gestion des entités** : Ce handler a la permission de modifier `Market`, `MarketMetadata` et `MarketEvent`. Cependant, par conception (voir la documentation sur l'architecture), notre logique dans `handleIpfsContent` ne modifie **jamais** l'entité `Market` parente pour garantir la séparation des données on-chain et off-chain et éviter les conditions de course.

## 4. Schéma du Flux Orchestré par le Manifeste

En résumé, le `subgraph.yaml` met en place le flux suivant :

1.  Au démarrage, le subgraph surveille uniquement le contrat `MakaoFactory`.
2.  Un utilisateur crée un marché, et le contrat `MakaoFactory` émet un événement `CreateInstance`.
3.  Le manifeste déclenche l'exécution du handler `handleCreateInstance`.
4.  Dans ce handler, notre code lit l'adresse du nouveau marché et son hash IPFS, puis active les deux templates :
    a. Le template `MakaoFixture` est instancié, lançant la surveillance des événements sur le nouveau contrat de marché.
    b. Le template `IpfsContent` est instancié, lançant la récupération asynchrone des métadonnées sur IPFS.
5.  Le subgraph écoute désormais les événements du contrat `MakaoFactory` **ET** du nouveau contrat de marché, tout en attendant les données d'IPFS en arrière-plan.
