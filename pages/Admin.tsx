import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
}

const AdminPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Omit<Product, 'id'>>({ name: '', price: 0, description: '', category: '', imageUrl: '' });
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/produits', { credentials: 'include' });
    if (!res.ok) { setError('Accès refusé ou erreur serveur'); setLoading(false); return; }
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/admin/produits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form)
    });
    if (!res.ok) { setError("Création échouée"); return; }
    setForm({ name: '', price: 0, description: '', category: '', imageUrl: '' });
    fetchProducts();
  };

  const remove = async (id: number) => {
    const res = await fetch(`/api/admin/produits/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) { setError('Suppression échouée'); return; }
    fetchProducts();
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-4">Administration - Produits</h1>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded shadow">
            <h2 className="font-semibold mb-4">Créer un produit</h2>
            <form onSubmit={create} className="space-y-3">
              <input className="w-full border rounded px-3 py-2" placeholder="Nom" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
              <input className="w-full border rounded px-3 py-2" placeholder="Prix (XAF)" type="number" value={form.price} onChange={e=>setForm({...form, price: Number(e.target.value)})} />
              <input className="w-full border rounded px-3 py-2" placeholder="Catégorie" value={form.category} onChange={e=>setForm({...form, category: e.target.value})} />
              <input className="w-full border rounded px-3 py-2" placeholder="Image URL" value={form.imageUrl} onChange={e=>setForm({...form, imageUrl: e.target.value})} />
              <textarea className="w-full border rounded px-3 py-2" placeholder="Description" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} />
              <button className="btn-primary px-4 py-2">Créer</button>
            </form>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h2 className="font-semibold mb-4">Produits ({products.length})</h2>
            {loading ? (
              <div>Chargement...</div>
            ) : (
              <ul className="divide-y">
                {products.map(p => (
                  <li key={p.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-sm text-gray-500">{p.category}</div>
                    </div>
                    <button onClick={() => remove(p.id)} className="text-red-600">Supprimer</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminPage;
