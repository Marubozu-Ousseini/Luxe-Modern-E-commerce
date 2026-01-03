import { apiUrl } from './apiClient';
export interface CartItemInput { productId: number; quantity: number }

export async function createOrder(items: CartItemInput[], paymentMethod?: 'orange_money' | 'mtn_mobile_money' | 'on_delivery', couponCode?: string) {
  const res = await fetch(apiUrl('/api/orders'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ items, paymentMethod, couponCode })
  });
  if (!res.ok) throw new Error('Commande échouée');
  return res.json();
}

export async function getMyOrders() {
  const res = await fetch(apiUrl('/api/orders/me'), { credentials: 'include' });
  if (!res.ok) throw new Error('Impossible de récupérer les commandes');
  return res.json();
}
