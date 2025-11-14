export interface CartItemInput { productId: number; quantity: number }

export async function createOrder(items: CartItemInput[]) {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ items })
  });
  if (!res.ok) throw new Error('Commande échouée');
  return res.json();
}

export async function getMyOrders() {
  const res = await fetch('/api/orders/me', { credentials: 'include' });
  if (!res.ok) throw new Error('Impossible de récupérer les commandes');
  return res.json();
}
