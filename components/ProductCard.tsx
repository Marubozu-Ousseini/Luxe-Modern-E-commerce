import React from 'react';
import { Product } from '../types.ts';
import { usePromotions } from '../context/PromotionsContext.tsx';
import { useFavorites } from '../context/FavoritesContext.tsx';
import { CartIcon, HeartIcon } from './Icons.tsx';
import Badges from './Badges.tsx';
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

  const { promotions } = usePromotions();
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(product.id);
  const stickers = promotions?.stickers || [];
  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-lg shadow-soft overflow-hidden group cursor-pointer transition-all duration-200 ease-premium hover:-translate-y-1 hover:shadow-xl flex flex-col"
    >
      <div className="relative pt-[125%] overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          width={800}
          height={1000}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-premium group-hover:scale-[1.04]"
        />
        {/* Marketing badges: best-seller, promo, nouveau, limité */}
        <Badges product={product} />
        {/* Favorites + Stickers overlay (top-right) */}
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
            aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className={`h-9 w-9 rounded-full flex items-center justify-center shadow-sm transition-colors backdrop-blur bg-white/85 border ${fav ? 'border-red-500 text-red-600 heart-pop' : 'border-gray-200 text-slate-600'} hover:border-red-500 hover:text-red-600`}
          >
            <HeartIcon className={`h-5 w-5 transition-transform ${fav ? 'fill-current' : 'fill-none stroke-current'}`} />
          </button>
          {stickers.length > 0 && (
            <div className="flex flex-col items-end gap-2">
              {stickers.map(s => (
                s.href ? (
                  <a key={s.id} href={s.href} onClick={e => e.stopPropagation()} className="inline-flex items-center justify-center">
                    {s.imageUrl ? (
                      <img src={s.imageUrl} alt={s.text || s.id} loading="lazy" className="h-10 w-10 object-contain drop-shadow-md rounded" />
                    ) : (
                      <span className="inline-block text-[11px] px-2 py-1 rounded-full bg-white/85 backdrop-blur border border-gray-200 text-slate-700 shadow-sm">
                        {s.text || s.id}
                      </span>
                    )}
                  </a>
                ) : (
                  <span key={s.id} className="inline-flex items-center justify-center">
                    {s.imageUrl ? (
                      <img src={s.imageUrl} alt={s.text || s.id} loading="lazy" className="h-10 w-10 object-contain drop-shadow-md rounded" />
                    ) : (
                      <span className="inline-block text-[11px] px-2 py-1 rounded-full bg-white/85 backdrop-blur border border-gray-200 text-slate-700 shadow-sm">
                        {s.text || s.id}
                      </span>
                    )}
                  </span>
                )
              ))}
            </div>
          )}
        </div>
        {product.limitedAvailability && (
          <span className="absolute top-3 left-3 z-10 inline-block text-[11px] px-2 py-1 rounded-full bg-white/85 backdrop-blur border border-sand text-slate-700">
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
        <div className="mt-4 flex-grow" />
        <div className="flex items-center justify-between mt-4">
          <div className="flex flex-col">
            {product.originalPrice && product.originalPrice > product.price ? (
              <div className="flex flex-col">
                <span className="text-sm line-through text-red-600">{formatCurrency(product.originalPrice)}</span>
                <span className="text-xl font-semibold text-black">{formatCurrency(product.price)}</span>
                <span className="text-sm text-green-600 animate-pulse">Vous gagnez {formatCurrency(product.originalPrice - product.price)}</span>
              </div>
            ) : (
              <p className="text-xl font-semibold text-black">{formatCurrency(product.price)}</p>
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