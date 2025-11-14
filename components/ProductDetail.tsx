import React, { useState } from 'react';
import { Product } from '../types.ts';
import { BackArrowIcon, StarIcon } from './Icons.tsx';
import { formatCurrency } from '../src/utils/formatter.ts';

interface ProductDetailProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  onBack: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onAddToCart, onBack }) => {
  const [quantity, setQuantity] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [openSection, setOpenSection] = useState<'details' | 'materials' | 'shipping' | null>('details');

  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };
  
  const handleAddToCartClick = () => {
    onAddToCart(product, quantity);
  };

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="flex items-center text-sm font-medium text-slate-600 hover:text-accent mb-8 transition-colors">
        <BackArrowIcon className="w-5 h-5 mr-2" />
        Retour aux produits
      </button>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
        <div className="bg-white p-4 rounded-lg shadow-soft flex items-center justify-center">
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
          <span className="text-sm font-medium text-accent uppercase tracking-[0.08em]">{product.category}</span>
          <h1 className="text-3xl lg:text-4xl font-serif font-semibold text-charcoal mt-2 tracking-tight">{product.name}</h1>
          
          <div className="flex items-center mt-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className={`w-5 h-5 ${i < Math.round(product.rating.rate) ? 'text-canary glossy-star' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="text-gray-600 ml-3 text-sm">({product.rating.count} avis)</span>
          </div>

          <div className="mt-6">
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="block text-base line-through text-slate-400">{formatCurrency(product.originalPrice)}</span>
            )}
            <p className="text-3xl font-semibold text-gold">{formatCurrency(product.price)}</p>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="mt-2 inline-block text-xs px-2 py-1 rounded-full bg-gold/15 text-gold font-medium tracking-wide">Prix spécial</span>
            )}
          </div>

          <p className="mt-6 text-slate-700 leading-relaxed">{product.description}</p>

          {/* Accordions */}
          <div className="mt-8 divide-y divide-gray-200 border-t border-b">
            <button
              className="w-full flex items-center justify-between py-4 text-left"
              onClick={() => setOpenSection(openSection === 'details' ? null : 'details')}
              aria-expanded={openSection === 'details'}
            >
              <span className="font-medium">Détails</span>
              <span className={`transform transition-transform duration-200 ease-premium ${openSection === 'details' ? 'rotate-180' : ''}`}>⌄</span>
            </button>
            {openSection === 'details' && (
              <div className="py-3 text-slate-700">
                <p>Conçu avec soin. Coupe équilibrée et finitions discrètes pour un porté quotidien.</p>
              </div>
            )}

            <button
              className="w-full flex items-center justify-between py-4 text-left"
              onClick={() => setOpenSection(openSection === 'materials' ? null : 'materials')}
              aria-expanded={openSection === 'materials'}
            >
              <span className="font-medium">Matières & Entretien</span>
              <span className={`transform transition-transform duration-200 ease-premium ${openSection === 'materials' ? 'rotate-180' : ''}`}>⌄</span>
            </button>
            {openSection === 'materials' && (
              <div className="py-3 text-slate-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Matières premium, sélectionnées pour la durabilité.</li>
                  <li>Nettoyage délicat recommandé.</li>
                </ul>
              </div>
            )}

            <button
              className="w-full flex items-center justify-between py-4 text-left"
              onClick={() => setOpenSection(openSection === 'shipping' ? null : 'shipping')}
              aria-expanded={openSection === 'shipping'}
            >
              <span className="font-medium">Livraison & Retours</span>
              <span className={`transform transition-transform duration-200 ease-premium ${openSection === 'shipping' ? 'rotate-180' : ''}`}>⌄</span>
            </button>
            {openSection === 'shipping' && (
              <div className="py-3 text-slate-700">
                <p>Expédition sous 2–4 jours ouvrés. Retours offerts sous 14 jours.</p>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center space-x-4">
            <div className="flex items-center rounded-md border border-gray-300">
              <button onClick={() => handleQuantityChange(-1)} className="px-4 py-2 text-gray-500 hover:text-gray-800 rounded-l-md transition" aria-label="Réduire la quantité">-</button>
              <span className="px-5 py-2 font-semibold tabular-nums">{quantity}</span>
              <button onClick={() => handleQuantityChange(1)} className="px-4 py-2 text-gray-500 hover:text-gray-800 rounded-r-md transition" aria-label="Augmenter la quantité">+</button>
            </div>
            <button onClick={handleAddToCartClick} className="flex-1 btn-primary shimmer font-medium py-3 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2">
              Make it Yours
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-600">Paiement sécurisé. Emballage offert.</p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;