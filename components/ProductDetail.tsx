import React, { useState } from 'react';
import { Product } from '../types.ts';
import { BackArrowIcon, StarIcon } from './Icons.tsx';
import { formatCurrency } from '/utils/formatter.ts';

interface ProductDetailProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  onBack: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onAddToCart, onBack }) => {
  const [quantity, setQuantity] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };
  
  const handleAddToCartClick = () => {
    onAddToCart(product, quantity);
  };

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-600 hover:text-primary-600 mb-8 transition-colors">
        <BackArrowIcon className="w-5 h-5 mr-2" />
        Retour aux produits
      </button>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
        <div className="bg-white p-4 rounded-lg shadow-lg flex items-center justify-center">
            <div className={`w-full h-full aspect-square transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
                <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain rounded-md"
                    onLoad={() => setImageLoaded(true)}
                />
            </div>
             {!imageLoaded && (
                <div className="w-full aspect-square bg-gray-200 rounded-md animate-pulse"></div>
            )}
        </div>

        <div>
          <span className="text-sm font-semibold text-primary-600 uppercase tracking-wider">{product.category}</span>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mt-2">{product.name}</h1>
          
          <div className="flex items-center mt-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className={`w-5 h-5 ${i < Math.round(product.rating.rate) ? 'text-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="text-gray-600 ml-3 text-sm">({product.rating.count} avis)</span>
          </div>

          <p className="text-3xl font-bold text-gray-900 mt-6">{formatCurrency(product.price)}</p>

          <p className="mt-6 text-gray-600 leading-relaxed">{product.description}</p>

          <div className="mt-8 flex items-center space-x-4">
            <div className="flex items-center rounded-md border border-gray-300">
              <button onClick={() => handleQuantityChange(-1)} className="px-4 py-2 text-gray-500 hover:text-gray-800 rounded-l-md transition" aria-label="Réduire la quantité">-</button>
              <span className="px-5 py-2 font-semibold tabular-nums">{quantity}</span>
              <button onClick={() => handleQuantityChange(1)} className="px-4 py-2 text-gray-500 hover:text-gray-800 rounded-r-md transition" aria-label="Augmenter la quantité">+</button>
            </div>
            <button onClick={handleAddToCartClick} className="flex-1 bg-primary-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-primary-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
              Ajouter au panier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;