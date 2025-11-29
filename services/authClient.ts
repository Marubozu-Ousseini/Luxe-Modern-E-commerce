import { apiUrl } from './apiClient';

let idToken: string | null = null;

export function setIdToken(token: string | null) {
  idToken = token;
}

function withAuthHeaders(init: RequestInit = {}) {
  const headers: any = { ...(init.headers || {}) };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  return { ...init, headers, credentials: 'include' } as RequestInit;
}

export async function login(email: string, password: string) {
  const res = await fetch(apiUrl('/api/auth/login'), withAuthHeaders({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }));
  if (!res.ok) throw new Error('Identifiants invalides');
  return res.json();
}

export async function register(name: string, email: string, password: string, phone?: string, town?: string) {
  const payload: any = { name, email, password };
  if (phone) payload.phone = phone;
  if (town) payload.town = town;
  const res = await fetch(apiUrl('/api/auth/register'), withAuthHeaders({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }));
  if (!res.ok) throw new Error('Inscription échouée');
  return res.json();
}

export async function logout() {
  await fetch(apiUrl('/api/auth/logout'), withAuthHeaders({ method: 'POST' }));
}

export default { setIdToken };
