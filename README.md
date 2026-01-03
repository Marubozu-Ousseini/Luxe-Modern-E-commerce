# Luxe E-commerce - Application Full-Stack

Cette application est une plateforme e-commerce moderne, performante et sécurisée, conçue pour être déployée sur l'offre gratuite (Free Tier) de Google Cloud Platform (GCP). Elle utilise une stack technique composée de React/TypeScript pour le frontend et Node.js/Express pour le backend.

## Architecture

L'architecture cible est 100% serverless pour bénéficier du modèle à la demande de GCP.

-   **Frontend** : Application React (SPA) compilée avec Vite puis servie depuis un bucket Cloud Storage derrière Cloud CDN (ou Firebase Hosting). CDN gère HTTPS et cache longue durée.
-   **Backend/API** : Serveur Node.js/Express conteneurisé et exécuté sur Cloud Run (Gen2) avec CPU=1, 512 MiB, `concurrency=80`, `minInstances=0`, `maxInstances=5`. CPU n'est facturé que pendant les requêtes.
-   **Scripts Admin** : Tâches ponctuelles (reset admin, migrations) exécutées via Cloud Run Jobs pour éviter des conteneurs persistants.
-   **Base de données** : Cloud SQL Postgres `db-f1-micro` avec IAM auth et mot de passe stocké dans Secret Manager. Elle est désactivée par défaut (`enable_cloud_sql=false`) pour réduire les coûts lorsqu'aucune fonctionnalité relationnelle n'est requise.
-   **Secrets & Config** : Google Secret Manager stocke `jwt-secret`, `admin-password`, `db-password`, `stripe-*`. Terraform référence toujours `version = "latest"` pour simplifier la rotation.
-   **CI/CD** : Cloud Build trigger (GitHub) lance tests, build client + serveur, synchronise le bundle statique, construit l'image via Kaniko (cache 48h) puis déploie Cloud Run.
-   **Observabilité & coûts** : Log retention ramenée à 30 jours, métrique `db-connection-failures`, uptime check `https://api.<domaine>/health`, budgets GCP optionnels (50/80/100%).

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

## Déploiement serverless (Cloud Run + Cloud Storage)

1. **Préparer les variables Terraform**
    - Copier `infra/terraform/terraform.tfvars.example` vers `terraform.tfvars` et renseigner `project_id`, `region (europe-west1)`, `domain`, `bucket_name`, secrets (`jwt_secret`, `admin_password`, etc.).
    - Laisser `enable_cloud_sql=false` jusqu'à ce que Postgres soit nécessaire.
    - (Optionnel) Renseigner `billing_account_id` pour créer un budget automatisé.

2. **Provisionner l'infrastructure**
    ```bash
    cd infra/terraform
    terraform init
    terraform plan
    terraform apply
    ```
    Cela crée : bucket statique + CDN, Cloud Run service, secrets, triggers Cloud Build, métriques, budgets (si configurés).

3. **Connecter Cloud Build à GitHub**
    - Terraform crée le trigger `luxe-modern-ecommerce-api-deploy`. Autorisez-le dans la console Cloud Build (OAuth GitHub).
    - Chaque push sur `main` lancera `cloudbuild.yaml`.

4. **Pipeline Cloud Build (`cloudbuild.yaml`)**
    - `npm ci`, tests unitaires + smoke, build client (`dist/client`) et serveur (`dist/`), upload statique (si `_DEPLOY_STATIC=true`) vers `gs://<bucket>`.
    - Kaniko construit/publie l'image `$_REGION-docker.pkg.dev/<project>/<repo>/<service>:$_IMAGE_TAG` avec cache de couches.
    - (Optionnel) Migrations `node dist/scripts/migrate.js` si `_RUN_MIGRATIONS=true` et secret `DATABASE_URL` disponible.
    - `gcloud run deploy` applique CPU/mémoire/concurrency recommandés.

5. **DNS**
    - Pointer `@` et `www` vers l'IP globale Terraform (`lb_ip_address`).
    - Pointer `api.<domaine>` vers l'URL Cloud Run (ou configurer une domain mapping gérée par GCP).

6. **Vérifications post-déploiement**
    - Executer l'uptime check (`monitoring.tf`), confirmer que `db-connection-failures` reste à 0.
    - En cas de Postgres activé, lancer `gcloud run jobs execute <service>-reset-admin` pour réinitialiser l'admin.

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

- URL publique du site: `https://www.malafaareh.com` (hébergé depuis Cloud Storage + Cloud CDN).
- Backend API exposé via Cloud Run: `https://api.malafaareh.com` (ou l'URL auto-générée Cloud Run si le DNS n'est pas encore configuré).
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
