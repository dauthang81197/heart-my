import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, money, Stamp } from '../api';
import { useAuth } from '../auth';
import { useUI } from '../components/UI';
import LetterCanvas from '../components/LetterCanvas';
import { normalizeDesign } from '../design';

export default function Admin() {
  const { confirm } = useUI();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [stamps, setStamps] = useState<(Stamp & { active: boolean })[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [nu, setNu] = useState({ name: '', image: '', price: 5000 });
  const load = useCallback(() => {
    api('/admin/stats').then(setStats); api('/admin/orders').then(setOrders); api('/admin/stamps').then(setStamps); api('/admin/users').then(setUsers); api('/admin/reports').then(setReports);
  }, []);
  useEffect(() => { if (user?.role === 'ADMIN') load(); }, [user]);
  if (user?.role !== 'ADMIN') return <Navigate to="/app" replace />;
  const moderate = (id: string, action: 'HIDE' | 'RESTORE' | 'DISMISS') => api(`/admin/letters/${id}/moderate`, { body: { action } }).then(load);
  const patch = (id: string, d: object) => api(`/admin/stamps/${id}`, { method: 'PATCH', body: d }).then(load);
  return (
    <div className="main" style={{ margin: '0 auto' }}>
      <div className="topbar"><h2>Quản trị</h2><Link className="btn ghost sm" to="/app">← Dashboard</Link></div>
      <div className="grid" style={{ marginBottom: 28 }}>
        {[['Người dùng', stats.users], ['Thư đã gửi', stats.letters], ['Đơn đã thanh toán', stats.paidOrders], ['Doanh thu', money(stats.revenue ?? 0)]].map(([k, v]) => (
          <div key={k as string} className="card"><div className="muted">{k}</div><div style={{ fontSize: '1.8rem', color: 'var(--acc)' }}>{v}</div></div>))}
      </div>
      <h3>Báo cáo vi phạm {reports.length > 0 && <span className="badge" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>{reports.length}</span>}</h3>
      <div className="card" style={{ marginBottom: 28 }}>
        {!reports.length && <span className="muted">Không có báo cáo nào đang chờ.</span>}
        {reports.map(({ letter: l, reports: rs }) => (
          <div key={l.id} className="row" style={{ padding: '12px 0', borderTop: '1px solid var(--line)', alignItems: 'flex-start' }}>
            <div style={{ width: 90 }}><LetterCanvas design={normalizeDesign(l.design, l.envelope)} width={90} /></div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <b>{l.title || 'Thư chưa đặt tên'}</b> {l.hidden && <span className="badge">đang ẩn</span>}
              <div className="muted" style={{ fontSize: '.85rem' }}>{l.author.name} · {l.author.email} · {l.type}</div>
              <div style={{ fontSize: '.85rem', marginTop: 6 }}>{rs.length} báo cáo: {[...new Set(rs.map((r: any) => r.reason))].join(', ')}</div>
              {rs.filter((r: any) => r.note).slice(0, 3).map((r: any) => <div key={r.id} className="muted" style={{ fontSize: '.8rem' }}>“{r.note}”</div>)}
            </div>
            <div className="row">
              <button className="btn danger sm" onClick={() => moderate(l.id, 'HIDE')}>Gỡ thư</button>
              <button className="btn ghost sm" onClick={() => moderate(l.id, 'DISMISS')}>Bỏ qua{l.hidden ? ' & hiện lại' : ''}</button>
            </div>
          </div>))}
      </div>
      <h3>Tem</h3>
      <div className="card" style={{ marginBottom: 28 }}>
        {stamps.map((s) => (
          <div key={s.id} className="row" style={{ padding: '6px 0' }}>
            <span style={{ fontSize: '1.4rem' }}>{s.image}</span><b style={{ flex: 1, minWidth: 100 }}>{s.name}</b>
            <input className="input" style={{ width: 110 }} type="number" defaultValue={s.price} onBlur={(e) => +e.target.value !== s.price && patch(s.id, { price: +e.target.value })} />
            <button className="btn ghost sm" onClick={() => patch(s.id, { active: !s.active })}>{s.active ? 'Đang bán' : 'Đã ẩn'}</button>
          </div>))}
        <div className="row" style={{ marginTop: 12 }}>
          <input className="input" style={{ width: 80 }} placeholder="Emoji" value={nu.image} onChange={(e) => setNu({ ...nu, image: e.target.value })} />
          <input className="input" style={{ flex: 1, minWidth: 120 }} placeholder="Tên tem" value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} />
          <input className="input" style={{ width: 110 }} type="number" value={nu.price} onChange={(e) => setNu({ ...nu, price: +e.target.value })} />
          <button className="btn sm" disabled={!nu.name || !nu.image} onClick={() => api('/admin/stamps', { body: nu }).then(() => { setNu({ name: '', image: '', price: 5000 }); load(); })}>Thêm</button>
        </div>
      </div>
      <h3>Đơn hàng gần đây</h3>
      <div className="card" style={{ marginBottom: 28, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem', minWidth: 560 }}>
          <thead><tr className="muted" style={{ textAlign: 'left' }}><th>Mã</th><th>Email</th><th>SL</th><th>Số tiền</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>{orders.map((o) => (
            <tr key={o.id} style={{ borderTop: '1px solid var(--line)' }}><td>{o.code}</td><td>{o.user.email}</td><td>{o.quantity}</td><td>{money(o.amount)}</td><td>{o.status}</td>
              <td>{o.status !== 'PAID' && <button className="btn ghost sm" onClick={async () => { if (await confirm({ message: `Xác nhận đã nhận ${money(o.amount)}?` })) api(`/admin/orders/${o.id}/confirm`, { method: 'POST' }).then(load); }}>Duyệt tay</button>}</td></tr>))}</tbody>
        </table>
      </div>
      <h3>Người dùng</h3>
      <div className="card">{users.map((u) => <div key={u.id} className="row" style={{ padding: '4px 0' }}><span style={{ flex: 1 }}>{u.name} · <span className="muted">{u.email}</span></span><span className="badge">{u.role}</span></div>)}</div>
    </div>
  );
}
