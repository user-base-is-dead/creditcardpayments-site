// Lightweight API client for the CreditCardPay backend.
//
// In development, Vite proxies `/api` and `/socket.io` to the backend (:4000),
// so relative URLs work with no CORS setup. To point at a different host in
// production, set VITE_API_URL (e.g. "https://api.example.com").

const API_BASE = import.meta.env.VITE_API_URL || '';

const TOKEN_KEY = 'ccp_auth_token';
const USER_KEY = 'ccp_auth_user';
const ADMIN_TOKEN_KEY = 'ccp_admin_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable — ignore */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Clear any in-progress money-transfer form so it never leaks to the next user.
    sessionStorage.removeItem('ccp_transfer_state_v1');
  } catch {
    /* ignore */
  }
}

export function isAuthenticated() {
  return Boolean(getToken());
}

// ─── Admin session (kept separate from the regular user session) ───
export function getAdminToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token) {
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearAdminToken() {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function isAdminAuthenticated() {
  return Boolean(getAdminToken());
}

/** Error thrown for non-2xx responses; carries status + optional field details. */
export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details || null;
  }
}

async function request(path, { method = 'GET', body, auth = false, adminAuth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } else if (adminAuth) {
    const token = getAdminToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Network error. Please check your connection and try again.', 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty/non-JSON body */
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status}).`;
    throw new ApiError(message, res.status, data && data.details);
  }
  return data;
}

export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me', { auth: true }),
};

export const contactApi = {
  submit: (payload) => request('/contact', { method: 'POST', body: payload }),
};

export const transferApi = {
  create: (payload) => request('/transfers', { method: 'POST', body: payload, auth: true }),
  get: (id) => request(`/transfers/${encodeURIComponent(id)}`),
  verifyOtp: (id, otp) =>
    request(`/transfers/${encodeURIComponent(id)}/verify-otp`, { method: 'POST', body: { otp } }),
  my: () => request('/transfers/my', { auth: true }),
};

export const adminApi = {
  login: (payload) => request('/admin/login', { method: 'POST', body: payload }),
  stats: () => request('/admin/stats', { adminAuth: true }),
  users: () => request('/admin/users', { adminAuth: true }),
  transfers: () => request('/admin/transfers', { adminAuth: true }),
  contacts: () => request('/admin/contacts', { adminAuth: true }),
  approveTransfer: (id) =>
    request(`/admin/transfers/${encodeURIComponent(id)}/approve`, { method: 'POST', adminAuth: true }),
  rejectTransfer: (id, reason) =>
    request(`/admin/transfers/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      body: { reason },
      adminAuth: true,
    }),
  completeTransfer: (id) =>
    request(`/admin/transfers/${encodeURIComponent(id)}/complete`, { method: 'POST', adminAuth: true }),
};
