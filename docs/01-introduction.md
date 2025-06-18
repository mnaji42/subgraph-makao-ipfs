# Introduction au Subgraph Makao

Bienvenue dans la documentation du Subgraph Makao. Ce document est le point de départ pour comprendre le rôle, le fonctionnement et l'utilité de ce projet au sein de l'écosystème Makao.

## 1. Objectif Principal

Les données brutes sur une blockchain, bien que sécurisées et transparentes, sont difficiles à consommer directement par une application. Elles ne sont pas optimisées pour des opérations de recherche, de tri ou de filtrage complexes.

**L'objectif du Subgraph Makao est de résoudre ce problème.** Il indexe, traite et organise les données de nos contrats intelligents pour les transformer en une API GraphQL performante, structurée et facile à utiliser.

## 2. Qu'est-ce que le Subgraph Makao ?

En termes simples, le Subgraph Makao agit comme un **traducteur et un archiviste intelligent** pour notre écosystème.

- Il **écoute** en temps réel tous les événements importants émis par nos contrats intelligents (`MarketCreated`, `UserEngagement`, etc.).
- Il **transforme** ces événements bruts en entités de données claires et structurées (comme `Market`, `User`, `Engagement`).
- Il **enrichit** ces données avec des informations supplémentaires stockées hors de la chaîne (comme les métadonnées de marché sur IPFS).
- Il **sert** ces données via une API GraphQL, permettant à nos applications de récupérer précisément l'information dont elles ont besoin avec une seule requête.

Au lieu d'interroger directement la blockchain, nos applications interrogent le subgraph, ce qui est beaucoup plus rapide et flexible.

## 3. À qui s'adresse cette documentation ?

Cette documentation est destinée à plusieurs profils :

- **Les développeurs Frontend/Mobile :** Pour comprendre quelles données sont disponibles et comment les interroger efficacement pour construire les interfaces utilisateur.
- **Les développeurs Backend :** Pour intégrer les données du subgraph dans d'autres services.
- **Les développeurs de contrats intelligents :** Pour comprendre comment les événements qu'ils émettent sont indexés et utilisés.
- **Les nouveaux membres de l'équipe :** Pour avoir une vue d'ensemble rapide et complète de ce composant central de notre architecture.

## 4. Périmètre et Fonctionnalités Clés

Ce subgraph est responsable de l'indexation des fonctionnalités suivantes :

- **Création des marchés :** Il indexe chaque nouveau marché créé via le contrat `MakaoFactory`.
- **Suivi de l'activité des marchés :** Il suit les engagements, les résolutions et les annulations pour chaque marché individuel (`MakaoFixture`).
- **Enrichissement via IPFS :** Il récupère de manière asynchrone les métadonnées (nom, description, image, etc.) stockées sur IPFS et les lie aux marchés correspondants.
- **Agrégation de statistiques globales :** Il maintient des statistiques clés sur la plateforme, comme le volume total engagé ou le nombre total de marchés.

## 5. Comment utiliser cette documentation ?

Maintenant que vous avez une vue d'ensemble, voici où aller ensuite :

- Pour comprendre **comment les différentes pièces s'assemblent**, consultez le document sur l'**[Architecture](./02-architecture.md)**.
- Pour savoir **comment récupérer les données**, lisez le guide sur **[Comment Interroger l'API](./05-how-to-query.md)**.
- Pour **déployer une nouvelle version** du subgraph, suivez le **[Guide de Déploiement](./04-deployment.md)**.
