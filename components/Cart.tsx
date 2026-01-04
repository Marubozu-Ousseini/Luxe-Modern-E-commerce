import React, { useState } from 'react';
import { CartItem } from '../types.ts';
import { CloseIcon, TrashIcon } from './Icons.tsx';
import { formatCurrency } from '../src/utils/formatter.ts';
import EmptyState from './EmptyState.tsx';
import { createOrder } from '../services/orderClient';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose, items, onUpdateQuantity, onRemove }) => {
  const [paymentMethod, setPaymentMethod] = useState<'orange_money' | 'mtn_mobile_money' | 'on_delivery'>('on_delivery');
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; type: 'percent' | 'amount'; value: number } | null>(null);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const originalSubtotal = items.reduce((sum, item) => sum + (item.product.originalPrice ?? item.product.price) * item.quantity, 0);
  const savingsFromOriginal = Math.max(0, originalSubtotal - subtotal);
  const couponDiscount = (() => {
    if (!couponApplied) return 0;
    if (couponApplied.type === 'percent') return Math.round(subtotal * (couponApplied.value / 100));
    return Math.min(subtotal, couponApplied.value);
  })();
  const totalAfterDiscount = Math.max(0, subtotal - couponDiscount);

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
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-soft z-50 transform transition-transform duration-300 ease-premium ${
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
              <EmptyState
                title="Votre panier est vide."
                actionLabel="Continuer les achats"
                onActionClick={onClose}
              />
            </div>
          ) : (
            <div className="flex-grow overflow-y-auto p-6">
              <ul className="divide-y divide-gray-200">
                {items.map(item => (
                  <li key={item.product.id} className="flex py-6">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <img src={item.product.imageUrl} alt={item.product.name} loading="lazy" className="h-full w-full object-cover object-center" />
                    </div>
                    <div className="ml-4 flex flex-1 flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3>{item.product.name}</h3>
                          <div className="ml-4 text-right">
                            {item.product.originalPrice && item.product.originalPrice > item.product.price ? (
                              <div className="flex flex-col items-end">
                                <span className="text-xs line-through text-red-600">{formatCurrency(item.product.originalPrice * item.quantity)}</span>
                                <span className="text-base font-semibold text-black">{formatCurrency(item.product.price * item.quantity)}</span>
                                <span className="text-xs text-green-600 animate-pulse">Vous gagnez {formatCurrency((item.product.originalPrice - item.product.price) * item.quantity)}</span>
                              </div>
                            ) : (
                              <span className="text-base font-semibold text-black">{formatCurrency(item.product.price * item.quantity)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-1 items-end justify-between text-sm">
                        <div className="flex items-center border border-gray-200 rounded-md">
                           <button onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)} className="px-2 py-1 text-gray-500 hover:text-gray-700" aria-label="Réduire la quantité">-</button>
                           <span className="px-3 py-1 tabular-nums">{item.quantity}</span>
                           <button onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)} className="px-2 py-1 text-gray-500 hover:text-gray-700" aria-label="Augmenter la quantité">+</button>
                        </div>
                        <div className="flex">
                          <button onClick={() => onRemove(item.product.id)} type="button" className="font-medium text-slate hover:text-charcoal" aria-label="Supprimer l'article">
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
              <div className="space-y-2">
                <div className="flex justify-between text-lg font-semibold text-gray-900">
                  <p>Sous-total</p>
                  <p>{formatCurrency(subtotal)}</p>
                </div>
                {savingsFromOriginal > 0 && (
                  <div className="flex justify-between text-sm text-emerald-700">
                    <p>Vous gagnez vs. prix d'origine</p>
                    <p>-{formatCurrency(savingsFromOriginal)}</p>
                  </div>
                )}
                {couponApplied && couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-blue-700">
                    <p>Coupon ({couponApplied.code})</p>
                    <p>-{formatCurrency(couponDiscount)}</p>
                  </div>
                )}
                {couponApplied && (
                  <div className="flex justify-between text-base font-semibold text-gray-900 pt-2 border-t border-gray-200">
                    <p>Total après remise</p>
                    <p>{formatCurrency(totalAfterDiscount)}</p>
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-600">Frais de port et taxes calculés à la caisse. Paiement sécurisé. Retours offerts sous 14 jours.</p>
              <div className="mt-6">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1">Code promo</label>
                    <p className="text-sm text-slate-600">Saisissez votre code promo lors du paiement sur la page de commande.</p>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Mode de paiement</label>
                    <select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value as any)} className="w-full border rounded px-3 py-2">
                      <option value="orange_money">Orange Money</option>
                      <option value="mtn_mobile_money">MTN Mobile Money</option>
                      <option value="on_delivery">Paiement à la livraison</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <a href="/checkout" className="flex items-center justify-center rounded-md btn-secondary px-6 py-3 text-base font-medium">Finaliser la commande</a>
                    <button onClick={async (ev) => {
                      ev.preventDefault();
                      try {
                        const payload = items.map(i => ({ productId: i.product.id, quantity: i.quantity }));
                        const order = await createOrder(payload, paymentMethod, couponApplied?.code);
                        window.location.href = '/orders';
                      } catch (err: any) {
                        alert(err?.message || 'Erreur lors de la commande');
                      }
                    }} className="w-full flex items-center justify-center rounded-md border border-transparent btn-primary px-6 py-3 text-base font-medium">
                      Payer maintenant
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Cart;