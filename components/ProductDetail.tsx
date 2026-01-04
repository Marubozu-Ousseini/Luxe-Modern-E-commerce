import React, { useEffect, useState } from 'react';
import { Product } from '../types.ts';
import { BackArrowIcon, StarIcon, HeartIcon } from './Icons.tsx';
import { useFavorites } from '../context/FavoritesContext.tsx';
import { formatCurrency } from '../src/utils/formatter.ts';
import { track } from '../services/analytics.ts';
import { translate } from '../src/utils/i18n.ts';
import Testimonials from './Testimonials.tsx';
import CompleteLook from './CompleteLook.tsx';

interface ProductDetailProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  onBack: () => void;
  suggestions?: Product[];
  onSelectProduct?: (p: Product) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onAddToCart, onBack, suggestions = [], onSelectProduct }) => {
  const [quantity, setQuantity] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const gallery = product.images && product.images.length > 0 ? product.images : [product.imageUrl];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  useEffect(()=>{
    const t0 = Date.now();
    return ()=>{
      track({ type: 'pdp_view_time', payload: { productId: product.id, ms: Date.now()-t0 } });
    };
  }, [product.id]);
  const [openSection, setOpenSection] = useState<'details' | 'materials' | 'shipping' | null>('details');

  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };
  
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(product.id);

  const handleAddToCartClick = () => {
    track({ type: 'pdp_cta_click', payload: { productId: product.id, cta: 'make_it_yours' } });
    onAddToCart(product, quantity);
  };

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="flex items-center text-sm font-medium text-slate-600 hover:text-accent mb-8 transition-colors">
        <BackArrowIcon className="w-5 h-5 mr-2" />
        Retour aux produits
      </button>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
        <div className="bg-white p-4 rounded-lg shadow-soft">
          <div className="relative w-full aspect-square overflow-hidden">
            {product.videoUrl && currentIndex === 0 ? (
              <video controls className="w-full h-full object-cover rounded-md">
                <source src={product.videoUrl} />
              </video>
            ) : (
              <img
                src={gallery[currentIndex]}
                alt={product.name}
                className={`w-full h-full object-contain rounded-md transition-transform duration-200 ease-premium ${zoomed ? 'scale-[1.15]' : ''}`}
                onLoad={() => setImageLoaded(true)}
                onDoubleClick={()=>setZoomed(z => !z)}
              />
            )}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 rounded-md animate-pulse" />
            )}
            <button
              onClick={()=>setZoomed(z=>!z)}
              className="absolute bottom-3 right-3 px-3 py-1.5 text-sm rounded-full bg-white/85 backdrop-blur border border-sand text-charcoal"
            >
              {zoomed ? 'Réduire' : 'Zoom'}
            </button>
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex items-center gap-2 overflow-x-auto">
              {gallery.map((src, i)=>(
                <button key={i} onClick={()=>{setCurrentIndex(i); setZoomed(false);}} className={`h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border ${i===currentIndex ? 'border-accent' : 'border-sand'}`}>
                  <img src={src} alt={`Aperçu ${i+1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="text-sm font-medium text-accent uppercase tracking-[0.08em]">{translate('category', product.category)}</span>
          <div className="flex items-start justify-between gap-4 mt-2">
            <h1 className="text-3xl lg:text-4xl font-serif font-semibold text-charcoal tracking-tight flex-1">{product.name}</h1>
            <button
              onClick={() => toggleFavorite(product.id)}
              aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              className={`mt-1 h-12 w-12 sm:h-11 sm:w-11 rounded-full flex items-center justify-center border transition-colors shadow-sm ${fav ? 'border-accent text-accent bg-bone heart-pop' : 'border-gray-300 text-slate-600 bg-white'} hover:border-accent hover:text-accent`}
            >
              <HeartIcon className={`h-6 w-6 transition-transform ${fav ? 'fill-current' : 'fill-none stroke-current'}`} />
            </button>
          </div>
          
          <div className="flex items-center mt-4">
            <div className="text-slate-700 text-sm">
              Témoignages vérifiés · Expertise indépendante
            </div>
          </div>

          <div className="mt-6">
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="block text-base line-through text-taupe">{formatCurrency(product.originalPrice)}</span>
            )}
            <p className="text-3xl font-semibold text-charcoal">{formatCurrency(product.price)}</p>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="mt-2 inline-block text-xs px-2 py-1 rounded-full bg-bone text-slate-800">
                Vous gagnez {formatCurrency(product.originalPrice - product.price)}
              </span>
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

          {/* Curated longform testimonials */}
          <Testimonials
            quotes={[
              { quote: 'Des finitions impeccables et une tenue qui traverse les saisons. Un luxe calme, comme on l’aime.', name: 'Élodie M.', role: 'Styliste' },
              { quote: 'Un drapé magnifique et une sensation au porté qui change la journée. Discret et sûr.', name: 'Hassan N.', role: 'Acheteur' }
            ]}
          />

          {/* Complementary styling */}
          {suggestions.length > 0 && (
            <CompleteLook items={suggestions} onSelect={(p)=> onSelectProduct ? onSelectProduct(p) : null} />
          )}

          <div className="mt-8 flex items-center space-x-4">
            <div className="flex items-center rounded-md border border-gray-300">
              <button onClick={() => handleQuantityChange(-1)} className="px-4 py-3 min-w-[44px] text-gray-500 hover:text-gray-800 rounded-l-md transition sm:py-2 sm:min-w-0" aria-label="Réduire la quantité">-</button>
              <span className="px-5 py-3 sm:py-2 font-semibold tabular-nums">{quantity}</span>
              <button onClick={() => handleQuantityChange(1)} className="px-4 py-3 min-w-[44px] text-gray-500 hover:text-gray-800 rounded-r-md transition sm:py-2 sm:min-w-0" aria-label="Augmenter la quantité">+</button>
            </div>
            <button onClick={handleAddToCartClick} className="flex-1 btn-primary shimmer font-medium py-3 px-6 rounded-md min-h-[44px] focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2">
              Ajouter au panier
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-600">Paiement sécurisé. Emballage offert.</p>
        </div>
      </div>
      {/* Sticky bottom CTA for mobile */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 p-3 z-50">
        <div className="max-w-content mx-auto flex items-center gap-3">
          <div className="flex-1">
            <div className="text-sm text-taupe">{translate('price', '')}</div>
            <div className="text-lg font-semibold text-charcoal">{formatCurrency(product.price)}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddToCartClick} className="btn-primary py-3 px-4 rounded-md">Ajouter</button>
            <button onClick={() => { /* open cart */ }} className="px-3 py-3 rounded-md border">Voir</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;