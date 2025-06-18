<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# Je dois faire la documentation du subgraph que je suis en train de faire.

On a toute les informations dans une autre converstaion perplexity, mais elle est devenu trop longue.

Donc je crée une nouvelle conversation pour organiser cette documentation.

Tu trouveras en pièce jointe le readme actuel qu'il faudra modifier.

Dans un premier temps ne génére aucun fichier, juste explique moi comment organiser de manière scalable cette documentation (quels dossiers / fichiers créer etc...)

Je veux que la documentation soit simple (mais précise car on à du faire beaucoups choses techniques critiques)

Voilà donc dans un premier temps propose moi une architecture pour la documentation et un readme mis à jour

Absolument. Pour créer une documentation à la fois simple, précise et évolutive pour votre subgraph Makao, il est judicieux de séparer la documentation du code source et de la structurer de manière logique.

Voici une proposition d'architecture pour votre documentation et une version mise à jour de votre fichier `README.md`.

### **1. Architecture de la Documentation**

Je vous suggère de créer un dossier `docs/` à la racine de votre projet. Cette approche permet de garder le répertoire principal propre et de centraliser toute la documentation en un seul endroit [^1]. Une structure bien organisée facilite la maintenance et la compréhension du projet pour les nouveaux arrivants [^2].

Voici une arborescence de fichiers que vous pourriez adopter à l'intérieur de ce dossier `docs/` :

```
/docs
├── 01-introduction.md
├── 02-architecture.md
├── 03-subgraph-details
│   ├── 01-schema-graphql.md
│   ├── 02-data-sources.md
│   └── 03-mappings.md
├── 04-deployment.md
├── 05-how-to-query.md
└── 06-contributing.md
```

**Description des fichiers :**

* `01-introduction.md`: Présentez l'objectif du subgraph. Quel problème résout-il ? Quelle est sa finalité dans l'écosystème Makao ?
* `02-architecture.md`: Fournissez une vue d'ensemble de l'architecture technique. Expliquez comment les données circulent depuis les contrats intelligents jusqu'à l'API GraphQL interrogeable [^3]. C'est ici que vous pouvez schématiser les interactions critiques.
* `03-subgraph-details/`: Ce dossier contient les explications techniques détaillées, qui sont essentielles pour la précision [^4].
    * `01-schema-graphql.md`: Décrivez en détail votre fichier `schema.graphql`. Expliquez chaque entité, ses champs, et les relations entre elles [^5].
    * `02-data-sources.md`: Expliquez le fichier manifeste `subgraph.yaml`. Détaillez les sources de données (les contrats intelligents), les événements écoutés et les gestionnaires d'événements (handlers) correspondants [^3].
    * `03-mappings.md`: C'est le cœur de votre documentation technique. Décrivez la logique de chaque fonction de mapping en AssemblyScript. Expliquez comment les données des événements sont transformées et stockées dans les entités que vous avez définies [^3].
* `04-deployment.md`: Donnez des instructions détaillées pour le déploiement sur différents environnements (testnet Sepolia, mainnet, etc.), en allant au-delà du simple déploiement local.
* `05-how-to-query.md`: Fournissez des exemples concrets de requêtes GraphQL que les utilisateurs peuvent exécuter pour récupérer des données. Montrez des exemples simples et complexes.
* `06-contributing.md`: Expliquez comment d'autres développeurs peuvent contribuer au projet, les conventions de code à suivre, et le processus pour soumettre des modifications [^6].

Cette structure modulaire est considérée comme une bonne pratique car elle favorise l'évolutivité et la maintenabilité en regroupant les fichiers par fonctionnalité [^2].

### **2. Proposition de README.md mis à jour**

Le fichier `README.md` à la racine de votre projet doit servir de portail d'accueil. Il doit donner un résumé rapide du projet et guider les utilisateurs vers la documentation complète pour plus de détails [^1]. La version actuelle est excellente comme guide de démarrage, mais elle peut être intégrée dans une présentation plus globale.

Voici une version améliorée :

---

# Makao Subgraph

[

## Aperçu

Le Subgraph Makao est un projet développé avec The Graph Protocol pour indexer et organiser les données de la blockchain liées à l'écosystème Makao. Il écoute les événements émis par nos contrats intelligents et les transforme en une API GraphQL structurée, permettant d'interroger efficacement les données on-chain.

Ce projet suit les meilleures pratiques pour le développement de modèles de données afin d'assurer la flexibilité et la cohérence [^7].

## Table des matières

* [Fonctionnalités Clés](#fonctionnalit%C3%A9s-cl%C3%A9s)
* [Démarrage Rapide](#d%C3%A9marrage-rapide)
* [Documentation Complète](#documentation-compl%C3%A8te)
* [Structure du Projet](#structure-du-projet)
* [Contribuer](#contribuer)
* [Licence](#licence)


## Fonctionnalités Clés

* **Indexation des contrats :** Indexe les événements des contrats X, Y, Z.
* **Schéma de données optimisé :** Entités `User`, `Transaction`, etc., conçues pour des requêtes performantes.
* **API GraphQL :** Fournit un point d'accès unique et simple pour accéder aux données de l'écosystème.


## Démarrage Rapide

### Prérequis

Assurez-vous d'avoir les outils suivants installés :

* **Git**
* **Node.js** (v18+)
* **npm** ou **Yarn**
* **Docker** et **Docker Compose**
* **Graph CLI** (`npm install -g @graphprotocol/graph-cli`)


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


## Contribuer

Les contributions sont les bienvenues ! Veuillez consulter notre [guide de contribution](./docs/06-contributing.md) pour plus de détails sur le processus.

## Licence

Ce projet est sous licence MIT.

<div style="text-align: center">⁂</div>

[^1]: https://eddy.hashnode.dev/the-importance-of-a-good-folder-structure-in-software-engineering

[^2]: https://dev.to/sathishskdev/part-2-folder-structure-building-a-solid-foundation-omh

[^3]: https://console.settlemint.com/documentation/knowledge-bank/subgraphs

[^4]: https://cdnsciencepub.com/doi/10.1139/cjfr-2024-0085

[^5]: https://www.quicknode.com/guides/infrastructure/blockchain-data-tools/how-to-create-a-custom-subgraph-with-thegraph

[^6]: https://gurukuljournal.com/achieving-syntax-excellence-best-practices-for-organizational-success/

[^7]: https://isjem.com/download/data-modeling-essentials-techniques-best-practices-and-future-trends/

[^8]: README.md

[^9]: https://pubs.lib.umn.edu/index.php/innovations/article/view/6147

[^10]: https://dl.acm.org/doi/10.1145/3685266

[^11]: https://www.mdpi.com/2076-3417/12/23/12046

[^12]: https://www.mdpi.com/2227-9032/12/16/1585

[^13]: https://allacademicresearch.com/index.php/AJAIMLDSMIS/article/view/128/

[^14]: https://hasura.io/docs/3.0/project-configuration/subgraphs/working-with-multiple-subgraphs/

[^15]: https://journals.lww.com/10.34067/KID.0000000000000277

[^16]: https://formative.jmir.org/2024/1/e65957

[^17]: https://thegraph.com/blog/improve-subgraph-performance-avoiding-large-arrays/

[^18]: http://thegraph.com/docs/en/subgraphs/querying/best-practices/

[^19]: https://www.apollographql.com/docs/graphos/routing/query-planning/query-planning-best-practices

[^20]: https://www.apollographql.com/docs/graphos/platform/production-readiness/environment-best-practices

[^21]: https://thegraph.com/docs/en/subgraphs/developing/creating/starting-your-subgraph/

