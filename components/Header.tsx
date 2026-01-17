import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { track } from '../services/analytics';
import { CartIcon, SearchIcon, StoreIcon, UserIconOutline, OrdersIconOutline, HeartIconOutline, CloseIcon } from './Icons.tsx';
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
  const location = useLocation();

  // Consider the header as "over-hero" when on the homepage or showroom route and not scrolled
  const isOverHero = !scrolled && (location.pathname === '/' || location.pathname.startsWith('/showroom') || location.pathname.startsWith('/galeries'));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <React.Fragment>
    <header className="bg-[#082a6a] text-white sticky top-0 z-30">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/malafaareh-logo.png" alt="Malafaareh" className="h-8 w-auto" />
          <span className="font-serif font-semibold text-lg">Malafaareh</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-sm hover:underline">Shop</Link>
          <Link to="/atelier" className="text-sm hover:underline">Atelier</Link>
        </nav>

        {/* Utility Icons */}
        <div className="flex items-center gap-4">
          <SearchIcon className="h-6 w-6" />
          <Link to="/favoris" className="relative" aria-label="Favoris">
            <HeartIconOutline className="h-6 w-6" />
            {favorites.length > 0 && (
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] leading-5 text-center">
                {favorites.length}
              </span>
            )}
          </Link>
          <UserIconOutline className="h-6 w-6" />
          <CartIcon className="h-6 w-6" />
        </div>
      </div>
    </header>
    </React.Fragment>
  );
};

export default Header;