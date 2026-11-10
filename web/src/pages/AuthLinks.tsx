import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Spinner } from '../components/UI';

const Wrap = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="auth">
    <Link to="/" className="logo" style={{ justifyContent: 'center', marginBottom: 20 }}><i />HeartPost</Link>
    <div className="card"><h2>{title}</h2>{children}</div>
  </div>
);

/** /forgot — nhập email để nhận liên kết đặt lại mật khẩu. */
export function Forgot() {
  const [email, setEmail] = useState(''); const [sent, setSent] = useState(false); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await api('/auth/forgot', { body: { email } }); setSent(true); } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <Wrap title="Quên mật khẩu">
      {sent ? <p>Nếu email <b>{email}</b> đã đăng ký bằng mật khẩu, chúng tôi đã gửi liên kết đặt lại (hiệu lực 30 phút). Hãy kiểm tra cả hộp thư rác.</p> : (
        <form onSubmit={submit}>
          <label className="f">Email<input className="input" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          {err && <div className="err">{err}</div>}
          <button className="btn" style={{ width: '100%' }} disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi liên kết đặt lại'}</button>
        </form>)}
      <p className="muted" style={{ marginTop: 16 }}><Link to="/login">← Quay lại đăng nhập</Link></p>
    </Wrap>
  );
}

/** /reset?token=… — đặt mật khẩu mới. */
export function Reset() {
  const [sp] = useSearchParams(); const nav = useNavigate();
  const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await api('/auth/reset', { body: { token: sp.get('token') ?? '', password: pw } }); setDone(true); setTimeout(() => nav('/login'), 2500); }
    catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <Wrap title="Đặt mật khẩu mới">
      {done ? <p>Đã đổi mật khẩu ✓ Đang chuyển tới trang đăng nhập…</p> : (
        <form onSubmit={submit}>
          <label className="f">Mật khẩu mới (tối thiểu 8 ký tự)<input className="input" type="password" minLength={8} required autoFocus value={pw} onChange={(e) => setPw(e.target.value)} /></label>
          {err && <div className="err">{err}</div>}
          <button className="btn" style={{ width: '100%' }} disabled={busy}>{busy ? 'Đang lưu…' : 'Đổi mật khẩu'}</button>
        </form>)}
    </Wrap>
  );
}

/** /verify?token=… — xác minh email. */
export function Verify() {
  const [sp] = useSearchParams(); const { refresh } = useAuth();
  const [state, setState] = useState<'wait' | 'ok' | 'err'>('wait'); const [msg, setMsg] = useState('');
  useEffect(() => {
    api('/auth/verify', { body: { token: sp.get('token') ?? '' } }).then(() => { setState('ok'); refresh(); }).catch((e) => { setMsg(e.message); setState('err'); });
  }, []);
  if (state === 'wait') return <Spinner />;
  return (
    <Wrap title={state === 'ok' ? 'Đã xác minh email ✓' : 'Không xác minh được'}>
      <p>{state === 'ok' ? 'Email của bạn đã được xác minh. Bạn có thể xem hộp thư nhận trong ứng dụng.' : msg}</p>
      <Link className="btn" to="/app">Vào ứng dụng</Link>
    </Wrap>
  );
}
