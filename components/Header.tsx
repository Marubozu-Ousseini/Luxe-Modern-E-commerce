import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CartIcon, SearchIcon, StoreIcon, UserIcon, OrdersIcon, HeartIcon } from './Icons.tsx';

interface HeaderProps {
  onCartClick: () => void;
  cartItemCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCartAnimating: boolean;
}

const Header: React.FC<HeaderProps> = ({ onCartClick, cartItemCount, searchQuery, setSearchQuery, isCartAnimating }) => {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-30 shadow-sm transition-colors duration-200 ${scrolled ? 'bg-header/80 backdrop-blur-md' : 'bg-header'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <StoreIcon className="h-8 w-8 text-white" />
            <Link to="/" className="text-2xl font-bold text-white hover:text-royal transition-colors font-serif tracking-tight">MALAFAAREH</Link>
          </div>

          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-white/70" />
              </div>
              <input
                type="text"
                placeholder="Rechercher des produits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full bg-white/10 text-white border border-white/10 rounded-md py-2 pl-10 pr-3 text-sm placeholder-white/70 focus:outline-none focus:bg-white/20 focus:border-white/40 focus:ring-1 focus:ring-white/40 transition"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex items-center space-x-3">
              {/* Favorites icon */}
              <button className="p-2 rounded-full text-white/90 hover:text-white hover:bg-white/10" aria-label="Favoris">
                <HeartIcon className="h-6 w-6" />
              </button>
              {/* Orders icon */}
              <Link to="/orders" className="p-2 rounded-full text-white/90 hover:text-white hover:bg-white/10" aria-label="Mes commandes">
                <OrdersIcon className="h-6 w-6" />
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-white/90 hover:text-white">Admin</Link>
              )}
            </nav>
            {user ? (
              <button onClick={logout} className="p-2 rounded-full text-white/90 hover:text-white hover:bg-white/10" aria-label="Se déconnecter">
                <CloseIcon className="h-6 w-6" />
              </button>
            ) : (
              <Link to="/login" className="p-2 rounded-full text-white/90 hover:text-white hover:bg-white/10" aria-label="Se connecter">
                <UserIcon className="h-6 w-6" />
              </Link>
            )}
             <button
              onClick={onCartClick}
              className="relative p-2 text-white/90 hover:text-white focus:outline-none transition-colors rounded-full hover:bg-white/10"
              aria-label="Ouvrir le panier"
            >
              <span className="sr-only">Ouvrir le panier</span>
              <CartIcon className={`h-6 w-6 ${isCartAnimating ? 'cart-shake' : ''}`} />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 block h-5 w-5 transform -translate-y-1/2 translate-x-1/2 rounded-full text-xs font-medium bg-royal text-white flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;