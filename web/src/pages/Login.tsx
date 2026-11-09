import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { api } from '../api';
import { useAuth } from '../auth';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [f, setF] = useState({ email: '', password: '', name: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/app" replace />;

  const done = (r: any) => { login(r); nav('/app'); };
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { done(await api(`/auth/${mode}`, { body: f })); } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="auth">
      <Link to="/" className="logo" style={{ justifyContent: 'center', marginBottom: 20 }}><i />HeartPost</Link>
      <div className="card">
        <div className="tabs2">
          <button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Đăng nhập</button>
          <button className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}>Tạo tài khoản</button>
        </div>
        {import.meta.env.VITE_GOOGLE_CLIENT_ID && <><div style={{ display: 'grid', placeItems: 'center' }}>
          <GoogleLogin theme="filled_black" shape="pill" onSuccess={async (c) => {
            try { done(await api('/auth/google', { body: { credential: c.credential } })); } catch (x: any) { setErr(x.message); }
          }} onError={() => setErr('Đăng nhập Google thất bại')} />
        </div>
        <div className="sep">— hoặc dùng email —</div></>}
        <form onSubmit={submit}>
          {mode === 'register' && <label className="f">Tên hiển thị<input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>}
          <label className="f">Email<input className="input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          <label className="f">Mật khẩu<input className="input" type="password" minLength={6} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
          {err && <div className="err">{err}</div>}
          <button className="btn" style={{ width: '100%' }} disabled={busy}>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</button>
        </form>
      </div>
    </div>
  );
}
