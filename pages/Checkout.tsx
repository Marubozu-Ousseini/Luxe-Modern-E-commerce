import React, { useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '../src/utils/formatter.ts';
import { track } from '../services/analytics.ts';

interface Address {
  firstName: string; lastName: string; email: string;
  phone?: string; line1: string; line2?: string; city: string; country: string;
}

type PaymentMethod = 'apple_pay' | 'amex' | 'mastercard' | 'on_delivery';

const Checkout: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [address, setAddress] = useState<Address>({ firstName:'', lastName:'', email:'', line1:'', city:'', country:'CM' });
  const [payment, setPayment] = useState<PaymentMethod>('apple_pay');
  const subtotal = useMemo(()=> items.reduce((sum, i)=> sum + (i.product?.price||0) * i.quantity, 0), [items]);

  useEffect(()=>{
    try {
      const raw = localStorage.getItem('cart.items');
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  },[]);

  const complete = (e: React.FormEvent) => {
    e.preventDefault();
    track({ type: 'checkout_completed', payload: { subtotal, payment } });
    // For demo: redirect to orders page
    window.location.href = '/orders';
  };

  return (
    <main className="min-h-screen bg-porcelain">
      <div className="container mx-auto max-w-content px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-charcoal">Caisse</h1>
        <p className="mt-2 text-slate-700">Chiffrement sécurisé. Retours offerts.</p>

        <div className="mt-8 grid md:grid-cols-2 gap-8 items-start">
          {/* Form */}
          <form onSubmit={complete} className="bg-white rounded-modal shadow-soft p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Livraison</h2>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className="border border-sand rounded-soft px-3 py-2" placeholder="Prénom" value={address.firstName} onChange={e=>setAddress({...address, firstName:e.target.value})} />
                <input className="border border-sand rounded-soft px-3 py-2" placeholder="Nom" value={address.lastName} onChange={e=>setAddress({...address, lastName:e.target.value})} />
                <input className="border border-sand rounded-soft px-3 py-2 sm:col-span-2" placeholder="Email" value={address.email} onChange={e=>setAddress({...address, email:e.target.value})} />
                <input className="border border-sand rounded-soft px-3 py-2 sm:col-span-2" placeholder="Adresse" value={address.line1} onChange={e=>setAddress({...address, line1:e.target.value})} />
                <input className="border border-sand rounded-soft px-3 py-2" placeholder="Ville" value={address.city} onChange={e=>setAddress({...address, city:e.target.value})} />
                <input className="border border-sand rounded-soft px-3 py-2" placeholder="Pays" value={address.country} onChange={e=>setAddress({...address, country:e.target.value})} />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold">Paiement</h2>
              <div className="mt-3 grid grid-cols-4 gap-3">
                <label className={`flex items-center justify-center gap-2 border rounded-soft px-3 py-2 cursor-pointer ${payment==='apple_pay'?'border-accent':'border-sand'}`}>
                  <input type="radio" name="pm" className="sr-only" checked={payment==='apple_pay'} onChange={()=>setPayment('apple_pay')} />
                  {/* Apple Pay monochrome icon */}
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M16 4c-1 1-2 2-2 3s1 2 2 2 2-1 2-2-1-2-2-3zM12 8c-4 0-6 3-6 6s2 6 6 6 6-3 6-6-2-6-6-6z" stroke="#1C1C1C" strokeWidth="1.5"/>
                  </svg>
                  <span className="text-sm">Apple Pay</span>
                </label>
                <label className={`flex items-center justify-center gap-2 border rounded-soft px-3 py-2 cursor-pointer ${payment==='amex'?'border-accent':'border-sand'}`}>
                  <input type="radio" name="pm" className="sr-only" checked={payment==='amex'} onChange={()=>setPayment('amex')} />
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="#1C1C1C" strokeWidth="1.5"/>
                    <path d="M6 12h6" stroke="#1C1C1C" strokeWidth="1.5"/>
                  </svg>
                  <span className="text-sm">Amex</span>
                </label>
                <label className={`flex items-center justify-center gap-2 border rounded-soft px-3 py-2 cursor-pointer ${payment==='mastercard'?'border-accent':'border-sand'}`}>
                  <input type="radio" name="pm" className="sr-only" checked={payment==='mastercard'} onChange={()=>setPayment('mastercard')} />
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="10" cy="12" r="5" stroke="#1C1C1C" strokeWidth="1.5"/>
                    <circle cx="14" cy="12" r="5" stroke="#1C1C1C" strokeWidth="1.5"/>
                  </svg>
                  <span className="text-sm">Mastercard</span>
                </label>
                <label className={`flex items-center justify-center gap-2 border rounded-soft px-3 py-2 cursor-pointer ${payment==='on_delivery'?'border-accent':'border-sand'}`}>
                  <input type="radio" name="pm" className="sr-only" checked={payment==='on_delivery'} onChange={()=>setPayment('on_delivery')} />
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M4 7h10v10H4zM14 9h4l2 2v6h-6" stroke="#1C1C1C" strokeWidth="1.5"/>
                  </svg>
                  <span className="text-sm">À la livraison</span>
                </label>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3">Finaliser</button>
          </form>

          {/* Order summary */}
          <div className="bg-white rounded-modal shadow-soft p-6">
            <h2 className="text-xl font-semibold">Récapitulatif de commande</h2>
            <ul className="mt-3 divide-y divide-borderSoft">
              {items.map((i, idx)=> (
                <li key={idx} className="py-3 flex items-center justify-between">
                  <span className="text-slate-800">{i.product?.name || 'Produit'}</span>
                  <span className="text-charcoal font-semibold">{formatCurrency((i.product?.price||0) * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between text-lg font-semibold">
              <span>Sous-total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <p className="mt-2 text-sm text-slate-700">Frais estimés affichés à l'étape suivante. Paiement sécurisé.</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Checkout;
