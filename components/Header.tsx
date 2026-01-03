import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CartIcon, SearchIcon, StoreIcon, UserIcon, OrdersIcon, HeartIcon, CloseIcon } from './Icons.tsx';
import { useFavorites } from '../context/FavoritesContext.tsx';

interface HeaderProps {
  onCartClick: () => void;
  cartItemCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCartAnimating: boolean;
}

const Header: React.FC<HeaderProps> = ({ onCartClick, cartItemCount, searchQuery, setSearchQuery, isCartAnimating }) => {
  const { user, logout } = useAuth();
  const { favorites } = useFavorites();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-30 transition-all duration-300 ${scrolled ? 'bg-[#87CEEB]/60 backdrop-blur-lg' : 'bg-[#0A3D62]/95 backdrop-blur'}`}>
      <div className="container mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center gap-2 group">
              {/* Logo */}
              <img
                src="/malafaareh-logo.png"
                alt="Malafaareh"
                className="h-8 w-auto object-contain drop-shadow-sm group-hover:opacity-90"
              />
              {/* Wordmark visible on desktop and mobile */}
              <span className="text-white font-serif font-semibold tracking-tight text-base sm:text-lg leading-none">Malafaareh</span>
            </Link>
          </div>

          {/* Primary nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm text-white/90 hover:text-white">Shop</Link>
          </nav>

          {/* Search + Utility */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden md:block w-56 lg:w-64">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-white/70" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher des produits"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full bg-white/10 text-white border border-white/20 rounded-md py-2 pl-10 pr-3 text-sm placeholder-white/70 focus:outline-none focus:bg-white/15 focus:border-white/40 focus:ring-1 focus:ring-white/40 transition"
                />
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-2">
              <Link to="/favoris" className="relative p-2 rounded-full text-white/90 hover:bg-white/10" aria-label="Produits favoris">
                <HeartIcon className="h-6 w-6" />
                {favorites.length > 0 && (
                  <span className="absolute top-0 right-0 block h-5 w-5 transform -translate-y-1/2 translate-x-1/2 rounded-full text-xs font-medium bg-white text-[#0A3D62] flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </Link>
              <Link to="/orders" className="p-2 rounded-full text-white/90 hover:bg-white/10" aria-label="Mes commandes">
                <OrdersIcon className="h-6 w-6" />
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-sm text-white/90 hover:text-white">Admin</Link>
              )}
            </nav>
            {user ? (
              <button onClick={logout} className="p-2 rounded-full text-white/90 hover:bg-white/10 touch-manipulation" aria-label="Se déconnecter">
                <CloseIcon className="h-6 w-6" />
              </button>
            ) : (
              <Link to="/login" className="p-2 rounded-full text-white/90 hover:bg-white/10 touch-manipulation" aria-label="Se connecter">
                <UserIcon className="h-6 w-6" />
              </Link>
            )}
            <button
              onClick={onCartClick}
              className="relative p-2 text-white/90 focus:outline-none transition-colors rounded-full hover:bg-white/10 touch-manipulation"
              aria-label="Ouvrir le panier"
            >
              <span className="sr-only">Ouvrir le panier</span>
              <CartIcon className={`h-6 w-6 ${isCartAnimating ? 'cart-shake' : ''}`} />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 block h-5 w-5 transform -translate-y-1/2 translate-x-1/2 rounded-full text-xs font-medium bg-white text-[#0A3D62] flex items-center justify-center">
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