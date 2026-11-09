import { useEffect, useState } from 'react';
import { api, money, Stamp } from '../api';
import { useUI } from './UI';

type Order = { id: string; code: string; amount: number; status: string; qrUrl: string; expiresAt: string; bank: { account: string; name: string } };

export function PayModal({ order, onClose, onPaid }: { order: Order; onClose: () => void; onPaid: () => void }) {
  const { toast } = useUI();
  const [status, setStatus] = useState(order.status);
  useEffect(() => {
    if (status === 'PAID') { onPaid(); return; }
    const iv = setInterval(async () => {
      try { const o = await api<Order>(`/orders/${order.id}`); if (o.status === 'PAID') setStatus('PAID'); } catch { /* retry */ }
    }, 3000);
    return () => clearInterval(iv);
  }, [status]);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{ textAlign: 'center', maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        {status === 'PAID' ? (
          <><div style={{ fontSize: '3rem' }}>✅</div><h3>Thanh toán thành công!</h3><p className="muted">Tem đã được thêm vào kho của bạn.</p><button className="btn" onClick={onClose}>Đóng</button></>
        ) : (
          <>
            <h3 style={{ marginTop: 0 }}>Quét VietQR để thanh toán</h3>
            <img src={order.qrUrl} alt="VietQR" style={{ width: '100%', maxWidth: 300, borderRadius: 12, background: '#fff' }} />
            <p><b>{money(order.amount)}</b></p>
            <p className="muted" style={{ fontSize: '.85rem' }}>Nội dung chuyển khoản (giữ nguyên): <b style={{ color: 'var(--fg)' }}>{order.code}</b><br />Hệ thống tự xác nhận sau vài giây…</p>
            {import.meta.env.DEV && <button className="btn ghost sm" onClick={() => api(`/orders/${order.id}/mock-pay`, { method: 'POST' }).then(() => setStatus('PAID')).catch((e) => toast(e.message, 'error'))}>[DEV] Giả lập đã thanh toán</button>}
            <div><button className="btn ghost sm" style={{ marginTop: 10 }} onClick={onClose}>Huỷ</button></div>
          </>
        )}
      </div>
    </div>
  );
}

export default function StampShop({ onChanged, compact = false }: { onChanged?: () => void; compact?: boolean }) {
  const { toast } = useUI();
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [order, setOrder] = useState<Order | null>(null);
  useEffect(() => { api('/stamps').then(setStamps); }, []);
  const buy = async (s: Stamp) => {
    try { setOrder(await api('/orders', { body: { stampId: s.id, quantity: qty[s.id] ?? 1 } })); } catch (e: any) { toast(e.message, 'error'); }
  };
  return (
    <>
      <div className="grid" style={compact ? { gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))' } : undefined}>
        {stamps.map((s) => (
          <div key={s.id} className="card stamp-card">
            <div className="stampface">{s.image}</div>
            <b>{s.name}</b>
            <div className="muted">{money(s.price)} / tem</div>
            <div className="row" style={{ justifyContent: 'center', margin: '10px 0' }}>
              <select className="input" style={{ width: 90 }} value={qty[s.id] ?? 1} onChange={(e) => setQty({ ...qty, [s.id]: +e.target.value })}>
                {[1, 3, 5, 10, 20].map((n) => <option key={n} value={n}>{n} tem</option>)}
              </select>
            </div>
            <button className="btn sm" onClick={() => buy(s)}>Mua · {money(s.price * (qty[s.id] ?? 1))}</button>
          </div>
        ))}
      </div>
      {order && <PayModal order={order} onClose={() => { setOrder(null); onChanged?.(); }} onPaid={() => onChanged?.()} />}
    </>
  );
}
