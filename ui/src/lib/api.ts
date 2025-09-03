function normalizeBaseUrl(raw: string): string {
  if (!raw) return '';
  let base = raw.trim();
  // Remove accidental leading characters (e.g., '@')
  base = base.replace(/^@+/, '');
  // Ensure protocol is present; default to https for safety
  if (!/^https?:\/\//i.test(base)) {
    base = `https://${base}`;
  }
  // If the app is served over https, avoid mixed content by upgrading http→https
  if (typeof window !== 'undefined' && window.location?.protocol === 'https:' && /^http:\/\//i.test(base)) {
    base = base.replace(/^http:\/\//i, 'https://');
  }
  // Remove trailing slashes to make URL joining predictable
  base = base.replace(/\/+$/, '');
  return base;
}

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || '');

export function apiFetch(path: string, init?: RequestInit) {
  const url = API_BASE_URL ? new URL(path, API_BASE_URL).toString() : path;
  return fetch(url, { credentials: 'include', ...init });
}


