import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api';

type User = { id: string; email: string; name: string; avatar?: string; locale: string; role?: string; hasPassword?: boolean };
const Ctx = createContext<{ user: User | null; loading: boolean; login: (r: { token: string; user: User }) => void; logout: () => void; refresh: () => Promise<void> }>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!getToken());
  const refresh = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try { setUser(await api('/users/me')); } catch { setUser(null); } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const login = (r: { token: string; user: User }) => { setToken(r.token); setUser(r.user); };
  const logout = () => { setToken(null); setUser(null); };
  return <Ctx.Provider value={{ user, loading, login, logout, refresh }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
