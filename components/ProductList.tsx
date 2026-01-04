import React from 'react';
import { Product } from '../types.ts';
import ProductCard from './ProductCard.tsx';
import { formatCurrency } from '../src/utils/formatter.ts';

interface ProductListProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onProductSelect, onAddToCart }) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
  const visibleProducts = selectedCategory ? products.filter(p => p.category === selectedCategory) : products;
  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold text-gray-700">Aucun produit trouvé</h2>
        <p className="mt-2 text-gray-500">Essayez d'ajuster votre recherche ou vos filtres.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button onClick={() => setSelectedCategory(null)} className={`px-3 py-1 rounded-full ${selectedCategory===null ? 'bg-accent text-white' : 'bg-bone text-slate'}`}>Tous</button>
        {categories.map(c => (
          <button key={c} onClick={() => setSelectedCategory(c)} className={`px-3 py-1 rounded-full ${selectedCategory===c ? 'bg-accent text-white' : 'bg-bone text-slate'}`}>{c}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={() => onProductSelect(product)}
          onAddToCart={() => onAddToCart(product)}
        />
      ))}
      </div>
    </div>
  );
};

export default ProductList;