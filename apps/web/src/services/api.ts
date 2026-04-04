const API_BASE = import.meta.env.VITE_API_URL || '/api';

/** FastAPI may return detail as a string, object, or array of validation errors */
function formatApiErrorBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const parts = detail.map((item) => {
      if (item && typeof item === 'object' && 'msg' in item) {
        return String((item as { msg: string }).msg);
      }
      return JSON.stringify(item);
    });
    return parts.filter(Boolean).join(' ') || fallback;
  }
  if (detail && typeof detail === 'object' && 'msg' in detail) {
    return String((detail as { msg: string }).msg);
  }
  return fallback;
}

interface TokenPair {
  access_token: string;
  refresh_token: string;
  username: string;
}

function getTokens(): TokenPair | null {
  const raw = localStorage.getItem('auth_tokens');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setTokens(tokens: TokenPair): void {
  localStorage.setItem('auth_tokens', JSON.stringify(tokens));
}

function clearTokens(): void {
  localStorage.removeItem('auth_tokens');
}

let refreshPromise: Promise<TokenPair | null> | null = null;

async function refreshTokens(): Promise<TokenPair | null> {
  const current = getTokens();
  if (!current?.refresh_token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: current.refresh_token }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const data: TokenPair = await res.json();
    setTokens(data);
    return data;
  } catch {
    clearTokens();
    return null;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const tokens = getTokens();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (tokens?.access_token) {
    headers['Authorization'] = `Bearer ${tokens.access_token}`;
  }

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && tokens?.refresh_token) {
    if (!refreshPromise) {
      refreshPromise = refreshTokens();
    }
    const newTokens = await refreshPromise;
    refreshPromise = null;

    if (newTokens) {
      headers['Authorization'] = `Bearer ${newTokens.access_token}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } else {
      window.dispatchEvent(new Event('auth:logout'));
      throw new Error('Session expired');
    }
  }

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(formatApiErrorBody(body, `API error ${res.status}`));
  }

  return res.json();
}

export async function apiLogin(username: string, password: string): Promise<TokenPair> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(formatApiErrorBody(body, 'Login failed'));
  }
  const data: TokenPair = await res.json();
  setTokens(data);
  return data;
}

export async function apiRegister(username: string, password: string): Promise<TokenPair> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(formatApiErrorBody(body, 'Registration failed'));
  }
  const data: TokenPair = await res.json();
  setTokens(data);
  return data;
}

export async function apiLogout(): Promise<void> {
  const tokens = getTokens();
  if (tokens?.refresh_token) {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    }).catch(() => {});
  }
  clearTokens();
}

export function getStoredTokens(): TokenPair | null {
  return getTokens();
}

export function apiBlobFetch(path: string): Promise<Response> {
  const tokens = getTokens();
  const headers: Record<string, string> = {};
  if (tokens?.access_token) {
    headers['Authorization'] = `Bearer ${tokens.access_token}`;
  }
  return fetch(`${API_BASE}${path}`, { headers });
}
