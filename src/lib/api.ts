// Клиент для API volonter.by

const TOKEN_KEY = 'vb_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string | null) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, 'Нет связи с сервером. Проверьте интернет.');
  }
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* пусто */
  }
  if (!res.ok) {
    throw new ApiError(res.status, data?.error || 'Что-то пошло не так. Попробуйте ещё раз.');
  }
  return data as T;
}

export const api = {
  register: (payload: any) => request<any>('POST', '/api/register', payload),
  login: (email: string, password: string) => request<any>('POST', '/api/login', { email, password }),
  logout: () => request<any>('POST', '/api/logout'),
  me: () => request<{ user: any }>('GET', '/api/me'),

  stats: () => request<{ stats: { volunteers: number; activeRequests: number; helpDone: number; topCity: string } }>('GET', '/api/stats'),

  volunteers: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
    const s = qs.toString();
    return request<{ volunteers: any[] }>('GET', `/api/volunteers${s ? '?' + s : ''}`);
  },
  volunteer: (id: number) => request<{ volunteer: any; reviews: any[] }>('GET', `/api/volunteers/${id}`),

  requests: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
    const s = qs.toString();
    return request<{ requests: any[] }>('GET', `/api/requests${s ? '?' + s : ''}`);
  },
  request: (id: number) => request<{ request: any }>('GET', `/api/requests/${id}`),
  createRequest: (payload: any) => request<any>('POST', '/api/requests', payload),
  updateRequestStatus: (id: number, status: string) => request<any>('PATCH', `/api/requests/${id}`, { status }),
  respond: (id: number, message: string) => request<any>('POST', `/api/requests/${id}/respond`, { message }),

  responseAction: (id: number, action: string, extra: any = {}) => request<any>('PATCH', `/api/responses/${id}`, { action, ...extra }),
  cancelResponse: (id: number) => request<any>('PATCH', `/api/responses/${id}`, { action: 'cancel' }),

  myRequests: () => request<{ requests: any[] }>('GET', '/api/my/requests'),
  myResponses: () => request<{ responses: any[] }>('GET', '/api/my/responses'),
  updateProfile: (payload: any) => request<any>('PATCH', '/api/profile', payload),

  messages: (peer?: number) => request<{ messages: any[] }>('GET', `/api/messages${peer ? '?peer=' + peer : ''}`),
  sendMessage: (toUser: number, text: string, requestId?: number) => request<any>('POST', '/api/messages', { to_user: toUser, text, request_id: requestId }),
  inbox: () => request<{ conversations: any[] }>('GET', '/api/inbox'),
};
