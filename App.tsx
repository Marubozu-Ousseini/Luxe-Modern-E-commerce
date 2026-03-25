import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './src/animations.css';
import { usePromotions } from './context/PromotionsContext.tsx';
import { Product, CartItem } from './types.ts';
import { getProducts } from './services/productService.ts';
import Header from './components/Header.tsx';
import ProductList from './components/ProductList.tsx';
import CategoryFilter from './components/CategoryFilter.tsx';
import { translate } from './src/utils/i18n.ts';
import FilterBar, { FilterState } from './components/FilterBar.tsx';
import { track } from './services/analytics.ts';
import Cart from './components/Cart.tsx';
import ProductDetail from './components/ProductDetail.tsx';
import { usePageBackground } from './context/PromotionsContext.tsx';
import PromoRibbon from './components/PromoRibbon.tsx';
import AdBanner from './components/AdBanner.tsx';
import MaterialsBand from './components/MaterialsBand.tsx';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // Default to "Tous" which our filter logic treats as "show all"
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const [sortOrder, setSortOrder] = useState<'Curated'|'Newest'|'Price'>('Curated');
  const [filters, setFilters] = useState<FilterState>({ materials: [], colors: [], sizes: [], fit: [] });
  // Dynamic home background from promotions + fallback chain
  const { src: homeHeroSrc, alt: homeHeroAlt } = usePageBackground('home');

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

  // Persist cart in localStorage for checkout page
  useEffect(()=>{
    try {
      localStorage.setItem('cart.items', JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
    const items = unique.map(c => ({ value: c, label: translate('category', c) }));
    return [{ value: 'Tous', label: 'Tous' }, ...items];
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
    }
    counts['Tous'] = products.length;
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products
      .filter(product => selectedCategory === 'Tous' || product.category === selectedCategory)
      .filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    // Apply pills filters when present
    if (filters.materials.length) list = list.filter(p => (p.materials||[]).some(m=>filters.materials.includes(m)));
    if (filters.colors.length) list = list.filter(p => (p.colors||[]).some(c=>filters.colors.includes(c)));
    if (filters.sizes.length) list = list.filter(p => (p.sizes||[]).some(s=>filters.sizes.includes(s)));
    if (filters.fit.length) list = list.filter(p => p.fit && filters.fit.includes(p.fit));
    // Sort order
    if (sortOrder === 'Curated') list = list.sort((a,b)=> (b.rating.count||0) - (a.rating.count||0));
    if (sortOrder === 'Newest') list = list; // placeholder; backend could include createdAt
    if (sortOrder === 'Price') list = list.sort((a,b)=> a.price - b.price);
    return list;
  }, [products, selectedCategory, searchQuery, filters, sortOrder]);

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
  <div className="min-h-screen bg-porcelain font-sans text-charcoal">
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
            suggestions={products.filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id).sort((a,b)=> (b.rating.count||0)-(a.rating.count||0)).slice(0,3)}
            onSelectProduct={(p)=> setSelectedProduct(p)}
          />
        ) : (
          <>
            {/* Hero: full-bleed with moderated height and subtle overlay */}
            <section className="relative mb-8 overflow-hidden">
              <div className="relative h-[44vh] min-h-[320px] w-full">
                <img
                  src={homeHeroSrc || 'https://images.pexels.com/photos/1129413/pexels-photo-1129413.jpeg?auto=compress&cs=tinysrgb&w=1600&q=60'}
                  alt={homeHeroAlt || 'Image éditoriale saisonnière en arrière‑plan'}
                  className="absolute inset-0 w-full h-full object-cover object-center md:object-top"
                />
                {/* Overlay to keep a clean porcelain backdrop regardless of image */}
                <div className="absolute inset-0 bg-porcelain" aria-hidden="true" />
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
                  <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-charcoal">La Sélection Saisonnière</h1>
                  {/* Subtitle removed per request */}
                  <div className="mt-8 flex gap-4">
                    <a
                      href="#catalogue"
                      className="btn-primary font-medium px-5 py-3"
                      aria-label="Explorer la collection"
                    >Explorer la collection</a>
                    <Link
                      to="/story"
                      className="btn-secondary font-medium px-5 py-3 backdrop-blur-sm"
                      aria-label="Entrer dans l’Atelier"
                    >
                      Entrer dans l’Atelier
                    </Link>
                  </div>
                </div>
              </div>
            </section>
            <PromoRibbon />
            <AdBanner />
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              categoryCounts={categoryCounts}
            />
            {/* PLP pill filters + sort */}
            <div className="flex items-center justify-between mb-4">
              <FilterBar products={products} value={filters} onChange={(next)=>{ setFilters(next); track({ type: 'plp_filter_used', payload: { materials: next.materials.length, colors: next.colors.length, sizes: next.sizes.length, fit: next.fit.length } }); }} />
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-700">Tri</label>
                <select value={sortOrder} onChange={e=>{ const v = e.target.value as any; setSortOrder(v); track({ type: 'plp_sort_changed', payload: { sort: v } }); }} className="border border-sand rounded-soft px-2 py-1 text-sm bg-white">
                  <option value="Curated">Sélection</option>
                  <option value="Newest">Nouveautés</option>
                  <option value="Price">Prix</option>
                </select>
              </div>
            </div>
            {/* Guided pathways per homepage strategy */}
            <section className="mt-6 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link to="/showroom" className="group relative overflow-hidden rounded-lg bg-white shadow-soft border border-sand px-6 py-5 flex items-center justify-between hover:border-taupe/40">
                  <h3 className="text-2xl md:text-3xl font-serif text-charcoal group-hover:text-slate transition-colors">Showroom</h3>
                  <span className="text-sm text-charcoal/80 group-hover:text-charcoal transition-colors bg-bone px-3 py-1 rounded-md">Découvrir</span>
                </Link>
                <Link to="/galeries" className="group relative overflow-hidden rounded-lg bg-white shadow-soft border border-sand px-6 py-5 flex items-center justify-between hover:border-taupe/40">
                  <h3 className="text-2xl md:text-3xl font-serif text-charcoal group-hover:text-slate transition-colors">Galeries</h3>
                  <span className="text-sm text-charcoal/80 group-hover:text-charcoal transition-colors bg-bone px-3 py-1 rounded-md">Explorer</span>
                </Link>
              </div>
            </section>
            {/* Editorial: Our Materials */}
            <MaterialsBand />
            <div id="catalogue">{renderContent()}</div>
          </>
        )}
      </main>
      <footer className="bg-sand mt-12">
        <div className="container mx-auto max-w-content px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-charcoal">
            <div>
              <h4 className="font-semibold mb-2">Boutique</h4>
              <ul className="space-y-2 text-charcoal/80">
                <li><a className="hover:text-charcoal" href="#">Nouveautés</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Histoire</h4>
              <ul className="space-y-2 text-charcoal/80">
                <li><a className="hover:text-charcoal" href="#">Notre vision</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Réseaux sociaux</h4>
              <div className="flex items-center gap-3">
                <a href="https://www.instagram.com/malafaareh?igsh=MTZldzBwcDJ2MXU3Ng%3D%3D&utm_source=qr" target="_blank" rel="noreferrer" aria-label="Instagram" className="p-2 rounded bg-white/70 hover:bg-white shadow-soft hover:shadow-lg transition">
                  <img src="/icons/instagram.svg" alt="Instagram" className="h-5 w-5" />
                </a>
                <a href="https://www.tiktok.com/@malafaareh1?_r=1&_t=ZS-93qzXpICXgu" target="_blank" rel="noreferrer" aria-label="TikTok" className="p-2 rounded bg-white/70 hover:bg-white shadow-soft hover:shadow-lg transition">
                  <img src="/icons/tiktok.svg" alt="TikTok" className="h-5 w-5" />
                </a>
                <a href="https://www.facebook.com/share/18Tpqop2U8/?mibextid=wwXIfr" target="_blank" rel="noreferrer" aria-label="Facebook" className="p-2 rounded bg-white/70 hover:bg-white shadow-soft hover:shadow-lg transition">
                  <img src="/icons/facebook.svg" alt="Facebook" className="h-5 w-5" />
                </a>
                <a href="https://wa.me/237652003536" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="p-2 rounded bg-white/70 hover:bg-white shadow-soft hover:shadow-lg transition">
                  <img src="/icons/whatsapp.svg" alt="WhatsApp" className="h-5 w-5" />
                </a>
                <a href="https://snapchat.com/t/4uyMYDes" target="_blank" rel="noreferrer" aria-label="Snapchat" className="p-2 rounded bg-white/70 hover:bg-white shadow-soft hover:shadow-lg transition">
                  <img src="/icons/snapchat.svg" alt="Snapchat" className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-borderSoft pt-6">
            <form className="flex flex-col sm:flex-row items-center gap-3">
              <label htmlFor="newsletter" className="text-sm text-charcoal/80">Rejoindre le Cercle</label>
              <input id="newsletter" type="email" placeholder="Votre e-mail" className="flex-1 min-w-0 bg-white border border-borderSoft rounded-soft px-3 py-2 text-sm placeholder:textMuted focus:outline-none focus:ring-1 focus:ring-sand" />
              <button type="submit" className="btn-secondary text-sm">S’inscrire</button>
            </form>
          </div>
          <div className="mt-8 text-center text-charcoal/70">
            <p>&copy; {new Date().getFullYear()} Marubozu Sensei. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;