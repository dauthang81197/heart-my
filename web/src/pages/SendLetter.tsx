import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, Letter, money, Stamp } from '../api';
import Envelope from '../components/Envelope';
import StampShop from '../components/StampShop';
import { Spinner } from '../components/UI';

export default function SendLetter() {
  const { id } = useParams();
  const nav = useNavigate();
  const [l, setL] = useState<Letter | null>(null);
  const [mine, setMine] = useState<{ stamp: Stamp; quantity: number }[]>([]);
  const [stampId, setStampId] = useState('');
  const [f, setF] = useState({ recipientName: '', recipientEmail: '', deliverAt: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [shop, setShop] = useState(false);

  const loadStamps = () => api('/stamps/mine').then((m) => { setMine(m); setStampId((s) => s || m[0]?.stamp.id || ''); });
  useEffect(() => {
    api<Letter>(`/letters/${id}`).then((x) => {
      setL(x);
      setF({ recipientName: x.recipientName ?? '', recipientEmail: x.recipientEmail ?? '', deliverAt: x.deliverAt ? x.deliverAt.slice(0, 16) : '' });
    });
    loadStamps();
  }, [id]);
  if (!l) return <Spinner />;
  const needRecipient = l.type !== 'PUBLIC';
  const chosen = mine.find((m) => m.stamp.id === stampId)?.stamp;

  const send = async () => {
    setErr(''); setBusy(true);
    try {
      await api(`/letters/${id}`, { method: 'PATCH', body: {
        ...(needRecipient ? { recipientName: f.recipientName || undefined, recipientEmail: f.recipientEmail } : {}),
        ...(l.type === 'FUTURE' ? { deliverAt: new Date(f.deliverAt).toISOString() } : {}),
      } });
      await api(`/letters/${id}/send`, { body: { stampId } });
      nav('/app/vault');
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="auth" style={{ maxWidth: 560 }}>
      <button className="btn ghost sm" onClick={() => nav(`/editor/${id}`)}>← Quay lại chỉnh sửa</button>
      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ display: 'grid', placeItems: 'center', margin: '10px 0 24px' }}><Envelope design={l.design} size={260} stamp={chosen?.image} /></div>
        <h3 style={{ marginTop: 0 }}>{{ PRIVATE: 'Gửi cho một người', PUBLIC: 'Gửi công khai', FUTURE: 'Gửi cho tương lai' }[l.type]}</h3>
        {needRecipient && <>
          <label className="f">Tên người nhận<input className="input" value={f.recipientName} onChange={(e) => setF({ ...f, recipientName: e.target.value })} /></label>
          <label className="f">Email người nhận *<input className="input" type="email" required value={f.recipientEmail} onChange={(e) => setF({ ...f, recipientEmail: e.target.value })} /></label>
        </>}
        {l.type === 'FUTURE' && <label className="f">Ngày giờ gửi *<input className="input" type="datetime-local" value={f.deliverAt} onChange={(e) => setF({ ...f, deliverAt: e.target.value })} /></label>}

        <h4 style={{ margin: '18px 0 8px' }}>Chọn tem (bắt buộc)</h4>
        {mine.length ? <div className="chips">{mine.map((m) => (
          <button key={m.stamp.id} className={'chip t' + (stampId === m.stamp.id ? ' on' : '')} onClick={() => setStampId(m.stamp.id)}>{m.stamp.image} {m.stamp.name} × {m.quantity}</button>))}</div>
          : <p className="muted">Bạn chưa có tem nào. Mua tem bằng VietQR để gửi thư.</p>}
        <button className="btn ghost sm" style={{ marginTop: 10 }} onClick={() => setShop(!shop)}>{shop ? 'Ẩn cửa hàng tem' : '+ Mua thêm tem'}</button>
        {shop && <div style={{ marginTop: 12 }}><StampShop compact onChanged={loadStamps} /></div>}

        {err && <div className="err">{err}</div>}
        <button className="btn" style={{ width: '100%', marginTop: 18 }} disabled={busy || !stampId || (needRecipient && !f.recipientEmail) || (l.type === 'FUTURE' && !f.deliverAt)} onClick={send}>
          {busy ? 'Đang gửi…' : `Gửi thư${chosen ? ' · dùng 1 tem ' + chosen.image : ''}`}
        </button>
      </div>
    </div>
  );
}
