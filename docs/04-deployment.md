# Guide de Déploiement

Ce document décrit le processus complet pour déployer le subgraph Makao. Suivre ces étapes méthodiquement est crucial pour garantir un déploiement réussi, quel que soit l'environnement cible (testnet, production) ou le fournisseur d'infrastructure.

## 1. Checklist Essentielle Avant Chaque Déploiement

Avant de lancer la moindre commande, il est impératif de valider la configuration du subgraph. La majorité des échecs de déploiement proviennent d'une configuration incorrecte dans le fichier manifeste.

### A. Validation du Fichier `subgraph.yaml`

Ce fichier est le cerveau de votre subgraph. Chaque paramètre doit correspondre précisément au réseau de destination.

1.  **Le Réseau (`network`)**

    - Assurez-vous que le champ `network` est correct pour chaque source de données (`dataSources`) et chaque modèle (`templates`).
    - Exemples : `sepolia`, `matic` (pour Polygon PoS), `mainnet`.

2.  **L'Adresse du Contrat (`address`)**

    - Vérifiez que l'adresse du contrat dans `dataSources` est bien celle qui est déployée sur le réseau cible.
    - `address: "0x68b7e0417ec5cAc421E5DC4C172a80D7dD8dAa04"` est valide pour Sepolia, mais sera différente sur un autre réseau.

3.  **Le Bloc de Démarrage (`startBlock`)**

    - Ce paramètre indique au subgraph à partir de quel bloc commencer l'indexation. Il doit correspondre au bloc de création de votre contrat sur le réseau cible.
    - **Pour trouver le `startBlock` :** Allez sur un explorateur de blockchain (Etherscan, Polygonscan), trouvez la transaction de création de votre contrat et notez le numéro du bloc.

4.  **Les Fonctionnalités Spécifiques (`features`)**
    - Certaines fonctionnalités (comme `nonFatalErrors` ou `grafting`) ne sont pas supportées par tous les fournisseurs.
    - Avant d'utiliser une feature, vérifiez sa compatibilité avec la documentation de votre hébergeur.

### B. Validation des Fichiers ABIs

- Assurez-vous que les fichiers ABI dans le dossier `/abis` (ex: `MakaoFactoryLight.json`) correspondent exactement à la version des contrats intelligents déployés sur le réseau cible. Un décalage dans les ABIs est une source d'erreurs d'indexation silencieuses.

---

## 2. Processus de Déploiement Étape par Étape

### Étape 1 : Préparation et Compilation Locale

Ces commandes permettent de s'assurer que le projet est propre et qu'il compile sans erreur avant toute tentative de déploiement.

```


# 1. Nettoyer les anciens artefacts de build

graph clean ; rm -rf generated/ ; rm -rf build/

# 2. Générer les types AssemblyScript à partir du schéma GraphQL

npm run codegen

# 3. Compiler le subgraph en WebAssembly (WASM)

npm run build

```

> **Conseil de pro :** Après `npm run build`, effectuez une validation locale avec Docker (`npm run deploy-local`) pour simuler l'indexation et détecter d'éventuelles erreurs de mapping avant même de déployer à distance.

### Étape 2 : Déploiement sur le Nœud Distant

Une fois le subgraph compilé, il peut être déployé sur le service de votre choix (Subgraph Studio, Chainstack, Zeeve, etc.). La commande générale est la suivante :

```

graph deploy <NOM_DU_SUBGRAPH> \
--node <URL_DU_NOEUD_DE_DEPLOIEMENT> \
--ipfs <URL_DU_GATEWAY_IPFS> \
--deploy-key <VOTRE_CLE_DE_DEPLOIEMENT> \
--version-label <ETIQUETTE_DE_VERSION>

```

- `<NOM_DU_SUBGRAPH>`: Le nom de votre subgraph (souvent au format `organisation/nom`).
- `<URL_DU_NOEUD_DE_DEPLOIEMENT>`: Fournie par votre hébergeur.
- `<URL_DU_GATEWAY_IPFS>`: Également fournie par votre hébergeur.
- `<VOTRE_CLE_DE_DEPLOIEMENT>`: La clé d'authentification pour autoriser le déploiement.
- `<ETIQUETTE_DE_VERSION>`: Voir la section sur le versioning ci-dessous.

---

## 3. Bonnes Pratiques

### A. Gestion des Déploiements sur Plusieurs Réseaux

Pour éviter de modifier manuellement `subgraph.yaml` à chaque fois, `graph-cli` offre une méthode plus propre via un fichier `networks.json`.

1.  **Créez un fichier `networks.json`** à la racine de votre projet :

    ```
    {
      "sepolia": {
        "MakaoFactory": {
          "address": "0x68b7e0417ec5cAc421E5DC4C172a80D7dD8dAa04",
          "startBlock": 8568022
        }
      },
      "polygon": {
        "MakaoFactory": {
          "address": "0x...",
          "startBlock": 12345678
        }
      }
    }
    ```

2.  **Déployez en spécifiant le réseau :**
    ```
    # Cette commande mettra à jour subgraph.yaml avec les infos de "polygon" avant de construire et déployer.
    graph deploy <NOM_DU_SUBGRAPH> --network polygon ...
    ```

### B. Versioning des Déploiements

Utilisez systématiquement le flag `--version-label` pour versionner vos déploiements. Cela permet de suivre les changements et de revenir à une version précédente en cas de problème.

Adoptez une convention, par exemple le **versioning sémantique (SemVer)** :

- `v1.0.0`: Première version stable.
- `v1.1.0`: Ajout d'une fonctionnalité sans casser la compatibilité.
- `v1.0.1`: Correction d'un bug sans casser la compatibilité.

### C. Récupération d'Urgence avec le "Grafting"

Si une version déployée échoue après avoir indexé des millions de blocs, tout ré-indexer prendrait des heures. Le "grafting" (greffage) permet de démarrer un nouveau subgraph en réutilisant les données déjà indexées par un ancien déploiement jusqu'à un certain bloc.

1.  **Identifiez le bloc** avant l'erreur dans le subgraph défaillant.
2.  **Ajoutez une section `graft`** dans votre `subgraph.yaml` corrigé :
    ```
    features:
      - grafting
    graft:
      base: <ID_DE_DEPLOIEMENT_DU_SUBGRAPH_DEFAILLANT> # L'ID est le hash Qm...
      block: <NUMERO_DU_BLOC_AVANT_ERREUR>
    ```
3.  Déployez cette nouvelle version. Elle commencera à indexer uniquement à partir du bloc spécifié, économisant un temps précieux.

> **Note :** Le grafting est une solution de court terme pour les corrections urgentes. Il est recommandé de redéployer une version "propre" (sans greffe) une fois la situation stabilisée.
