# Luxe E-commerce - Application Full-Stack

Cette application est une plateforme e-commerce moderne, performante et sécurisée, conçue pour être déployée sur l'offre gratuite (Free Tier) de Google Cloud Platform (GCP). Elle utilise une stack technique composée de React/TypeScript pour le frontend et Node.js/Express pour le backend.

## Architecture

L'application est conçue pour fonctionner sur une seule instance (ex: GCE e2-micro ou Cloud Run) afin de minimiser les coûts.

-   **Frontend** : Application React (Single Page Application) construite en fichiers statiques.
-   **Backend** : Serveur Node.js avec Express qui remplit deux rôles :
    1.  Servir les fichiers statiques du frontend React.
    2.  Exposer une API RESTful pour la gestion des données (produits, utilisateurs, commandes, etc.).
-   **Base de données** : Conçue pour utiliser PostgreSQL (via Cloud SQL).
-   **Stockage Média** : Les images des produits sont destinées à être stockées sur Google Cloud Storage pour plus de scalabilité et de performance.

## Fonctionnalités (Cibles)

-   Catalogue de produits avec recherche et filtrage.
-   Panier d'achat.
-   Authentification des utilisateurs (JWT).
-   Processus de commande.
-   Panel d'administration pour la gestion des produits.
-   Historique des commandes pour les utilisateurs.

## Installation et Lancement Local

### Prérequis

-   Node.js (v18 ou supérieur)
-   npm ou yarn

### Étapes

1.  **Cloner le dépôt**
    ```bash
    git clone <url-du-repo>
    cd luxe-ecommerce-fullstack
    ```

2.  **Installer les dépendances**
    ```bash
    npm install
    ```

3.  **Configuration de l'environnement**
    Créez un fichier `.env` à la racine du projet en vous basant sur le modèle `.env.example`.
    ```
    PORT=8080
    NODE_ENV=development
    ```

4.  **Lancer le serveur de développement**
    Ce projet utilise `tsx` pour une exécution directe des fichiers TypeScript et `concurrently` pour lancer le serveur et potentiellement un client de développement en parallèle.
    ```bash
    npm run dev
    ```
    Le serveur sera accessible à l'adresse `http://localhost:8080`.

## Déploiement sur GCP (Compute Engine e2-micro)

1.  **Build de l'application**
    Avant de déployer, compilez le code TypeScript du serveur en JavaScript.
    ```bash
    npm run build
    ```
    Cette commande va créer un dossier `dist/` contenant le code serveur prêt pour la production.

2.  **Configuration de l'instance GCE**
    -   Créez une instance `e2-micro` dans une région éligible au Free Tier (ex: `us-central1`).
    -   Installez Node.js, npm et git sur l'instance.
    -   Ouvrez les ports HTTP (80) et HTTPS (443) dans les règles de pare-feu.

3.  **Déploiement du code**
    -   Clonez votre dépôt sur l'instance.
    -   Installez les dépendances de production : `npm install --production`.
    -   Copiez vos variables d'environnement de production (par exemple via Secret Manager).

4.  **Lancement avec PM2**
    PM2 est un gestionnaire de processus qui maintiendra l'application en ligne.
    ```bash
    npm install -g pm2
    npm run prod
    ```
    Le fichier `ecosystem.config.cjs` est configuré pour lancer l'application en mode `cluster` pour une meilleure performance.

## Structure des Fichiers

```
/
├── public/               # Contient les fichiers statiques du client React (index.html, etc.)
├── src/
│   ├── components/       # Composants React
│   ├── services/         # Services frontend (ex: appel API)
│   ├── utils/            # Utilitaires frontend (ex: formatage)
│   ├── types.ts          # Définitions TypeScript partagées
│   ├── App.tsx           # Composant React principal
│   └── index.tsx         # Point d'entrée React
│
├── src-server/           # Code source du backend
│   ├── api/              # Routeurs de l'API Express
│   ├── services/         # Logique métier du backend
│   ├── config/           # Configuration (ex: logger)
│   └── server.ts         # Point d'entrée du serveur Express
│
├── dist/                 # Code compilé du serveur (production)
├── .env.example          # Modèle pour les variables d'environnement
├── ecosystem.config.cjs  # Configuration PM2
├── package.json
└── tsconfig.server.json  # Configuration TypeScript pour le serveur
```
