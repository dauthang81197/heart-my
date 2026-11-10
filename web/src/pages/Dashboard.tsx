import { useCallback, useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api, Letter, money } from '../api';
import { useAuth } from '../auth';
import { useI18n } from '../i18n';
import Envelope from '../components/Envelope';
import StampShop from '../components/StampShop';
import { useUI } from '../components/UI';

const TYPES = [
  { k: 'PRIVATE', e: '💌', t: 'Gửi cho một người', d: 'Thư riêng tư, chỉ người nhận qua email mới mở được.' },
  { k: 'PUBLIC', e: '🌍', t: 'Gửi công khai', d: 'Đăng lên tường thư chung để mọi người cùng đọc.' },
  { k: 'FUTURE', e: '⏳', t: 'Gửi cho tương lai', d: 'Hẹn ngày giờ, thư sẽ tự động được gửi đến.' },
];

function WriteModal({ onClose }: { onClose: () => void }) {
  const nav = useNavigate();
  const pick = async (type: string) => { const l = await api<Letter>('/letters', { body: { type } }); nav(`/editor/${l.id}`); };
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: 0 }}>Bạn muốn viết thư như thế nào?</h3>
        <div className="opts">
          {TYPES.map((o) => <button key={o.k} className="opt" onClick={() => pick(o.k)}><em>{o.e}</em><div><b>{o.t}</b><span>{o.d}</span></div></button>)}
        </div>
      </div>
    </div>
  );
}

const statusLabel = { DRAFT: 'Bản nháp', SCHEDULED: 'Đã hẹn giờ', SENT: 'Đã gửi' } as const;

function LetterGrid({ letters, onDelete }: { letters: Letter[]; onDelete: (id: string) => void }) {
  const nav = useNavigate();
  const { toast, confirm } = useUI();
  if (!letters.length) return <p className="muted">Chưa có thư nào.</p>;
  return (
    <div className="grid">
      {letters.map((l) => (
        <div key={l.id} className="card letter-card" onClick={() => nav(l.status === 'DRAFT' ? `/editor/${l.id}` : `/l/${l.shareToken}`)}>
          <Envelope design={l.design} size={150} stamp={l.stamp?.image} />
          <div><b>{l.title || 'Thư chưa đặt tên'}</b></div>
          <div className="muted" style={{ fontSize: '.82rem' }}>{l.recipientEmail ?? (l.type === 'PUBLIC' ? 'Công khai' : 'Chưa có người nhận')}{l.deliverAt && ` · ${new Date(l.deliverAt).toLocaleString('vi-VN')}`}</div>
          <div className="row" style={{ justifyContent: 'space-between', width: '100%' }}>
            <span className={'badge ' + l.status}>{statusLabel[l.status]}</span>
            {l.status !== 'DRAFT' && <button className="btn ghost sm" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${location.origin}/l/${l.shareToken}`); toast('Đã sao chép link'); }}>Sao chép link</button>}
            {l.status === 'DRAFT' && <button className="btn danger sm" onClick={async (e) => { e.stopPropagation(); if (await confirm({ message: 'Xoá thư này?', danger: true, okText: 'Xoá' })) onDelete(l.id); }}>Xoá</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

function Vault() {
  const [tab, setTab] = useState<'mine' | 'inbox' | 'public'>('mine');
  const [mine, setMine] = useState<Letter[]>([]);
  const [inbox, setInbox] = useState<Letter[]>([]);
  const [feed, setFeed] = useState<Letter[]>([]);
  const load = useCallback(() => { api('/letters').then(setMine); api('/letters/inbox').then(setInbox); api('/letters/public/feed').then(setFeed); }, []);
  useEffect(load, [load]);
  return (
    <>
      <div className="tabs2" style={{ maxWidth: 420 }}>
        {([['mine', 'Thư của tôi'], ['inbox', 'Thư nhận'], ['public', 'Tường thư']] as const).map(([k, n]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{n}</button>)}
      </div>
      {tab === 'mine' && <LetterGrid letters={mine} onDelete={(id) => api(`/letters/${id}`, { method: 'DELETE' }).then(load)} />}
      {tab === 'inbox' && <>{!inbox.length && <p className="muted">Hộp thư nhận chỉ hiện với tài khoản đã xác minh email. Hãy đăng nhập bằng Google để xem thư gửi tới email của bạn.</p>}<LetterGrid letters={inbox} onDelete={() => {}} /></>}
      {tab === 'public' && <LetterGrid letters={feed} onDelete={() => {}} />}
    </>
  );
}

function Overview() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [stamps, setStamps] = useState<any[]>([]);
  useEffect(() => { api('/letters').then(setLetters); api('/stamps/mine').then(setStamps); }, []);
  const n = (s: string) => letters.filter((l) => l.status === s).length;
  const total = stamps.reduce((a, s) => a + s.quantity, 0);
  return (
    <div className="grid">
      {[['Bản nháp', n('DRAFT')], ['Đã gửi', n('SENT')], ['Hẹn giờ', n('SCHEDULED')], ['Tem còn lại', total]].map(([k, v]) => (
        <div key={k} className="card"><div className="muted">{k}</div><div style={{ fontSize: '2.2rem', fontWeight: 300, color: 'var(--acc)' }}>{v}</div></div>
      ))}
    </div>
  );
}

function StampsPage() {
  const [mine, setMine] = useState<any[]>([]);
  const load = () => api('/stamps/mine').then(setMine);
  useEffect(() => { load(); }, []);
  return (
    <>
      <h3>Tem của bạn</h3>
      {mine.length ? <div className="chips" style={{ marginBottom: 24 }}>{mine.map((m) => <span key={m.id} className="chip t">{m.stamp.image} {m.stamp.name} × {m.quantity}</span>)}</div> : <p className="muted">Bạn chưa có tem nào.</p>}
      <h3>Mua tem · thanh toán VietQR</h3>
      <StampShop onChanged={load} />
    </>
  );
}

function Settings() {
  const { user, logout, refresh } = useAuth();
  const { lang, setLang } = useI18n();
  const [name, setName] = useState(user?.name ?? '');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const save = async () => {
    try { await api('/users/me', { method: 'PATCH', body: { name, locale: lang, ...(pw ? { password: pw } : {}) } }); setPw(''); setMsg('Đã lưu ✓'); refresh(); } catch (e: any) { setMsg(e.message); }
  };
  return (
    <div className="card" style={{ maxWidth: 460 }}>
      <label className="f">Email<input className="input" value={user?.email} disabled /></label>
      <label className="f">Tên hiển thị<input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label className="f">{user?.hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu (để đăng nhập bằng email)'}<input className="input" type="password" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} /></label>
      <label className="f">Ngôn ngữ<select className="input" value={lang} onChange={(e) => setLang(e.target.value as any)}><option value="vi">Tiếng Việt</option><option value="en">English</option></select></label>
      <div className="row"><button className="btn" onClick={save}>Lưu</button><button className="btn ghost" onClick={logout}>Đăng xuất</button><span className="muted">{msg}</span></div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useI18n();
  const loc = useLocation();
  const [sp, setSp] = useSearchParams();
  const [writing, setWriting] = useState(sp.get('new') === '1');
  const { user } = useAuth();
  const items = [['/app', '🏠', t('overview')], ['/app/vault', '📬', t('vault')], ['/app/stamps', '🏷️', t('stamps')], ['/app/settings', '⚙️', t('settings')]];
  const close = () => { setWriting(false); sp.delete('new'); setSp(sp, { replace: true }); };
  return (
    <div className="shell">
      <aside className="side">
        <Link to="/" className="logo" style={{ padding: '0 8px 18px' }}><i />HeartPost</Link>
        <button className="btn" onClick={() => setWriting(true)} style={{ marginBottom: 12 }}>✍️ {t('write')}</button>
        {items.map(([to, ic, n]) => <Link key={to} to={to} className={'item' + (loc.pathname === to ? ' on' : '')}>{ic} {n}</Link>)}
        <div className="spacer" />
        {user?.role === 'ADMIN' && <Link to="/admin" className="item">🛠 Quản trị</Link>}
        <div className="muted" style={{ padding: 8, fontSize: '.85rem' }}>{user?.name}</div>
      </aside>
      <main className="main">
        <div className="topbar"><h2>{items.find(([to]) => to === loc.pathname)?.[2]}</h2><button className="btn" onClick={() => setWriting(true)}>✍️ {t('write')}</button></div>
        <Routes>
          <Route index element={<Overview />} />
          <Route path="vault" element={<Vault />} />
          <Route path="stamps" element={<StampsPage />} />
          <Route path="settings" element={<Settings />} />
        </Routes>
      </main>
      <nav className="bottombar">{items.map(([to, ic, n]) => <Link key={to} to={to} className={loc.pathname === to ? 'on' : ''}><b>{ic}</b>{n}</Link>)}</nav>
      {writing && <WriteModal onClose={close} />}
    </div>
  );
}
