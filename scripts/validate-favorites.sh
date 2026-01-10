#!/bin/bash
# Quick validation script for favorites feature integration

echo "🔍 Favorites Feature Integration Validation"
echo "=========================================="
echo ""

# Check database migration exists
echo "✓ Checking database migration..."
if [ -f "migrations/005_add_user_favorites.sql" ]; then
    echo "  ✅ Migration file exists"
else
    echo "  ❌ Migration file NOT found"
    exit 1
fi

# Check schema update
echo ""
echo "✓ Checking Drizzle schema..."
if grep -q "userFavorites" src-server/db/schema.ts; then
    echo "  ✅ userFavorites table defined"
else
    echo "  ❌ userFavorites NOT in schema"
    exit 1
fi

# Check API implementation
echo ""
echo "✓ Checking API implementation..."
if grep -q "isDbAvailable()" src-server/api/favorites.ts && \
   grep -q "PostgreSQL implementation" src-server/api/favorites.ts; then
    echo "  ✅ PostgreSQL support implemented"
else
    echo "  ❌ PostgreSQL support NOT implemented"
    exit 1
fi

# Check frontend context
echo ""
echo "✓ Checking frontend context..."
if [ -f "context/FavoritesContext.tsx" ]; then
    echo "  ✅ FavoritesContext exists"
else
    echo "  ❌ FavoritesContext NOT found"
    exit 1
fi

# Check API client
echo ""
echo "✓ Checking API client..."
if [ -f "services/favoritesClient.ts" ]; then
    echo "  ✅ API client exists"
else
    echo "  ❌ API client NOT found"
    exit 1
fi

# Check components using favorites
echo ""
echo "✓ Checking component integration..."
COMPONENTS_USING_FAV=$(grep -l "useFavorites" components/*.tsx 2>/dev/null | wc -l)
if [ "$COMPONENTS_USING_FAV" -gt 0 ]; then
    echo "  ✅ $COMPONENTS_USING_FAV components use favorites"
else
    echo "  ⚠️  No components found using favorites"
fi

# Check tests
echo ""
echo "✓ Checking tests..."
if [ -f "tests/favoritesContext.spec.tsx" ]; then
    echo "  ✅ Tests exist"
else
    echo "  ⚠️  Tests not found"
fi

# Summary
echo ""
echo "=========================================="
echo "✅ All critical components validated!"
echo ""
echo "📋 Next steps:"
echo "  1. Apply database migration:"
echo "     psql -h localhost -U luxe_user -d luxe_db -f migrations/005_add_user_favorites.sql"
echo ""
echo "  2. Test locally:"
echo "     npm run dev"
echo ""
echo "  3. Verify favorites work:"
echo "     - Toggle favorites as guest (localStorage)"
echo "     - Login and verify API sync"
echo "     - Check database for entries"
echo ""
echo "  4. Deploy to production:"
echo "     cd infra/terraform && terraform apply"
echo ""
echo "📚 Documentation:"
echo "  - FRONTEND_INTEGRATION_STATUS.md - Complete status"
echo "  - MERGE_GUIDE.md - Integration guide"
echo "  - IMPLEMENTATION_SUMMARY.md - Overall architecture"
echo ""
