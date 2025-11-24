import React, { useEffect, useState } from 'react';
import Header from '../components/Header.tsx';
import ProductList from '../components/ProductList.tsx';
import { useFavorites } from '../context/FavoritesContext.tsx';
import { Product, CartItem } from '../types.ts';
import { getProducts } from '../services/productService.ts';
import Cart from '../components/Cart.tsx';
import PromotionBanner from '../components/PromotionBanner.tsx';
import EmptyState from '../components/EmptyState.tsx';

const Favoris: React.FC = () => {
  const { favorites } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetched = await getProducts();
        setProducts(fetched.filter(p => favorites.includes(p.id)));
      } catch (e) {
        setError("Impossible de charger vos favoris.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [favorites]);

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    setCartItems(prev => {
      if (quantity <= 0) return prev.filter(i => i.product.id !== productId);
      return prev.map(i => i.product.id === productId ? { ...i, quantity } : i);
    });
  };

  const handleRemove = (productId: number) => {
    setCartItems(prev => prev.filter(i => i.product.id !== productId));
  };

  const totalCartItems = cartItems.reduce((t, i) => t + i.quantity, 0);

  return (
    <div className="min-h-screen bg-beige">
      <PromotionBanner />
      <Header
        onCartClick={() => setIsCartOpen(true)}
        cartItemCount={totalCartItems}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isCartAnimating={false}
      />
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemove}
      />
      <main className="container mx-auto max-w-content px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-serif font-semibold mb-6">Mes Favoris</h1>
        {isLoading && <p className="text-slate-600">Chargement...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!isLoading && !error && products.length === 0 && (
          <EmptyState
            title="Vous n'avez pas encore ajouté de favoris."
            actionLabel="Explorer les produits"
            onActionClick={() => (window.location.href = '/')}
          />
        )}
        {!isLoading && products.length > 0 && (
          <ProductList
            products={products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))}
            onProductSelect={() => { /* navigation to detail could be added */ }}
            onAddToCart={handleAddToCart}
          />
        )}
      </main>
    </div>
  );
};

export default Favoris;
