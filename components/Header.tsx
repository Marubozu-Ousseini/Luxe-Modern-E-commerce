import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-30 transition-all duration-300 ${scrolled ? 'bg-white/85 backdrop-blur-md shadow-soft' : 'bg-white/95 backdrop-blur border-b border-borderSoft'}`}>
      <div className="container mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-10 sm:h-12">
          {/* Brand */}
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center gap-2 group">
              {/* Logo */}
              <img
                src="/malafaareh-logo.png"
                alt="Malafaareh"
                className="h-6 w-auto object-contain group-hover:opacity-90"
              />
              {/* Wordmark visible on desktop and mobile */}
              <span className="hidden sm:inline text-charcoal font-serif font-semibold tracking-tight text-sm leading-none">Malafaareh</span>
            </Link>
          </div>

          {/* Primary nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm text-slate hover:text-charcoal">Boutique</Link>
            <Link to="/story" className="text-sm text-slate hover:text-charcoal">Histoire</Link>
            <Link to="/showroom" className="text-sm text-slate hover:text-charcoal">Atelier</Link>
          </nav>

          {/* Search + Utility */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-full md:w-48 lg:w-60 relative">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-4 w-4 text-slate" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher des produits"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full bg-bone text-charcoal border border-borderSoft rounded-md py-1.5 pl-9 pr-3 text-sm placeholder:textMuted focus:outline-none focus:bg-white focus:border-sand focus:ring-1 focus:ring-sand transition"
                />
                {/* Suggestions dropdown (basic client-side stub) */}
                {searchQuery && (
                  <ul role="listbox" className="absolute z-50 left-0 right-0 mt-1 bg-white border border-borderSoft rounded-md shadow-md text-sm">
                    {['manteau','laine','pull','écharpe','chaussures'].filter(s=>s.includes(searchQuery.toLowerCase())).slice(0,5).map(s=> (
                      <li key={s} onMouseDown={()=> setSearchQuery(s)} className="px-3 py-2 hover:bg-bone cursor-pointer">{s}</li>
                    ))}
                    {(['manteau','laine','pull','écharpe','chaussures'].filter(s=>s.includes(searchQuery.toLowerCase())).length===0) && (
                      <li className="px-3 py-2 text-slate-500">Aucun résultat suggéré</li>
                    )}
                  </ul>
                )}
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-2">
              <Link to="/favoris" className="relative p-2.5 sm:p-1.5 rounded-full text-slate hover:bg-bone" aria-label="Produits favoris">
                <HeartIconOutline className="h-6 w-6 sm:h-5 sm:w-5" />
                {favorites.length > 0 && (
                  <span className="absolute top-0 right-0 block h-4 w-4 transform -translate-y-1/2 translate-x-1/2 rounded-full text-[10px] font-medium bg-charcoal text-white flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </Link>
              <Link to="/orders" className="p-2.5 sm:p-1.5 rounded-full text-slate hover:bg-bone" aria-label="Mes commandes">
                <OrdersIconOutline className="h-6 w-6 sm:h-5 sm:w-5" />
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-sm text-slate hover:text-charcoal">Admin</Link>
              )}
            </nav>
            {user ? (
              <button onClick={logout} className="p-2.5 sm:p-1.5 rounded-full text-slate hover:bg-bone touch-manipulation" aria-label="Se déconnecter">
                <CloseIcon className="h-5 w-5" />
              </button>
            ) : (
              <Link to="/login" className="flex items-center gap-2 px-3 py-1.5 sm:px-2 sm:py-1 rounded-full text-slate hover:bg-bone touch-manipulation" aria-label="Se connecter">
                <UserIconOutline className="h-6 w-6 sm:h-5 sm:w-5" />
                <span className="text-sm">Se connecter</span>
              </Link>
            )}
            <button
              onClick={onCartClick}
              className="relative p-2.5 sm:p-1.5 text-slate focus:outline-none transition-colors rounded-full hover:bg-bone touch-manipulation"
              aria-label="Ouvrir le panier"
            >
              <span className="sr-only">Ouvrir le panier</span>
              <CartIcon className={`h-6 w-6 sm:h-5 sm:w-5 ${isCartAnimating ? 'cart-shake' : ''}`} />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 block h-4 w-4 transform -translate-y-1/2 translate-x-1/2 rounded-full text-[10px] font-medium bg-charcoal text-white flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>

    {/* Mobile bottom nav - one-thumb reach */}
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-borderSoft safe-bottom-nav">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <Link to="/" aria-label="Boutique" className="flex flex-col items-center text-xs text-slate">
          <StoreIcon className="h-5 w-5" />
          <span>Boutique</span>
        </Link>
        <button onClick={() => { const el = document.querySelector('input[placeholder="Rechercher des produits"]') as HTMLInputElement; if (el) { el.focus(); } }} aria-label="Rechercher" className="flex flex-col items-center text-xs text-slate">
          <SearchIcon className="h-5 w-5" />
          <span>Rechercher</span>
        </button>
        <Link to="/favoris" aria-label="Favoris" className="flex flex-col items-center text-xs text-slate">
          <HeartIconOutline className="h-5 w-5" />
          <span>Favoris</span>
        </Link>
        <button onClick={onCartClick} aria-label="Panier" className="flex flex-col items-center text-xs text-slate relative">
          <CartIcon className="h-5 w-5" />
          {cartItemCount > 0 && <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 w-4 rounded-full bg-charcoal text-white text-[10px]">{cartItemCount}</span>}
          <span>Panier</span>
        </button>
        <Link to="/login" aria-label="Compte" className="flex flex-col items-center text-xs text-slate">
          <UserIconOutline className="h-5 w-5" />
          <span>Compte</span>
        </Link>
      </div>
    </nav>
  );
};

export default Header;