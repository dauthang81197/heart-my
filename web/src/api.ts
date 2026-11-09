const TOKEN_KEY = 'hp_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  if (opts.body) headers['Content-Type'] = 'application/json';
  const res = await fetch('/api' + path, {
    method: opts.method ?? (opts.body || opts.form ? 'POST' : 'GET'),
    headers,
    body: opts.form ?? (opts.body ? JSON.stringify(opts.body) : undefined),
  });
  if (res.status === 401 && t) { setToken(null); location.href = '/login'; }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message[0] : data.message ?? 'Có lỗi xảy ra');
  return data;
}

export type Stamp = { id: string; name: string; image: string; color: string; price: number };
export type Letter = {
  id: string; type: 'PRIVATE' | 'PUBLIC' | 'FUTURE'; status: 'DRAFT' | 'SCHEDULED' | 'SENT';
  title: string; recipientName?: string; recipientEmail?: string; deliverAt?: string; envelope: string;
  design: any; stampId?: string; stamp?: Stamp; shareToken: string; sentAt?: string; updatedAt: string;
  author?: { name: string; avatar?: string };
};
export const money = (n: number) => n.toLocaleString('vi-VN') + 'đ';

export const uploadFile = (blob: Blob, name: string) => {
  const fd = new FormData(); fd.append('file', blob, name);
  return api<{ url: string; kind: 'image' | 'audio' }>('/uploads', { form: fd });
};
