const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      return api(path, options);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const msg = Array.isArray(err.message) ? err.message[0] : err.message;
    throw new Error(msg ?? err.error ?? 'Request failed');
  }
  return res.json();
}

async function refreshToken(): Promise<boolean> {
  const refresh = localStorage.getItem('refreshToken');
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as AuthTokens;
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export const authApi = {
  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    api<AuthTokens>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    api<AuthTokens>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
};

export const ordersApi = {
  list: () => api<Array<{ _id: string; amount: number; discountAmount: number; promocodeId?: string; createdAt: string }>>('/orders'),
  create: (amount: number) =>
    api<{ _id: string }>('/orders', { method: 'POST', body: JSON.stringify({ amount }) }),
  applyPromocode: (orderId: string, code: string) =>
    api<unknown>(`/orders/${orderId}/apply-promocode`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
};

export const promocodesApi = {
  list: () => api<Array<{ _id: string; code: string; discountPercent: number; totalLimit: number; perUserLimit: number; isActive: boolean }>>('/promocodes'),
  create: (data: { code: string; discountPercent: number; totalLimit: number; perUserLimit: number; dateFrom?: string; dateTo?: string }) =>
    api<{ _id: string }>('/promocodes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ discountPercent: number; totalLimit: number; perUserLimit: number; isActive: boolean }>) =>
    api<{ _id: string }>(`/promocodes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivate: (id: string) => api(`/promocodes/${id}`, { method: 'DELETE' }),
};

export interface AnalyticsParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const analyticsApi = {
  users: (params: AnalyticsParams) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return api<PaginatedResponse<{ id: string; email: string; name: string; phone: string; totalOrders: number; totalSpent: number; promoCodesUsed: number }>>(`/analytics/users?${q}`);
  },
  promocodes: (params: AnalyticsParams) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return api<PaginatedResponse<{ id: string; code: string; discountPercent: number; usageCount: number; revenue: number; uniqueUsers: number }>>(`/analytics/promocodes?${q}`);
  },
  promoUsages: (params: AnalyticsParams) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return api<PaginatedResponse<{ id: string; promocodeCode: string; userEmail: string; userName: string; discountAmount: number; usedAt: string }>>(`/analytics/promo-usages?${q}`);
  },
};
