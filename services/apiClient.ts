/// <reference types="vite/client" />
// Centralized API base URL for frontend requests
// Set VITE_API_BASE_URL to something like https://api.malafaareh.com for production
const RAW_BASE = import.meta.env?.VITE_API_BASE_URL || '';
export const API_BASE = RAW_BASE.endsWith('/') ? RAW_BASE.slice(0, -1) : RAW_BASE;

export function apiUrl(path: string) {
  if (!path.startsWith('/')) path = `/${path}`;
  return `${API_BASE}${path}`;
}
