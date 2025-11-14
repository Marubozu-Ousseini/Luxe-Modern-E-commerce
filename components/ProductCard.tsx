import React from 'react';
import { Product } from '../types.ts';
import { CartIcon, StarIcon } from './Icons.tsx';
import { formatCurrency } from '../src/utils/formatter.ts';

interface ProductCardProps {
  product: Product;
  onSelect: () => void;
  onAddToCart: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect, onAddToCart }) => {
  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart();
  };

  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-lg shadow-soft overflow-hidden group cursor-pointer transition-all duration-200 ease-premium hover:-translate-y-1 hover:shadow-xl flex flex-col"
    >
      <div className="relative pt-[125%] overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-premium group-hover:scale-[1.04]"
        />
        {product.limitedAvailability && (
          <span className="absolute top-3 left-3 z-10 inline-block text-[11px] px-2 py-1 rounded-full bg-white/85 backdrop-blur border border-gray-200 text-slate-700">
            Disponibilité limitée
          </span>
        )}
  {/* Quick Details overlay */}
        <div className="absolute inset-x-0 bottom-0 translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 ease-premium">
          <div className="mx-4 mb-4 rounded-md bg-white/85 backdrop-blur px-3 py-2 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span className="truncate">{product.category}</span>
              <span className="font-medium">{formatCurrency(product.price)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-serif font-semibold tracking-tight text-charcoal truncate group-hover:text-accent transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-taupe mt-1">{product.category}</p>
    <div className="flex items-center mt-2 text-slate-600">
      <StarIcon className="w-4 h-4 text-canary glossy-star" />
            <span className="text-sm ml-1">{product.rating.rate}</span>
            <span className="text-sm text-slate-400 ml-1.5">({product.rating.count})</span>
        </div>
        <div className="mt-4 flex-grow" />
        <div className="flex items-center justify-between mt-4">
          <div className="flex flex-col">
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm line-through text-slate-400">{formatCurrency(product.originalPrice)}</span>
            )}
            <p className="text-xl font-semibold text-gold">{formatCurrency(product.price)}</p>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="mt-1 inline-block text-[11px] px-2 py-0.5 rounded-full bg-gold/15 text-gold font-medium">Prix spécial</span>
            )}
          </div>
          <button
            onClick={handleAddToCartClick}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-accent text-white opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-premium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
            aria-label="Ajouter au panier"
          >
            <CartIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;