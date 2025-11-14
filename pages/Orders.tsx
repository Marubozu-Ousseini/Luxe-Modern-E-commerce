import React, { useEffect, useState } from 'react';
import { getMyOrders } from '../services/orderClient';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../src/utils/formatter';

interface OrderItem { productId: number; quantity: number; price: number }
interface Order { id: string; total: number; currency: 'XAF'; status: string; createdAt: string; items: OrderItem[] }

const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyOrders();
        setOrders(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-4">Mes commandes</h1>
      {orders.length === 0 ? (
        <div>Aucune commande pour le moment.</div>
      ) : (
        <ul className="space-y-4">
          {orders.map(o => (
            <li key={o.id} className="p-4 bg-white shadow rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Commande #{o.id}</div>
                  <div className="text-sm text-gray-500">{new Date(o.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(o.total)}</div>
                  <div className="text-sm text-gray-500">Statut: {o.status}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OrdersPage;
