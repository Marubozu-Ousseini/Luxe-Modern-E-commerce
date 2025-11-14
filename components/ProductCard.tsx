import React from 'react';
import { Product } from '../types.ts';
import { CartIcon, StarIcon } from './Icons.tsx';
import { formatCurrency } from '/utils/formatter.ts';

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
      className="bg-white rounded-lg shadow-md overflow-hidden group cursor-pointer transform hover:-translate-y-2 transition-all duration-300 hover:shadow-xl flex flex-col"
    >
      <div className="relative pt-[100%] overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>
      <div className="p-4 sm:p-6 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-800 truncate group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1">{product.category}</p>
        <div className="flex items-center mt-2">
            <StarIcon className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-600 ml-1">{product.rating.rate}</span>
            <span className="text-sm text-gray-400 ml-1.5">({product.rating.count} avis)</span>
        </div>
        <div className="mt-4 flex-grow"></div>
        <div className="flex items-center justify-between mt-4">
          <p className="text-xl font-bold text-gray-900">{formatCurrency(product.price)}</p>
          <button
            onClick={handleAddToCartClick}
            className="flex items-center justify-center bg-primary-600 text-white rounded-full h-10 w-10 transform translate-x-12 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
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