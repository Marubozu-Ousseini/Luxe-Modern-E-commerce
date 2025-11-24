import { apiUrl } from './apiClient';

export async function fetchFavorites(): Promise<number[]> {
  const res = await fetch(apiUrl('/api/favorites'), { credentials: 'include' });
  if (!res.ok) throw new Error('Impossible de charger les favoris');
  const data = await res.json();
  return Array.isArray(data.favorites) ? data.favorites : [];
}

export async function toggleFavoriteRemote(productId: number): Promise<number[]> {
  const res = await fetch(apiUrl('/api/favorites/toggle'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ productId })
  });
  if (!res.ok) throw new Error('Impossible de mettre à jour les favoris');
  const data = await res.json();
  return Array.isArray(data.favorites) ? data.favorites : [];
}
