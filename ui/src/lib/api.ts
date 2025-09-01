export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function apiFetch(path: string, init?: RequestInit) {
  const url = `${API_BASE_URL}${path}`;
  return fetch(url, { credentials: 'include', ...init });
}


