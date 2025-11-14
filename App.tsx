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
    return ['Tous', ...Array.from(new Set(allCategories))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(product => selectedCategory === 'Tous' || product.category === selectedCategory)
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
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
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
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedProduct ? (
          <ProductDetail
            product={selectedProduct}
            onAddToCart={handleAddToCart}
            onBack={handleBackToList}
          />
        ) : (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Découvrez notre collection</h1>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-500">
                Parcourez notre sélection de produits de haute qualité.
              </p>
            </div>
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            {renderContent()}
          </>
        )}
      </main>
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Luxe Modern E-commerce. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;