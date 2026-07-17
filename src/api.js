const BASE = '/api';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('auth_token');
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${BASE}${path}`, {
    headers: options.body instanceof FormData
      ? { ...authHeader, ...options.headers }
      : { 'Content-Type': 'application/json', ...authHeader, ...options.headers },
    ...options,
    body: options.body && !(options.body instanceof FormData)
      ? JSON.stringify(options.body)
      : options.body,
  });
  if (res.status === 401) {
    // Sesiune expirata sau invalida -> deconectare
    localStorage.removeItem('auth_token');
    if (window.location.pathname !== '/login') window.location.href = '/login';
    throw new Error('Sesiune expirata');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Eroare server' }));
    throw new Error(err.error || 'Eroare necunoscuta');
  }
  return res.json();
}

export const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: 'POST', body }),
  put: (path, body) => apiFetch(path, { method: 'PUT', body }),
  patch: (path, body) => apiFetch(path, { method: 'PATCH', body }),
  delete: (path) => apiFetch(path, { method: 'DELETE' }),
  upload: (path, formData) => apiFetch(path, {
    method: 'POST',
    body: formData,
  }),
};
