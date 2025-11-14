import React from 'react';
import { CartIcon, SearchIcon, StoreIcon } from './Icons.tsx';

interface HeaderProps {
  onCartClick: () => void;
  cartItemCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCartAnimating: boolean;
}

const Header: React.FC<HeaderProps> = ({ onCartClick, cartItemCount, searchQuery, setSearchQuery, isCartAnimating }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <StoreIcon className="h-8 w-8 text-primary-600" />
            <a href="#" className="text-2xl font-bold text-gray-800 hover:text-primary-600 transition-colors">Luxe</a>
          </div>

          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher des produits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full bg-gray-100 border border-transparent rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
             <button
              onClick={onCartClick}
              className="relative p-2 text-gray-500 hover:text-primary-600 focus:outline-none transition-colors rounded-full hover:bg-primary-50"
              aria-label="Ouvrir le panier"
            >
              <span className="sr-only">Ouvrir le panier</span>
              <CartIcon className={`h-6 w-6 ${isCartAnimating ? 'cart-shake' : ''}`} />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 block h-5 w-5 transform -translate-y-1/2 translate-x-1/2 rounded-full text-xs font-medium bg-primary-600 text-white flex items-center justify-center">
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