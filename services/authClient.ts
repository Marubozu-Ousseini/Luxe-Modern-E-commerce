import { apiUrl } from './apiClient';
export async function login(email: string, password: string) {
  const res = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Identifiants invalides');
  return res.json();
}

export async function register(name: string, email: string, password: string, phone?: string, town?: string) {
  const payload: any = { name, email, password };
  if (phone) payload.phone = phone;
  if (town) payload.town = town;
  const res = await fetch(apiUrl('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Inscription échouée');
  return res.json();
}

export async function logout() {
  await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
}
