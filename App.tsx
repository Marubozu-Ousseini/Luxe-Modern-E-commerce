import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, CartItem } from './types.ts';
import { getProducts } from './services/productService.ts';
import Header from './components/Header.tsx';
import ProductList from './components/ProductList.tsx';
import CategoryFilter from './components/CategoryFilter.tsx';
import Cart from './components/Cart.tsx';
import ProductDetail from './components/ProductDetail.tsx';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  // Hero image fallback chain: local files first, then a remote default
  const heroSources = [
    '/hero.jpg',
    '/hero.png',
    '/hero.webp',
    'https://images.unsplash.com/photo-1518551499312-89526d76c1a4?q=80&w=1600&auto=format&fit=crop'
  ];
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
      } catch (err) {
        setError("Impossible de charger les produits. Veuillez réessayer plus tard.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const allCategories = products.map(p => p.category);
    return ['Nouveautés', ...Array.from(new Set(allCategories))];
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    counts['Nouveautés'] = products.length;
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(product => selectedCategory === 'Nouveautés' || product.category === selectedCategory)
      .filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [products, selectedCategory, searchQuery]);

  const handleAddToCart = useCallback((product: Product, quantity: number = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { product, quantity }];
    });
    
    if (!isCartAnimating) {
      setIsCartAnimating(true);
      setTimeout(() => setIsCartAnimating(false), 600); // Durée de l'animation
    }
  }, [isCartAnimating]);

  const handleUpdateQuantity = useCallback((productId: number, quantity: number) => {
    setCartItems(prevItems => {
      if (quantity <= 0) {
        return prevItems.filter(item => item.product.id !== productId);
      }
      return prevItems.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    });
  }, []);

  const handleRemoveFromCart = useCallback((productId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  }, []);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleBackToList = () => {
    setSelectedProduct(null);
  };

  const totalCartItems = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="w-full h-64 bg-gray-200"></div>
              <div className="p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-16 text-red-500">
          <h2 className="text-2xl font-semibold">{error}</h2>
        </div>
      );
    }

    return <ProductList products={filteredProducts} onProductSelect={handleProductSelect} onAddToCart={handleAddToCart} />;
  }

  return (
  <div className="min-h-screen bg-beige font-sans text-charcoal">
      <Header
        onCartClick={() => setIsCartOpen(true)}
        cartItemCount={totalCartItems}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isCartAnimating={isCartAnimating}
      />
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveFromCart}
      />
      <main className={`container mx-auto max-w-content px-4 sm:px-6 lg:px-8 ${selectedProduct ? 'py-10' : 'pt-0 pb-10'}`}>
        {selectedProduct ? (
          <ProductDetail
            product={selectedProduct}
            onAddToCart={handleAddToCart}
            onBack={handleBackToList}
          />
        ) : (
          <>
            {/* Hero: full-screen width and height (minus header) */}
            <section className="relative -mx-[50vw] left-1/2 right-1/2 w-screen mb-8 overflow-hidden">
              <div className="relative h-[calc(100vh-4rem)] min-h-[calc(100vh-4rem)] w-full">
                <img
                  src={heroSources[heroIndex]}
                  alt="Hero"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={() => setHeroIndex(i => Math.min(i + 1, heroSources.length - 1))}
                />
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
                  <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-white">L'Édition Saisonnière</h1>
                  {/* Subtitle removed per request */}
                  <div className="mt-8 flex gap-4">
                    <a href="#catalogue" className="btn-primary shimmer font-medium">Explorer</a>
                    <a href="/story" className="px-5 py-3 rounded-md border border-white/80 text-white hover:bg-white/10 transition">En savoir plus</a>
                  </div>
                </div>
              </div>
            </section>
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              categoryCounts={categoryCounts}
            />
            {/* Secondary feature links below categories */}
            <section className="mt-6 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a href="/showroom" className="group relative overflow-hidden rounded-lg bg-white shadow-soft border border-bone/60 px-6 py-5 flex items-center justify-between">
                  <h3 className="text-2xl md:text-3xl font-serif text-charcoal group-hover:text-royal transition-colors">Showroom</h3>
                  <span className="text-sm text-slate group-hover:text-royal/80 transition-colors">Découvrir</span>
                </a>
                <a href="/galeries" className="group relative overflow-hidden rounded-lg bg-white shadow-soft border border-bone/60 px-6 py-5 flex items-center justify-between">
                  <h3 className="text-2xl md:text-3xl font-serif text-charcoal group-hover:text-royal transition-colors">Galeries</h3>
                  <span className="text-sm text-slate group-hover:text-royal/80 transition-colors">Explorer</span>
                </a>
              </div>
            </section>
            <div id="catalogue">{renderContent()}</div>
          </>
        )}
      </main>
      <footer className="bg-header mt-12">
        <div className="container mx-auto max-w-content px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm text-white">
            <div>
              <h4 className="font-semibold mb-3">Boutique</h4>
              <ul className="space-y-2 text-white/80">
                <li><a className="hover:text-white" href="#">Nouveautés</a></li>
                <li><a className="hover:text-white" href="#">Essentiels</a></li>
                <li><a className="hover:text-white" href="#">Éditions</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Histoire</h4>
              <ul className="space-y-2 text-white/80">
                <li><a className="hover:text-white" href="#">Notre vision</a></li>
                <li><a className="hover:text-white" href="#">Atelier</a></li>
                <li><a className="hover:text-white" href="#">Matières</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Service Client</h4>
              <ul className="space-y-2 text-white/80">
                <li><a className="hover:text-white" href="#">Livraison & Retours</a></li>
                <li><a className="hover:text-white" href="#">Contact</a></li>
                <li><a className="hover:text-white" href="#">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Journal</h4>
              <p className="text-white/80 mb-3">Rejoindre le Cercle</p>
              <form className="flex items-center gap-2">
                <input type="email" placeholder="Votre email" className="flex-1 bg-white/10 text-white rounded-md px-3 py-2 text-sm placeholder-white/70 focus:bg-white/20 focus:border-white/40 focus:ring-1 focus:ring-white/40 border border-white/10" />
                <button type="button" className="btn-primary px-4 py-2">S'inscrire</button>
              </form>
            </div>
          </div>
          <div className="mt-10 text-center text-white/70">
            <p>&copy; {new Date().getFullYear()} Marubozu Sensei. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;