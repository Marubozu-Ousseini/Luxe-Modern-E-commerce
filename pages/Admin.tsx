import React, { useEffect, useMemo, useState } from 'react';
import PageBackground from '../components/PageBackground.tsx';
import ErrorBoundary from '../components/ErrorBoundary.tsx';
import PasswordToggle from '../components/PasswordToggle.tsx';
import ProtectedRoute from '../components/ProtectedRoute';
import { apiUrl } from '../services/apiClient';

type OrderStatus = 'paid' | 'pending' | 'failed';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
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
  paymentMethod?: 'orange_money' | 'mtn_mobile_money' | 'on_delivery';
  adminConfirmed?: boolean;
  createdAt: string;
}

interface UserRecord {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  rewardsPoints?: number;
  vouchers?: { code: string; amount?: number; expiresAt?: string; createdAt: string }[];
}

type TabKey = 'products' | 'orders' | 'customers' | 'payments' | 'promos' | 'ads';

// Helpers for payments monthly summary
type PaymentRow = { id: string; userId: string; amount: number; currency: string; status: string; createdAt: string };
export const getMonthlyRows = (payments: PaymentRow[]) => {
  const map = new Map<string, { month: string; total: number; count: number }>();
  for (const p of payments) {
    const d = new Date(p.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`;
    const rec = map.get(key) || { month: key, total: 0, count: 0 };
    rec.total += Number(p.amount) || 0;
    rec.count += 1;
    map.set(key, rec);
  }
  return Array.from(map.values()).sort((a,b) => a.month.localeCompare(b.month));
};

const MonthlySummary: React.FC<{ payments: PaymentRow[]; onDownloadCsv: () => void }>
  = ({ payments, onDownloadCsv }) => {
  const rows = useMemo(() => getMonthlyRows(payments), [payments]);
  if (rows.length === 0) return null;
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold mb-2">Totaux par mois</h3>
        <button onClick={onDownloadCsv} className="px-3 py-1 border rounded text-sm">Exporter (CSV)</button>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b bg-blue-50/80">
            <th className="py-2">Mois</th><th>Nombre</th><th>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.month} className="border-b bg-blue-50 font-semibold">
              <td className="py-2">{r.month}</td>
              <td>{r.count}</td>
              <td>{r.total.toLocaleString()} XAF</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AdminPage: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('products');
  const [error, setError] = useState<string | null>(null);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [form, setForm] = useState<Omit<Product, 'id'>>({ name: '', price: 0, originalPrice: undefined, description: '', category: '', imageUrl: '', stock: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 5;
  const [editing, setEditing] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<Product | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);

  // Customers state
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [userLoading, setUserLoading] = useState(false);

  // Payments state (derived)
  const [payments, setPayments] = useState<any[]>([]);
  const [payLoading, setPayLoading] = useState(false);
  // Promotions state
  const [promoState, setPromoState] = useState<any>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [previewState, setPreviewState] = useState<any | null>(null);
  const [previewPageKey, setPreviewPageKey] = useState<string>('home');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const [categories, setCategories] = useState<string[]>([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [formPreview, setFormPreview] = useState<string | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);

  const tabs: { key: TabKey; label: string }[] = useMemo(() => ([
    { key: 'products', label: 'Produits' },
    { key: 'orders', label: 'Commandes' },
    { key: 'customers', label: 'Clients' },
    { key: 'payments', label: 'Paiements' },
    { key: 'promos', label: 'Promotions' },
    { key: 'ads', label: 'Publicités' },
  ]), []);

  // Data loaders
  const fetchProducts = async () => {
    setProdLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    params.set('limit', String(pageSize));
    params.set('offset', String(page * pageSize));
    const res = await fetch(apiUrl(`/api/admin/produits?${params.toString()}`), { credentials: 'include' });
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
  const fetchPromos = async () => {
    setPromoLoading(true);
    const res = await fetch(apiUrl('/api/promotions/admin'), { credentials: 'include' });
    if (!res.ok) { setPromoLoading(false); return; }
    setPromoState(await res.json());
    setPromoLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [search, page]);
  useEffect(() => { if (tab === 'orders') fetchOrders(); }, [tab]);
  useEffect(() => { if (tab === 'customers') fetchUsers(); }, [tab]);
  useEffect(() => { if (tab === 'payments') fetchPayments(); }, [tab]);
  useEffect(() => { if (tab === 'promos') fetchPromos(); }, [tab]);
  useEffect(() => { if (tab === 'ads') fetchPromos(); }, [tab]);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setCatsLoading(true);
    try {
      const res = await fetch(apiUrl('/api/admin/categories'), { credentials: 'include' });
      if (!res.ok) { setCategories([]); setCatsLoading(false); return; }
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    } finally { setCatsLoading(false); }
  };

  // Upload helper: request signed upload URL, PUT file, return proxy URL
  const uploadFile = async (file: File) => {
    // Request signed upload URL from server
    const res = await fetch(apiUrl('/api/admin/upload-url'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });
    if (!res.ok) throw new Error('Failed to get upload URL');
    const data = await res.json();
    const uploadUrl: string = data.uploadUrl;
    const proxyUrl: string = data.proxyUrl;
    // Upload the file directly to the signed URL
    const putRes = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
    if (!putRes.ok) throw new Error('Upload failed');
    return proxyUrl;
  };

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
  const startEdit = (p: Product) => {
    setEditing(p);
    // create a local copy for the editing form so we don't mutate the list item directly
    setEditForm({ ...p });
  };
  const cancelEdit = () => { setEditing(null); setEditForm(null); setEditSaving(false); };
  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    try {
      setEditSaving(true);
      const res = await fetch(apiUrl(`/api/admin/produits/${editForm.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editForm.name,
          price: editForm.price,
          originalPrice: editForm.originalPrice,
          description: editForm.description,
          category: editForm.category,
          imageUrl: editForm.imageUrl,
          stock: editForm.stock ?? 0,
          labels: (editForm as any).labels || []
        })
      });
      if (!res.ok) { setError('Mise à jour échouée'); return; }
      setEditing(null);
      setEditForm(null);
      fetchProducts();
    } finally {
      setEditSaving(false);
    }
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

  // Rewards & Vouchers actions
  const grantPoints = async (email: string) => {
    const val = prompt('Nombre de points à ajouter (peut être négatif pour retirer):', '10');
    if (!val) return;
    const points = Number(val);
    if (Number.isNaN(points)) return alert('Valeur invalide');
    const res = await fetch(apiUrl('/api/admin/users/rewards'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, points })
    });
    if (!res.ok) { setError("Mise à jour des points échouée"); return; }
    fetchUsers();
  };

  const addVoucher = async (email: string) => {
    const code = prompt('Code du bon cadeau / voucher:', 'GIFT-' + Math.random().toString(36).slice(2,8).toUpperCase());
    if (!code) return;
    const amountStr = prompt('Montant (XAF, optionnel):', '0');
    const expiresAt = prompt('Date d\'expiration (YYYY-MM-DD, optionnel):', '');
    const amount = amountStr ? Number(amountStr) : undefined;
    const payload: any = { email, code };
    if (!Number.isNaN(amount!) && amount! > 0) payload.amount = amount;
    if (expiresAt) payload.expiresAt = new Date(expiresAt).toISOString();
    const res = await fetch(apiUrl('/api/admin/users/vouchers'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    if (!res.ok) { setError('Création du bon cadeau échouée'); return; }
    fetchUsers();
  };

  // Download helpers
  const downloadJson = (filename: string, data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };
  const toCsv = (rows: any[], headers?: string[]) => {
    if (rows.length === 0) return '';
    const cols = headers || Object.keys(rows[0]);
    const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const lines = [cols.join(',')].concat(rows.map(r => cols.map(c => esc(r[c])).join(',')));
    return lines.join('\n');
  };
  const downloadCsv = (filename: string, rows: any[], headers?: string[]) => {
    const csv = toCsv(rows, headers);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ErrorBoundary>
      <ProtectedRoute requireAdmin>
        <PageBackground pageKey="admin" overlayClassName="bg-black/65 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">Tableau de bord Administrateur</h1>
          <div className="flex gap-2">
            <button
              onClick={() => downloadJson('dashboard.json', { products, orders, users, payments })}
              className="px-3 py-2 border rounded"
            >Télécharger JSON</button>
            <button
              onClick={() => downloadCsv('payments.csv', payments)}
              className="px-3 py-2 border rounded"
            >Paiements CSV</button>
          </div>
        </div>
        {error && <div className="mb-4 text-red-500">{error}</div>}

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded border transition-colors duration-150 ${tab === t.key ? 'bg-blue-900 text-white border-blue-900' : 'bg-sky-200 text-blue-900 border-sky-300 hover:bg-sky-300'}`} aria-pressed={tab===t.key}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/95 text-charcoal p-6 rounded shadow">
              <h2 className="font-semibold mb-4">Créer un produit</h2>
              <form onSubmit={createProduct} className="space-y-3">
                <input className="w-full border rounded px-3 py-2" placeholder="Nom" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
                <input className="w-full border rounded px-3 py-2" placeholder="Prix (XAF)" type="number" value={form.price} onChange={e=>setForm({...form, price: Number(e.target.value)})} />
                <input className="w-full border rounded px-3 py-2" placeholder="Ancien prix (XAF, optionnel)" type="number" value={Number(form.originalPrice ?? 0)} onChange={e=>setForm({...form, originalPrice: Number(e.target.value) || undefined})} />
                <input className="w-full border rounded px-3 py-2" placeholder="Stock" type="number" value={form.stock ?? 0} onChange={e=>setForm({...form, stock: Number(e.target.value)})} />
                <div>
                  <label className="sr-only">Catégorie</label>
                  <select className="w-full border rounded px-3 py-2" value={form.category || ''} onChange={e => {
                    const v = e.target.value;
                    if (v === '__new__') {
                      setForm({ ...form, category: '__new__' });
                    } else {
                      setForm({ ...form, category: v });
                      setNewCategory('');
                    }
                  }}>
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="__new__">Créer nouvelle catégorie...</option>
                  </select>
                  {form.category === '__new__' && (
                    <input className="w-full border rounded px-3 py-2 mt-2" placeholder="Nouvelle catégorie" value={newCategory} onChange={e => { setNewCategory(e.target.value); setForm({ ...form, category: e.target.value }); }} />
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1">Étiquettes (labels)</label>
                  <textarea className="w-full border rounded px-3 py-2 text-sm" placeholder="Saisir les slugs séparés par des virgules (ex: soldes,nouveaute)" value={((form as any).labels || []).join(',')} onChange={e=>setForm({ ...(form as any), labels: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) }) as any} />
                  <p className="text-xs text-slate-600 mt-1">Disponibles: {(promoState?.labels||[]).map((l:any)=>l.slug).join(', ')}</p>
                </div>
                <div>
                  <input className="w-full border rounded px-3 py-2" placeholder="Image URL" value={form.imageUrl} onChange={e=>setForm({...form, imageUrl: e.target.value})} />
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full mt-2 text-[13px]"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const preview = URL.createObjectURL(file);
                        setFormPreview(preview);
                        setForm({ ...form, imageUrl: 'Uploading...' });
                        const url = await uploadFile(file);
                        setForm({ ...form, imageUrl: url });
                        // clear preview and revoke
                        setFormPreview(null);
                        URL.revokeObjectURL(preview);
                      } catch (err) {
                        // eslint-disable-next-line no-console
                        console.error('upload error', err);
                        setForm({ ...form, imageUrl: '' });
                        alert('Échec de l\'upload');
                      }
                    }}
                  />
                  {/* Preview: immediate local preview if present, otherwise uploaded proxy URL */}
                  {formPreview ? (
                    <img src={formPreview} alt={form.name || 'Preview'} className="mt-2 h-24 w-full object-contain rounded" />
                  ) : form.imageUrl ? (
                    form.imageUrl === 'Uploading...' ? (
                      <div className="text-sm mt-2">Uploading...</div>
                    ) : (/^https?:\/\//i).test(form.imageUrl) ? (
                      <img src={form.imageUrl} alt={form.name || 'Preview'} className="mt-2 h-24 w-full object-contain rounded" />
                    ) : null
                  ) : null}
                </div>
                <textarea className="w-full border rounded px-3 py-2" placeholder="Description" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} />
                <button className="btn-primary px-4 py-2 active:scale-95 transition-transform">Créer</button>
              </form>
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Recherche & Pagination</h3>
                <input className="w-full border rounded px-3 py-2 mb-2" placeholder="Rechercher..." value={search} onChange={e=>{ setPage(0); setSearch(e.target.value); }} />
                <div className="flex items-center gap-2">
                  <button disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))} className="px-3 py-1 border rounded disabled:opacity-50">Précédent</button>
                  <span>Page {page+1}</span>
                  <button disabled={products.length < pageSize} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 border rounded disabled:opacity-50">Suivant</button>
                </div>
              </div>
            </div>

            <div className="bg-white/95 text-charcoal p-6 rounded shadow">
              <h2 className="font-semibold mb-4">Produits ({products.length})</h2>
              {prodLoading ? (
                <div>Chargement...</div>
              ) : (
                <ul className="divide-y">
                  {products.map(p => {
                    const imgSrc = p.imageUrl ? (/^https?:\/\//i).test(p.imageUrl) ? p.imageUrl : apiUrl(p.imageUrl) : null;
                    return (
                      <li key={p.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {imgSrc ? (
                            <img src={imgSrc} alt={p.name} className="h-16 w-16 object-cover rounded" />
                          ) : (
                            <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">No image</div>
                          )}
                          <div>
                            <div className="font-medium">{p.name} <span className="text-xs text-gray-500">({p.category})</span></div>
                            <div className="text-sm text-gray-500">{p.price.toLocaleString()} XAF · Stock: {p.stock ?? 0}</div>
                            {(p as any).labels && (p as any).labels.length > 0 && (
                              <div className="mt-1 text-[11px] text-gray-500">Labels: {((p as any).labels as string[]).join(', ')}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => startEdit(p)} className="text-blue-600 active:scale-95 transition-transform">Éditer</button>
                          <button onClick={() => removeProduct(p.id)} className="text-red-600 active:scale-95 transition-transform">Supprimer</button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {editing && editForm && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded w-full max-w-lg">
                  <h2 className="font-semibold mb-4">Modifier produit #{editForm.id}</h2>
                  <form onSubmit={saveEdit} className="space-y-3">
                    <input className="w-full border rounded px-3 py-2" value={editForm.name} onChange={e=>setEditForm({...editForm, name: e.target.value})} />
                    <input className="w-full border rounded px-3 py-2" type="number" value={editForm.price} onChange={e=>setEditForm({...editForm, price: Number(e.target.value)})} />
                    <input className="w-full border rounded px-3 py-2" type="number" placeholder="Ancien prix (XAF, optionnel)" value={editForm.originalPrice ?? ''} onChange={e=>{
                      const v = e.target.value;
                      setEditForm({...editForm, originalPrice: v === '' ? undefined : Number(v)});
                    }} />
                    <input className="w-full border rounded px-3 py-2" type="number" value={editForm.stock ?? 0} onChange={e=>setEditForm({...editForm, stock: Number(e.target.value)})} />
                    <div>
                      <label className="sr-only">Catégorie</label>
                      <select className="w-full border rounded px-3 py-2" value={editForm.category || ''} onChange={e => {
                        const v = e.target.value;
                        if (v === '__new__') {
                          setEditForm({ ...editForm, category: '__new__' });
                        } else {
                          setEditForm({ ...editForm, category: v });
                        }
                      }}>
                        <option value="">Sélectionner une catégorie</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        <option value="__new__">Créer nouvelle catégorie...</option>
                      </select>
                      {editForm.category === '__new__' && (
                        <input className="w-full border rounded px-3 py-2 mt-2" placeholder="Nouvelle catégorie" value={newCategory} onChange={e => { setNewCategory(e.target.value); setEditForm({ ...editForm, category: e.target.value }); }} />
                      )}
                    </div>
                    <div>
                      <input className="w-full border rounded px-3 py-2" value={editForm.imageUrl} onChange={e=>setEditForm({...editForm, imageUrl: e.target.value})} />
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full mt-2 text-[13px]"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const preview = URL.createObjectURL(file);
                            setEditPreview(preview);
                            setEditForm({ ...editForm, imageUrl: 'Uploading...' });
                            const url = await uploadFile(file);
                            setEditForm({ ...editForm, imageUrl: url });
                            setEditPreview(null);
                            URL.revokeObjectURL(preview);
                          } catch (err) {
                            // eslint-disable-next-line no-console
                            console.error('upload error', err);
                            setEditForm({ ...editForm, imageUrl: '' });
                            alert('Échec de l\'upload');
                          }
                        }}
                      />
                        {/* Preview for edit */}
                        {/* Preview for edit: prefer local preview while uploading */}
                        {editPreview ? (
                          <img src={editPreview} alt={editForm.name || 'Preview'} className="mt-2 h-24 w-full object-contain rounded" />
                        ) : editForm.imageUrl ? (
                          editForm.imageUrl === 'Uploading...' ? (
                            <div className="text-sm mt-2">Uploading...</div>
                          ) : (/^https?:\/\//i).test(editForm.imageUrl) ? (
                            <img src={editForm.imageUrl} alt={editForm.name || 'Preview'} className="mt-2 h-24 w-full object-contain rounded" />
                          ) : null
                        ) : null}
                    </div>
                    <textarea className="w-full border rounded px-3 py-2" value={editForm.description} onChange={e=>setEditForm({...editForm, description: e.target.value})} />
                    <div>
                      <label className="block text-sm mb-1">Étiquettes (labels)</label>
                      <textarea
                        className="w-full border rounded px-3 py-2 text-sm"
                        placeholder="Saisir les slugs séparés par des virgules (ex: soldes,nouveaute)"
                        value={(((editForm as any).labels || []) as string[]).join(',')}
                        onChange={e => setEditForm({ ...(editForm as any), labels: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) } as any)}
                      />
                      <p className="text-xs text-slate-600 mt-1">Disponibles: {(promoState?.labels||[]).map((l:any)=>l.slug).join(', ')}</p>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <button type="button" onClick={cancelEdit} disabled={editSaving} className="px-4 py-2 border rounded active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">Annuler</button>
                      <button disabled={editSaving} className="px-4 py-2 bg-black text-white rounded active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">{editSaving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'orders' && (
          <div className="bg-white/95 text-charcoal p-6 rounded shadow">
            <h2 className="font-semibold mb-4">Commandes ({orders.length})</h2>
            {orderLoading ? <div>Chargement...</div> : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b"><th className="py-2">ID</th><th>Client</th><th>Total</th><th>Paiement</th><th>Statut</th><th>Date</th><th></th></tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-b">
                      <td className="py-2 text-xs">{o.id}</td>
                      <td className="text-xs">{o.userId}</td>
                      <td>{o.total.toLocaleString()} {o.currency}</td>
                      <td className="text-sm">{o.paymentMethod === 'orange_money' ? 'Orange Money' : o.paymentMethod === 'mtn_mobile_money' ? 'MTN Mobile Money' : 'À la livraison'}</td>
                      <td>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${o.status === 'paid' ? 'bg-green-100 text-green-700' : o.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status}</span>
                      </td>
                      <td className="text-sm">{new Date(o.createdAt).toLocaleString()}</td>
                      <td className="flex items-center gap-2">
                        <select className="border rounded px-2 py-1" value={o.status} onChange={e => changeOrderStatus(o.id, e.target.value as OrderStatus)}>
                          <option value="paid">payée</option>
                          <option value="pending">en attente</option>
                          <option value="failed">échouée</option>
                        </select>
                        <button onClick={async () => {
                          // confirm shipment
                          const res = await fetch(apiUrl(`/api/admin/orders/${o.id}/confirm-shipment`), { method: 'PATCH', credentials: 'include' });
                          if (!res.ok) { setError('Erreur lors de la confirmation'); return; }
                          fetchOrders();
                        }} className={`px-2 py-1 text-sm rounded border ${o.adminConfirmed ? 'bg-green-100 text-green-700' : ''}`}>{o.adminConfirmed ? 'Confirmé' : 'Confirmer'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'customers' && (
          <div className="bg-white/95 text-charcoal p-6 rounded shadow">
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
                      <td>
                        <div className="flex flex-col">
                          <span>{u.name || '-'}</span>
                          <span className="text-xs text-gray-500">Points: {u.rewardsPoints ?? 0}</span>
                          {u.vouchers && u.vouchers.length > 0 && (
                            <span className="text-xs text-gray-500">Bons: {u.vouchers.length}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <select className="border rounded px-2 py-1" value={u.role} onChange={e => changeUserRole(u.email, e.target.value as 'user' | 'admin')}>
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => grantPoints(u.email)} className="px-2 py-1 border rounded text-xs">+ Points</button>
                          <button onClick={() => addVoucher(u.email)} className="px-2 py-1 border rounded text-xs">+ Bon</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Admin password change */}
        <div className="mt-8 bg-white/95 text-charcoal p-6 rounded shadow max-w-md">
          <h2 className="font-semibold mb-4">Changer votre mot de passe</h2>
          {passwordMessage && (
            <div className="mb-3 text-sm {passwordMessage.startsWith('Succès') ? 'text-green-600' : 'text-red-600'}">
              {passwordMessage}
            </div>
          )}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setPasswordMessage(null);
              if (!currentPassword || !newPassword) {
                setPasswordMessage('Veuillez remplir tous les champs');
                return;
              }
              try {
                const res = await fetch(apiUrl('/api/admin/users/password'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ currentPassword, newPassword }),
                });
                if (!res.ok) {
                  const data = await res.json().catch(() => null);
                  setPasswordMessage(data?.message || 'Erreur lors du changement de mot de passe');
                  return;
                }
                setPasswordMessage('Succès: mot de passe mis à jour');
                setCurrentPassword('');
                setNewPassword('');
              } catch {
                setPasswordMessage('Erreur réseau, veuillez réessayer');
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-sm mb-1" htmlFor="currentPassword">Mot de passe actuel</label>
              <PasswordToggle
                id="currentPassword"
                className="w-full border rounded px-3 py-2"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1" htmlFor="newPassword">Nouveau mot de passe</label>
              <PasswordToggle
                id="newPassword"
                className="w-full border rounded px-3 py-2"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <button className="px-4 py-2 bg-black text-white rounded">Mettre à jour</button>
          </form>
        </div>

        {tab === 'payments' && (
          <div className="bg-white/95 text-charcoal p-6 rounded shadow">
            <h2 className="font-semibold mb-4">Paiements</h2>
            {payLoading ? <div>Chargement...</div> : (
              <>
              {/* Monthly summary */}
              <MonthlySummary payments={payments} onDownloadCsv={() => {
                const rows = getMonthlyRows(payments);
                downloadCsv('payments_monthly.csv', rows, ['month','count','total']);
              }} />
              <table className="w-full text-left mt-6">
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
                      <td><span className={`px-2 py-1 rounded text-xs font-semibold ${p.status === 'paid' ? 'bg-green-100 text-green-700' : p.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span></td>
                      <td className="text-sm">{new Date(p.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </>
            )}
          </div>
        )}

        {tab === 'promos' && (
          <div className="bg-white/95 text-charcoal p-6 rounded shadow">
            <h2 className="font-semibold mb-4">Promotions & Bons</h2>
            {promoLoading && <div>Chargement...</div>}
            {promoState && (
              <form className="space-y-6" onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget as HTMLFormElement);
                const parseCsv = (v: any) => String(v || '').split(',').map(s=>s.trim()).filter(Boolean);
                const body: any = {
                  promotionsActive: fd.get('promotionsActive') === 'on',
                  vouchersActive: fd.get('vouchersActive') === 'on',
                  bannerText: String(fd.get('bannerText') || ''),
                  voucherText: String(fd.get('voucherText') || ''),
                  marqueeSpeedSeconds: Number(fd.get('marqueeSpeedSeconds') || promoState.marqueeSpeedSeconds || 18),
                  glowEnabled: fd.get('glowEnabled') === 'on',
                  adBanner: {
                    active: fd.get('adActive') === 'on',
                    text: String(fd.get('adText') || ''),
                    link: (String(fd.get('adLink') || '').trim() || undefined),
                  },
                  loginBackground: {
                    desktop: String(fd.get('loginDesktop')||'').trim() || undefined,
                    mobile: String(fd.get('loginMobile')||'').trim() || undefined,
                    fallback: parseCsv(fd.get('loginFallback')) || undefined,
                    alt: String(fd.get('loginAlt')||'').trim() || undefined,
                  },
                  pageBackgrounds: {
                    home: {
                      desktop: String(fd.get('bgHomeDesktop')||'').trim() || undefined,
                      mobile: String(fd.get('bgHomeMobile')||'').trim() || undefined,
                      fallback: parseCsv(fd.get('bgHomeFallback')) || undefined,
                      alt: String(fd.get('bgHomeAlt')||'').trim() || undefined,
                    },
                    showroom: {
                      desktop: String(fd.get('bgShowroomDesktop')||'').trim() || undefined,
                      mobile: String(fd.get('bgShowroomMobile')||'').trim() || undefined,
                      fallback: parseCsv(fd.get('bgShowroomFallback')) || undefined,
                      alt: String(fd.get('bgShowroomAlt')||'').trim() || undefined,
                    },
                    galeries: {
                      desktop: String(fd.get('bgGaleriesDesktop')||'').trim() || undefined,
                      mobile: String(fd.get('bgGaleriesMobile')||'').trim() || undefined,
                      fallback: parseCsv(fd.get('bgGaleriesFallback')) || undefined,
                      alt: String(fd.get('bgGaleriesAlt')||'').trim() || undefined,
                    },
                    story: {
                      desktop: String(fd.get('bgStoryDesktop')||'').trim() || undefined,
                      mobile: String(fd.get('bgStoryMobile')||'').trim() || undefined,
                      fallback: parseCsv(fd.get('bgStoryFallback')) || undefined,
                      alt: String(fd.get('bgStoryAlt')||'').trim() || undefined,
                    },
                    admin: {
                      desktop: String(fd.get('bgAdminDesktop')||'').trim() || undefined,
                      mobile: String(fd.get('bgAdminMobile')||'').trim() || undefined,
                      fallback: parseCsv(fd.get('bgAdminFallback')) || undefined,
                      alt: String(fd.get('bgAdminAlt')||'').trim() || undefined,
                    },
                  },
                  stickers: (function(){
                    const raw = String(fd.get('stickers') || '').trim();
                    if(!raw) return promoState.stickers;
                    try {
                      const parsed = JSON.parse(raw);
                      if (Array.isArray(parsed)) return parsed;
                    } catch {/* ignore */}
                    return promoState.stickers;
                  })()
                };
                const res = await fetch(apiUrl('/api/promotions/admin'), {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify(body),
                });
                if (res.ok) setPromoState(await res.json());
              }}>
                <div className="flex items-center gap-2">
                  <input id="promotionsActive" name="promotionsActive" type="checkbox" defaultChecked={!!promoState.promotionsActive} />
                  <label htmlFor="promotionsActive">Activer le bandeau de promotion (animation)</label>
                </div>
                <div className="flex items-center gap-2">
                  <input id="vouchersActive" name="vouchersActive" type="checkbox" defaultChecked={!!promoState.vouchersActive} />
                  <label htmlFor="vouchersActive">Activer l'affichage des bons/points sur le site</label>
                </div>
                <div className="flex items-center gap-2">
                  <input id="glowEnabled" name="glowEnabled" type="checkbox" defaultChecked={!!promoState.glowEnabled} />
                  <label htmlFor="glowEnabled">Effet lumineux sur le bandeau</label>
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor="bannerText">Texte du bandeau</label>
                  <input id="bannerText" name="bannerText" className="w-full border rounded px-3 py-2" defaultValue={promoState.bannerText} />
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor="voucherText">Texte des bons</label>
                  <input id="voucherText" name="voucherText" className="w-full border rounded px-3 py-2" defaultValue={promoState.voucherText} />
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor="marqueeSpeedSeconds">Vitesse défilement (secondes)</label>
                  <input id="marqueeSpeedSeconds" name="marqueeSpeedSeconds" type="number" min={4} max={120} className="w-full border rounded px-3 py-2" defaultValue={promoState.marqueeSpeedSeconds || 18} />
                </div>
                <fieldset className="border rounded p-4">
                  <legend className="text-sm font-medium px-2">Publicité (bandeau discret)</legend>
                  <div className="flex items-center gap-2 mb-2">
                    <input id="adActive" name="adActive" type="checkbox" defaultChecked={!!promoState.adBanner?.active} />
                    <label htmlFor="adActive">Activer la publicité</label>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs mb-1" htmlFor="adText">Texte</label>
                      <input id="adText" name="adText" className="w-full border rounded px-2 py-1 text-sm" defaultValue={promoState.adBanner?.text || ''} />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" htmlFor="adLink">Lien (optionnel)</label>
                      <input id="adLink" name="adLink" className="w-full border rounded px-2 py-1 text-sm" defaultValue={promoState.adBanner?.link || ''} />
                    </div>
                  </div>
                </fieldset>
                <fieldset className="border rounded p-4">
                  <legend className="text-sm font-medium px-2">Fond page Login</legend>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="block text-xs mb-1" htmlFor="loginDesktop">Desktop</label>
                      <input id="loginDesktop" name="loginDesktop" className="w-full border rounded px-2 py-1 text-xs" defaultValue={promoState.loginBackground?.desktop || ''} />
                      <input
                        type="file"
                        accept="image/*"
                        className="mt-1 w-full border rounded px-2 py-1 text-[11px]"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const form = e.currentTarget.form as HTMLFormElement | null;
                          if (!form) return;
                          const input = form.querySelector<HTMLInputElement>('#loginDesktop');
                          try {
                            if (input) input.value = 'Uploading...';
                            const url = await uploadFile(file);
                            if (input) input.value = url;
                          } catch (err) {
                            if (input) input.value = '';
                            // eslint-disable-next-line no-console
                            console.error('upload error', err);
                            alert('Échec de l\'upload');
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" htmlFor="loginMobile">Mobile</label>
                      <input id="loginMobile" name="loginMobile" className="w-full border rounded px-2 py-1 text-xs" defaultValue={promoState.loginBackground?.mobile || ''} />
                      <input
                        type="file"
                        accept="image/*"
                        className="mt-1 w-full border rounded px-2 py-1 text-[11px]"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const form = e.currentTarget.form as HTMLFormElement | null;
                          if (!form) return;
                          const input = form.querySelector<HTMLInputElement>('#loginMobile');
                          try {
                            if (input) input.value = 'Uploading...';
                            const url = await uploadFile(file);
                            if (input) input.value = url;
                          } catch (err) {
                            if (input) input.value = '';
                            // eslint-disable-next-line no-console
                            console.error('upload error', err);
                            alert('Échec de l\'upload');
                          }
                        }}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs mb-1" htmlFor="loginFallback">Fallback (CSV)</label>
                      <input id="loginFallback" name="loginFallback" className="w-full border rounded px-2 py-1 text-xs" defaultValue={(promoState.loginBackground?.fallback||[]).join(',')} />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs mb-1" htmlFor="loginAlt">Texte alternatif (accessibilité)</label>
                      <input id="loginAlt" name="loginAlt" className="w-full border rounded px-2 py-1 text-xs" defaultValue={promoState.loginBackground?.alt || ''} />
                    </div>
                  </div>
                </fieldset>
                <fieldset className="border rounded p-4 space-y-3">
                  <legend className="text-sm font-medium px-2">Fonds des pages</legend>
                  <p className="text-[11px] text-gray-500 mb-1">
                    Vous pouvez soit coller une URL d'image, soit sélectionner un fichier depuis votre ordinateur.
                  </p>
                  {['home','showroom','galeries','story','admin'].map(key => (
                    <div key={key} className="grid gap-2 md:grid-cols-6 items-end">
                      <span className="text-xs font-semibold md:col-span-1 capitalize">{key}</span>
                      {/* Desktop URL */}
                      <input
                        placeholder="Desktop URL"
                        name={`bg${key.charAt(0).toUpperCase()+key.slice(1)}Desktop`}
                        className="border rounded px-2 py-1 text-xs"
                        defaultValue={promoState.pageBackgrounds?.[key]?.desktop || ''}
                      />
                      {/* Desktop file */}
                      <input
                        type="file"
                        accept="image/*"
                        className="border rounded px-2 py-1 text-[11px] md:col-span-1"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const form = e.currentTarget.form as HTMLFormElement | null;
                          if (!form) return;
                          const input = form.querySelector<HTMLInputElement>(`input[name="bg${key.charAt(0).toUpperCase()+key.slice(1)}Desktop"]`);
                          try {
                            if (input) input.value = 'Uploading...';
                            const url = await uploadFile(file);
                            if (input) input.value = url;
                          } catch (err) {
                            if (input) input.value = '';
                            // eslint-disable-next-line no-console
                            console.error('upload error', err);
                            alert('Échec de l\'upload');
                          }
                        }}
                      />
                      {/* Mobile URL */}
                      <input
                        placeholder="Mobile URL"
                        name={`bg${key.charAt(0).toUpperCase()+key.slice(1)}Mobile`}
                        className="border rounded px-2 py-1 text-xs"
                        defaultValue={promoState.pageBackgrounds?.[key]?.mobile || ''}
                      />
                      {/* Mobile file */}
                      <input
                        type="file"
                        accept="image/*"
                        className="border rounded px-2 py-1 text-[11px] md:col-span-1"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const form = e.currentTarget.form as HTMLFormElement | null;
                          if (!form) return;
                          const input = form.querySelector<HTMLInputElement>(`input[name="bg${key.charAt(0).toUpperCase()+key.slice(1)}Mobile"]`);
                          try {
                            if (input) input.value = 'Uploading...';
                            const url = await uploadFile(file);
                            if (input) input.value = url;
                          } catch (err) {
                            if (input) input.value = '';
                            // eslint-disable-next-line no-console
                            console.error('upload error', err);
                            alert('Échec de l\'upload');
                          }
                        }}
                      />
                      {/* Fallback CSV + Alt */}
                      <input
                        placeholder="Fallback CSV"
                        name={`bg${key.charAt(0).toUpperCase()+key.slice(1)}Fallback`}
                        className="border rounded px-2 py-1 text-xs md:col-span-1"
                        defaultValue={(promoState.pageBackgrounds?.[key]?.fallback || []).join(',')}
                      />
                      <input
                        placeholder="Alt"
                        name={`bg${key.charAt(0).toUpperCase()+key.slice(1)}Alt`}
                        className="border rounded px-2 py-1 text-xs md:col-span-1"
                        defaultValue={promoState.pageBackgrounds?.[key]?.alt || ''}
                      />
                    </div>
                  ))}
                </fieldset>
                <fieldset className="border rounded p-4 space-y-2">
                  <legend className="text-sm font-medium px-2">Stickers (JSON array)</legend>
                  <textarea name="stickers" className="w-full border rounded px-2 py-1 text-xs h-32" defaultValue={JSON.stringify(promoState.stickers || [], null, 2)} />
                  <p className="text-[11px] text-gray-500">Format: [{'{'}"id":"sticker-new","text":"Nouveau","imageUrl":"https://..."{'}'}]</p>
                </fieldset>
                <div className="flex gap-3">
                  <button className="btn-primary px-4 py-2">Enregistrer</button>
                  <button type="button" className="px-4 py-2 border rounded" onClick={(ev) => {
                    const form = (ev.currentTarget as HTMLButtonElement).closest('form') as HTMLFormElement;
                    if (!form) return;
                    const fd = new FormData(form);
                    const parseCsv = (v: any) => String(v || '').split(',').map(s=>s.trim()).filter(Boolean);
                    const preview: any = {
                      bannerText: String(fd.get('bannerText') || ''),
                      voucherText: String(fd.get('voucherText') || ''),
                      stickers: (() => { try { const p = JSON.parse(String(fd.get('stickers')||'[]')); return Array.isArray(p) ? p : []; } catch { return []; } })(),
                      loginBackground: {
                        desktop: String(fd.get('loginDesktop')||'').trim() || undefined,
                        mobile: String(fd.get('loginMobile')||'').trim() || undefined,
                        fallback: parseCsv(fd.get('loginFallback')) || undefined,
                        alt: String(fd.get('loginAlt')||'').trim() || undefined,
                      },
                      pageBackgrounds: {
                        home: { desktop: String(fd.get('bgHomeDesktop')||'').trim() || undefined, mobile: String(fd.get('bgHomeMobile')||'').trim() || undefined, fallback: parseCsv(fd.get('bgHomeFallback')) || undefined, alt: String(fd.get('bgHomeAlt')||'').trim() || undefined },
                        showroom: { desktop: String(fd.get('bgShowroomDesktop')||'').trim() || undefined, mobile: String(fd.get('bgShowroomMobile')||'').trim() || undefined, fallback: parseCsv(fd.get('bgShowroomFallback')) || undefined, alt: String(fd.get('bgShowroomAlt')||'').trim() || undefined },
                        galeries: { desktop: String(fd.get('bgGaleriesDesktop')||'').trim() || undefined, mobile: String(fd.get('bgGaleriesMobile')||'').trim() || undefined, fallback: parseCsv(fd.get('bgGaleriesFallback')) || undefined, alt: String(fd.get('bgGaleriesAlt')||'').trim() || undefined },
                        story: { desktop: String(fd.get('bgStoryDesktop')||'').trim() || undefined, mobile: String(fd.get('bgStoryMobile')||'').trim() || undefined, fallback: parseCsv(fd.get('bgStoryFallback')) || undefined, alt: String(fd.get('bgStoryAlt')||'').trim() || undefined },
                        admin: { desktop: String(fd.get('bgAdminDesktop')||'').trim() || undefined, mobile: String(fd.get('bgAdminMobile')||'').trim() || undefined, fallback: parseCsv(fd.get('bgAdminFallback')) || undefined, alt: String(fd.get('bgAdminAlt')||'').trim() || undefined },
                      }
                    };
                    setPreviewState(preview);
                  }}>Prévisualiser</button>
                </div>

                {previewState && (
                  <div className="mt-6 grid md:grid-cols-2 gap-6">
                    <div className="border rounded overflow-hidden">
                      <div className="flex items-center justify-between p-2 border-b bg-gray-50">
                        <span className="text-sm font-medium">Aperçu fond de page</span>
                        <select className="text-sm border rounded px-2 py-1" value={previewPageKey} onChange={e=>setPreviewPageKey(e.target.value)}>
                          {['home','showroom','galeries','story','admin'].map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                      </div>
                      <div className="relative h-48">
                        {(() => {
                          const cfg = previewState.pageBackgrounds?.[previewPageKey] || {};
                          const cand = [cfg.desktop, cfg.mobile, ...(cfg.fallback||[])].filter(Boolean)[0];
                          return cand ? (
                            <img src={cand} alt={cfg.alt||''} className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
                          );
                        })()}
                        <div className="absolute inset-0 bg-black/35" />
                        <div className="absolute bottom-2 left-2 text-xs px-2 py-1 rounded bg-white/80 text-gray-700">Alt: {previewState.pageBackgrounds?.[previewPageKey]?.alt || '—'}</div>
                      </div>
                    </div>
                    <div className="border rounded overflow-hidden">
                      <div className="p-2 border-b bg-gray-50 text-sm font-medium">Aperçu stickers</div>
                      <div className="relative h-48 bg-white">
                        <img src={previewState.pageBackgrounds?.home?.desktop || previewState.pageBackgrounds?.home?.mobile || (previewState.pageBackgrounds?.home?.fallback||[])[0] || '/placeholder.png'} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                        <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
                          {(previewState.stickers||[]).map((s: any) => (
                            s.imageUrl ? <img key={s.id} src={s.imageUrl} alt={s.text||s.id} className="h-8 w-8 object-contain drop-shadow" /> : <span key={s.id} className="inline-block text-[10px] px-2 py-1 rounded-full bg-black/80 text-white">{s.text||s.id}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        )}

        {tab === 'ads' && (
          <div className="bg-white/95 text-charcoal p-6 rounded shadow max-w-2xl">
            <h2 className="font-semibold mb-4">Publicités (bandeau discret)</h2>
            {promoLoading && <div>Chargement...</div>}
            {promoState && (
              <form className="space-y-6" onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget as HTMLFormElement);
                const body: any = {
                  adBanner: {
                    active: fd.get('adActive') === 'on',
                    text: String(fd.get('adText') || ''),
                    link: (String(fd.get('adLink') || '').trim() || undefined),
                  },
                  adBanners: (() => {
                    const raw = String(fd.get('adBanners') || '').trim();
                    if (!raw) return promoState.adBanners || [];
                    try {
                      const parsed = JSON.parse(raw);
                      if (Array.isArray(parsed)) return parsed;
                    } catch {/* ignore */}
                    return promoState.adBanners || [];
                  })()
                };
                const res = await fetch(apiUrl('/api/promotions/admin'), {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify(body),
                });
                if (res.ok) setPromoState(await res.json());
              }}>
                <div className="flex items-center gap-2">
                  <input id="adActive" name="adActive" type="checkbox" defaultChecked={!!promoState.adBanner?.active} />
                  <label htmlFor="adActive">Activer la publicité</label>
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor="adText">Texte</label>
                  <input id="adText" name="adText" className="w-full border rounded px-3 py-2" defaultValue={promoState.adBanner?.text || ''} />
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor="adLink">Lien (optionnel)</label>
                  <input id="adLink" name="adLink" className="w-full border rounded px-3 py-2" defaultValue={promoState.adBanner?.link || ''} />
                </div>
                <fieldset className="border rounded p-4 space-y-2">
                  <legend className="text-sm font-medium px-2">Multiples publicités (JSON)</legend>
                  <textarea
                    name="adBanners"
                    className="w-full border rounded px-2 py-1 text-xs h-32"
                    defaultValue={JSON.stringify(promoState.adBanners || [], null, 2)}
                    placeholder='[
  {"id":"ad-1","active":true,"text":"Annonce 1","link":"https://exemple.com"}
]'
                  />
                  <p className="text-[11px] text-gray-500">Format: [{'{'}"id":"ad-1","active":true,"text":"Votre texte","link":"https://..."{'}'}]</p>
                </fieldset>
                <div className="flex gap-3">
                  <button className="btn-primary px-4 py-2">Enregistrer</button>
                </div>
              </form>
            )}
            {!promoState && !promoLoading && (
              <div className="text-sm text-gray-600">Aucune configuration de promotion chargée.</div>
            )}
          </div>
        )}
      </div>
        </PageBackground>
      </ProtectedRoute>
    </ErrorBoundary>
  );
};

export default AdminPage;
