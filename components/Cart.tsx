import React from 'react';
import { CartItem } from '../types.ts';
import { CloseIcon, TrashIcon } from './Icons.tsx';
import { formatCurrency } from '/utils/formatter.ts';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose, items, onUpdateQuantity, onRemove }) => {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-heading"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 id="cart-heading" className="text-2xl font-bold text-gray-900">Panier</h2>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800 transition-colors" aria-label="Fermer le panier">
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>

          {items.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
              <p className="text-lg text-gray-500">Votre panier est vide.</p>
              <button onClick={onClose} className="mt-4 px-6 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 transition-colors">
                Continuer les achats
              </button>
            </div>
          ) : (
            <div className="flex-grow overflow-y-auto p-6">
              <ul className="divide-y divide-gray-200">
                {items.map(item => (
                  <li key={item.product.id} className="flex py-6">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover object-center" />
                    </div>
                    <div className="ml-4 flex flex-1 flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3>{item.product.name}</h3>
                          <p className="ml-4">{formatCurrency(item.product.price * item.quantity)}</p>
                        </div>
                      </div>
                      <div className="flex flex-1 items-end justify-between text-sm">
                        <div className="flex items-center border border-gray-200 rounded-md">
                           <button onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)} className="px-2 py-1 text-gray-500 hover:text-gray-700" aria-label="Réduire la quantité">-</button>
                           <span className="px-3 py-1 tabular-nums">{item.quantity}</span>
                           <button onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)} className="px-2 py-1 text-gray-500 hover:text-gray-700" aria-label="Augmenter la quantité">+</button>
                        </div>
                        <div className="flex">
                          <button onClick={() => onRemove(item.product.id)} type="button" className="font-medium text-primary-600 hover:text-primary-500" aria-label="Supprimer l'article">
                            <TrashIcon className="h-5 w-5"/>
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {items.length > 0 && (
            <div className="border-t border-gray-200 p-6">
              <div className="flex justify-between text-lg font-semibold text-gray-900">
                <p>Sous-total</p>
                <p>{formatCurrency(subtotal)}</p>
              </div>
              <p className="mt-1 text-sm text-gray-500">Frais de port et taxes calculés à la caisse.</p>
              <div className="mt-6">
                <a href="#" className="flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-primary-700 transition-colors">
                  Paiement
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Cart;