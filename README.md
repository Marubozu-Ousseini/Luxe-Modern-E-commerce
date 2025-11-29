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
    Points clés pour l'administration:
    - Définir `JWT_SECRET` avec une valeur forte.
    - Définir `ADMIN_EMAIL` et `ADMIN_PASSWORD` pour créer automatiquement le compte admin au démarrage.
    - En production (domaine malafaareh.com), définir `COOKIE_DOMAIN=.malafaareh.com` et `ALLOWED_ORIGINS` avec vos origines front.
    
    Exemple minimal local:
    ```env
    PORT=8080
    NODE_ENV=development
    JWT_SECRET=change-me
    ADMIN_EMAIL=admin@malafaareh.com
    ADMIN_PASSWORD=ChangeMe_Initial_Admin_Password!
    ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
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

## Updating the Admin Password (Recommended)

- Use Secret Manager to update the `admin-password` secret rather than editing files inside the container.
- Example: create a new secret version with the new password and then update the Cloud Run service to reference the `latest` version:

```bash
# add a new version with the new admin password (stdin)
echo -n 'NewStrongPass!' | gcloud secrets versions add admin-password --data-file=- --project=$PROJECT_ID

# tell Cloud Run to use the latest secret version for the runtime env var
gcloud run services update $SERVICE --update-secrets=ADMIN_PASSWORD=admin-password:latest --region=$REGION --project=$PROJECT_ID
```

- Once the new revision is up, you can (optionally) disable older secret versions for extra safety:

```bash
gcloud secrets versions disable <VERSION_NUMBER> --secret=admin-password --project=$PROJECT_ID
```

This approach avoids baking credentials into images or editing runtime files inside containers. It seeds or updates the admin account on service startup when the app reads `ADMIN_PASSWORD` from the environment.
## Accès Admin et Backend

- URL publique du site: `https://www.malafaareh.com`
- Backend API est servi par le même hôte (ex: `https://www.malafaareh.com/api/...`).
- Page d'administration frontend: `https://www.malafaareh.com/admin`

### Création automatique de l'admin

Au démarrage du serveur, si `ADMIN_EMAIL` et `ADMIN_PASSWORD` sont définis dans l'environnement, un utilisateur admin est créé s'il n'existe pas déjà. Par défaut, l'email recommandé est `admin@malafaareh.com`.

Variables à définir en production:

```env
NODE_ENV=production
PORT=8080
LOG_LEVEL=info
JWT_SECRET=<secret-fort>
ADMIN_EMAIL=admin@malafaareh.com
ADMIN_PASSWORD=<mot_de_passe_admin_initial>
COOKIE_DOMAIN=.malafaareh.com
ALLOWED_ORIGINS=https://www.malafaareh.com,https://malafaareh.com
```

### Cookies et CORS

- Les cookies JWT sont marqués `httpOnly` et `secure` en production. Assurez-vous d'utiliser HTTPS.
- `COOKIE_DOMAIN` doit être `.malafaareh.com` pour que le cookie fonctionne sur `www.malafaareh.com` et `malafaareh.com`.
- `ALLOWED_ORIGINS` doit contenir les origines autorisées à appeler l'API avec `credentials: true`.

### Se connecter en admin

1. Accédez à `/login` et connectez-vous avec `admin@malafaareh.com` et le mot de passe défini dans `ADMIN_PASSWORD`.
2. Ouvrez `/admin` pour gérer les produits (CRUD via `/api/admin/produits`).
3. Pour invalider la session, utilisez le bouton de déconnexion (ou l'endpoint `/api/auth/logout`).

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
