import React from 'react';
import { Product } from '../types.ts';
import ProductCard from './ProductCard.tsx';
import { formatCurrency } from '/utils/formatter.ts';

interface ProductListProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onProductSelect, onAddToCart }) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold text-gray-700">Aucun produit trouvé</h2>
        <p className="mt-2 text-gray-500">Essayez d'ajuster votre recherche ou vos filtres.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={() => onProductSelect(product)}
          onAddToCart={() => onAddToCart(product)}
        />
      ))}
    </div>
  );
};

export default ProductList;