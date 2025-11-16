import React, { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import { apiUrl } from '../services/apiClient';

type OrderStatus = 'paid' | 'pending' | 'failed';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
  stock?: number;
}

interface OrderRecord {
  id: string;
  userId: string;
  total: number;
  currency: 'XAF';
  status: OrderStatus;
  createdAt: string;
}

interface UserRecord {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
}

type TabKey = 'products' | 'orders' | 'customers' | 'payments';

const AdminPage: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('products');
  const [error, setError] = useState<string | null>(null);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [form, setForm] = useState<Omit<Product, 'id'>>({ name: '', price: 0, description: '', category: '', imageUrl: '', stock: 0 });

  // Orders state
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);

  // Customers state
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [userLoading, setUserLoading] = useState(false);

  // Payments state (derived)
  const [payments, setPayments] = useState<any[]>([]);
  const [payLoading, setPayLoading] = useState(false);

  const tabs: { key: TabKey; label: string }[] = useMemo(() => ([
    { key: 'products', label: 'Produits' },
    { key: 'orders', label: 'Commandes' },
    { key: 'customers', label: 'Clients' },
    { key: 'payments', label: 'Paiements' },
  ]), []);

  // Data loaders
  const fetchProducts = async () => {
    setProdLoading(true);
    const res = await fetch(apiUrl('/api/admin/produits'), { credentials: 'include' });
    if (!res.ok) { setError('Accès refusé ou erreur serveur'); setProdLoading(false); return; }
    setProducts(await res.json());
    setProdLoading(false);
  };
  const fetchOrders = async () => {
    setOrderLoading(true);
    const res = await fetch(apiUrl('/api/admin/orders'), { credentials: 'include' });
    if (!res.ok) { setError('Impossible de charger les commandes'); setOrderLoading(false); return; }
    setOrders(await res.json());
    setOrderLoading(false);
  };
  const fetchUsers = async () => {
    setUserLoading(true);
    const res = await fetch(apiUrl('/api/admin/users'), { credentials: 'include' });
    if (!res.ok) { setError('Impossible de charger les utilisateurs'); setUserLoading(false); return; }
    setUsers(await res.json());
    setUserLoading(false);
  };
  const fetchPayments = async () => {
    setPayLoading(true);
    const res = await fetch(apiUrl('/api/admin/payments'), { credentials: 'include' });
    if (!res.ok) { setError('Impossible de charger les paiements'); setPayLoading(false); return; }
    setPayments(await res.json());
    setPayLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { if (tab === 'orders') fetchOrders(); }, [tab]);
  useEffect(() => { if (tab === 'customers') fetchUsers(); }, [tab]);
  useEffect(() => { if (tab === 'payments') fetchPayments(); }, [tab]);

  // Actions
  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch(apiUrl('/api/admin/produits'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form)
    });
    if (!res.ok) { setError('Création échouée'); return; }
    setForm({ name: '', price: 0, description: '', category: '', imageUrl: '', stock: 0 });
    fetchProducts();
  };
  const removeProduct = async (id: number) => {
    const res = await fetch(apiUrl(`/api/admin/produits/${id}`), { method: 'DELETE', credentials: 'include' });
    if (!res.ok) { setError('Suppression échouée'); return; }
    fetchProducts();
  };
  const changeOrderStatus = async (id: string, status: OrderStatus) => {
    const res = await fetch(apiUrl(`/api/admin/orders/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    if (!res.ok) { setError('Mise à jour du statut échouée'); return; }
    fetchOrders();
  };
  const changeUserRole = async (email: string, role: 'user' | 'admin') => {
    const res = await fetch(apiUrl('/api/admin/users/role'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, role })
    });
    if (!res.ok) { setError("Mise à jour du rôle échouée"); return; }
    fetchUsers();
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Tableau de bord Administrateur</h1>
        {error && <div className="mb-4 text-red-500">{error}</div>}

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded border ${tab === t.key ? 'bg-black text-white' : 'bg-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded shadow">
              <h2 className="font-semibold mb-4">Créer un produit</h2>
              <form onSubmit={createProduct} className="space-y-3">
                <input className="w-full border rounded px-3 py-2" placeholder="Nom" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
                <input className="w-full border rounded px-3 py-2" placeholder="Prix (XAF)" type="number" value={form.price} onChange={e=>setForm({...form, price: Number(e.target.value)})} />
                <input className="w-full border rounded px-3 py-2" placeholder="Stock" type="number" value={form.stock ?? 0} onChange={e=>setForm({...form, stock: Number(e.target.value)})} />
                <input className="w-full border rounded px-3 py-2" placeholder="Catégorie" value={form.category} onChange={e=>setForm({...form, category: e.target.value})} />
                <input className="w-full border rounded px-3 py-2" placeholder="Image URL" value={form.imageUrl} onChange={e=>setForm({...form, imageUrl: e.target.value})} />
                <textarea className="w-full border rounded px-3 py-2" placeholder="Description" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} />
                <button className="btn-primary px-4 py-2">Créer</button>
              </form>
            </div>

            <div className="bg-white p-6 rounded shadow">
              <h2 className="font-semibold mb-4">Produits ({products.length})</h2>
              {prodLoading ? (
                <div>Chargement...</div>
              ) : (
                <ul className="divide-y">
                  {products.map(p => (
                    <li key={p.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.name} <span className="text-xs text-gray-500">({p.category})</span></div>
                        <div className="text-sm text-gray-500">{p.price.toLocaleString()} XAF · Stock: {p.stock ?? 0}</div>
                      </div>
                      <button onClick={() => removeProduct(p.id)} className="text-red-600">Supprimer</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="font-semibold mb-4">Commandes ({orders.length})</h2>
            {orderLoading ? <div>Chargement...</div> : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b"><th className="py-2">ID</th><th>Client</th><th>Total</th><th>Statut</th><th>Date</th><th></th></tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-b">
                      <td className="py-2 text-xs">{o.id}</td>
                      <td className="text-xs">{o.userId}</td>
                      <td>{o.total.toLocaleString()} {o.currency}</td>
                      <td>
                        <select className="border rounded px-2 py-1" value={o.status} onChange={e => changeOrderStatus(o.id, e.target.value as OrderStatus)}>
                          <option value="paid">payée</option>
                          <option value="pending">en attente</option>
                          <option value="failed">échouée</option>
                        </select>
                      </td>
                      <td className="text-sm">{new Date(o.createdAt).toLocaleString()}</td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'customers' && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="font-semibold mb-4">Clients ({users.length})</h2>
            {userLoading ? <div>Chargement...</div> : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b"><th className="py-2">Email</th><th>Nom</th><th>Rôle</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b">
                      <td className="py-2">{u.email}</td>
                      <td>{u.name || '-'}</td>
                      <td>
                        <select className="border rounded px-2 py-1" value={u.role} onChange={e => changeUserRole(u.email, e.target.value as 'user' | 'admin')}>
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'payments' && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="font-semibold mb-4">Paiements</h2>
            {payLoading ? <div>Chargement...</div> : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b"><th className="py-2">ID</th><th>Client</th><th>Montant</th><th>Devise</th><th>Statut</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {payments.map((p: any) => (
                    <tr key={p.id} className="border-b">
                      <td className="py-2 text-xs">{p.id}</td>
                      <td className="text-xs">{p.userId}</td>
                      <td>{Number(p.amount).toLocaleString()}</td>
                      <td>{p.currency}</td>
                      <td>{p.status}</td>
                      <td className="text-sm">{new Date(p.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default AdminPage;
