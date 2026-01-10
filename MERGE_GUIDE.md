# Merge Guide: Integrating New Webapp Frontend

This guide explains how to merge the Next.js frontend from `new-webapp-final` repository into the current Luxe E-commerce project.

## Overview

**Current Repository**: Full-stack React/Vite + Node.js/Express backend with PostgreSQL  
**New Repository**: Next.js 16 App Router frontend (no backend)

The new webapp is a modern Next.js frontend that needs to be integrated with the existing Express backend.

## Architecture Decision

Since the current repository has a complete backend infrastructure with:
- Cloud Run deployment
- PostgreSQL database with migrations
- Express API with authentication
- CI/CD pipeline
- Blue-green deployment strategy

**Recommended Approach**: Keep the current backend and integrate the Next.js frontend components selectively.

## Integration Strategy

### Option 1: Frontend Component Migration (Recommended)

Migrate useful UI components from the new webapp into the current Vite/React frontend:

1. **Copy Modern UI Components**:
   ```bash
   # From new-webapp-final/src/components/ to current components/
   - UI components (Accordion, Modal, Button, Icons)
   - Product components (ProductCard, ProductShowroom, FilterBar)
   - Layout components (SiteHeader, SiteFooter)
   ```

2. **Adapt Styling**:
   - The new webapp uses Tailwind with custom design tokens
   - Update `tailwind.config.cjs` to include new design tokens
   - Copy relevant CSS from `globals.css`

3. **Keep Current Backend**:
   - Maintain Express API endpoints
   - Use existing authentication system
   - Continue using current database schema

### Option 2: Replace Frontend Completely

Replace the entire Vite/React frontend with Next.js:

**Prerequisites**:
- Ensure Next.js can communicate with Express backend (CORS, API routes)
- Update Cloud Build configuration for Next.js
- Modify Docker configuration for Next.js

**Steps**:
1. Move `new-webapp-final` content to a new `/client-next` directory
2. Update `cloudbuild.yaml` to build Next.js instead of Vite
3. Configure Next.js API proxy to Express backend
4. Update deployment scripts

### Option 3: Separate Frontend Deployment

Deploy Next.js frontend separately from backend:

1. Deploy Express backend on Cloud Run (current setup)
2. Deploy Next.js frontend on Vercel or separate Cloud Run instance
3. Configure CORS on backend for frontend origin
4. Update environment variables with backend API URL

## Database Schema Updates

The new webapp includes a **Favorites** feature. Database migration has been added:

### New Migration: `005_add_user_favorites.sql`

```sql
CREATE TABLE IF NOT EXISTS user_favorites (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
```

### Updated Schema: `src-server/db/schema.ts`

Added `userFavorites` table definition for Drizzle ORM.

### Backend API Endpoints Needed

Create these endpoints in Express to support favorites:

```typescript
// GET /api/favorites - Get user's favorite products
// POST /api/favorites/:productId - Add product to favorites
// DELETE /api/favorites/:productId - Remove product from favorites
```

## Step-by-Step Merge Process

### Phase 1: Prepare (No Code Changes)

1. **Review New Webapp Features**:
   ```bash
   cd /tmp/new-webapp-final
   npm install
   npm run dev
   # Review at http://localhost:3000
   ```

2. **Identify Components to Migrate**:
   - List UI improvements worth adopting
   - Note breaking changes
   - Document dependencies

### Phase 2: Database Migration

1. **Apply Migration**:
   ```bash
   cd infra/terraform
   # If using Terraform-managed Cloud SQL
   terraform apply -var="enable_cloud_sql=true"
   
   # Or manually via Cloud SQL proxy
   psql -h localhost -U luxe_user -d luxe_db -f migrations/005_add_user_favorites.sql
   ```

2. **Verify Schema**:
   ```sql
   \d user_favorites
   SELECT * FROM user_favorites LIMIT 1;
   ```

### Phase 3: Backend API (Favorites)

Create `/src-server/routes/favorites.ts`:

```typescript
import express from 'express';
import { db } from '../db/connection.js';
import { userFavorites } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const router = express.Router();

// Get user favorites
router.get('/', async (req, res) => {
  const userId = req.user?.id; // Assumes auth middleware
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  const favorites = await db.select()
    .from(userFavorites)
    .where(eq(userFavorites.userId, userId));
  
  res.json(favorites);
});

// Add favorite
router.post('/:productId', async (req, res) => {
  const userId = req.user?.id;
  const productId = parseInt(req.params.productId);
  
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  await db.insert(userFavorites)
    .values({ userId, productId })
    .onConflictDoNothing();
  
  res.json({ success: true });
});

// Remove favorite
router.delete('/:productId', async (req, res) => {
  const userId = req.user?.id;
  const productId = parseInt(req.params.productId);
  
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  await db.delete(userFavorites)
    .where(and(
      eq(userFavorites.userId, userId),
      eq(userFavorites.productId, productId)
    ));
  
  res.json({ success: true });
});

export default router;
```

Register in main Express app:
```typescript
import favoritesRouter from './routes/favorites.js';
app.use('/api/favorites', requireAuth, favoritesRouter);
```

### Phase 4: Frontend Integration

**If keeping Vite/React** (Option 1):

1. **Copy UI Components**:
   ```bash
   cp -r /tmp/new-webapp-final/src/components/ui components/ui
   cp /tmp/new-webapp-final/src/components/favorites/FavoritesProvider.tsx components/favorites/
   ```

2. **Update to Use Backend API**:
   Replace localStorage-based favorites with API calls:
   ```typescript
   // Instead of localStorage
   const [favorites, setFavorites] = useState([]);
   
   useEffect(() => {
     fetch('/api/favorites')
       .then(res => res.json())
       .then(setFavorites);
   }, []);
   ```

3. **Add Tailwind Config**:
   Merge design tokens from new webapp's `tailwind.config.js`

### Phase 5: Testing

1. **Test Database Migration**:
   ```bash
   npm run test -- migrations
   ```

2. **Test API Endpoints**:
   ```bash
   curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/favorites
   ```

3. **Test Frontend**:
   ```bash
   npm run dev
   # Navigate to favorites page
   ```

4. **Integration Tests**:
   - Add/remove favorites
   - Check persistence across sessions
   - Verify user isolation (users can't see others' favorites)

### Phase 6: Deployment

1. **Run Migration in Production**:
   ```bash
   gcloud run jobs execute luxe-modern-ecommerce-api-migrations \
     --region europe-west1 \
     --project malafaareh-481713
   ```

2. **Deploy Backend with New API**:
   ```bash
   cd infra/terraform
   terraform apply
   ```

3. **Deploy Frontend** (if changed):
   Update Cloud Build trigger or deploy manually

## Rollback Plan

If issues occur:

1. **Database Rollback**:
   ```sql
   DROP TABLE IF EXISTS user_favorites;
   ```

2. **Code Rollback**:
   ```bash
   git revert <commit-hash>
   ./scripts/rollback.sh <project-id>
   ```

## Security Considerations

1. **User Favorites Access Control**:
   - Ensure users can only access their own favorites
   - Validate product IDs exist before adding to favorites
   - Rate limit favorites API to prevent abuse

2. **Database Constraints**:
   - UNIQUE constraint prevents duplicate favorites
   - Foreign keys ensure data integrity
   - Cascade delete removes favorites when user deleted

## Performance Optimization

1. **Indexes**: Already created on `user_id` and `product_id`
2. **Caching**: Consider Redis cache for frequently accessed favorites
3. **Pagination**: Implement pagination for users with many favorites

## Next Steps

After successful merge:

1. ✅ Database schema updated for favorites
2. ⏳ Create Express API endpoints for favorites
3. ⏳ Update frontend to use favorites API
4. ⏳ Test favorites feature end-to-end
5. ⏳ Deploy to staging environment
6. ⏳ Deploy to production with blue-green strategy
7. ⏳ Consider migrating other components from new webapp

## Questions?

For issues during merge, check:
- Current logs: `gcloud logging read "resource.type=cloud_run_revision" --limit 50`
- Database connection: Verify Cloud SQL proxy is running
- API authentication: Ensure JWT tokens are valid
- CORS settings: Check `ALLOWED_ORIGINS` environment variable

## References

- New Webapp Repo: https://github.com/Marubozu-Ousseini/new-webapp-final.git
- Current Backend API: `/src-server/`
- Terraform Config: `/infra/terraform/`
- Migrations: `/migrations/`
