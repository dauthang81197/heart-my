import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, Letter } from '../api';
import Envelope from '../components/Envelope';
import { Spinner } from '../components/UI';
import LetterCanvas from '../components/LetterCanvas';
import { normalizeDesign, pageCount, W } from '../design';
import { useUI } from '../components/UI';

const REASONS: [string, string][] = [['SPAM', 'Spam / quảng cáo'], ['ABUSE', 'Quấy rối, thù ghét, lăng mạ'], ['ADULT', 'Nội dung nhạy cảm / người lớn'], ['COPYRIGHT', 'Vi phạm bản quyền'], ['OTHER', 'Lý do khác']];

function ReportButton({ token }: { token: string }) {
  const { toast } = useUI();
  const [open, setOpen] = useState(false); const [reason, setReason] = useState('SPAM'); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try { await api(`/letters/report/${token}`, { body: { reason, note: note || undefined } }); toast('Cảm ơn bạn, chúng tôi sẽ xem xét báo cáo'); setOpen(false); } catch (e: any) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  return (
    <>
      <button className="btn ghost sm" style={{ marginTop: 28 }} onClick={() => setOpen(true)}>⚑ Báo cáo thư này</button>
      {open && <div className="modal-bg" onClick={() => setOpen(false)}><div className="modal confirm" style={{ textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Báo cáo thư vi phạm</h3>
        <label className="f">Lý do<select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
        <label className="f">Mô tả thêm (không bắt buộc)<textarea className="input" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} /></label>
        <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn ghost" onClick={() => setOpen(false)}>Huỷ</button><button className="btn" disabled={busy} onClick={send}>Gửi báo cáo</button></div>
      </div></div>}
    </>
  );
}

export default function ViewLetter() {
  const { token } = useParams();
  const [l, setL] = useState<Letter | null>(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [vw, setVw] = useState(window.innerWidth);
  useEffect(() => { api<Letter>(`/letters/view/${token}`).then(setL).catch((e) => setErr(e.message)); }, [token]);
  useEffect(() => { const f = () => setVw(window.innerWidth); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  useEffect(() => { if (open) { const t = setTimeout(() => setShow(true), 1100); return () => clearTimeout(t); } }, [open]);
  if (err) return <div className="center"><div><p>{err}</p><Link className="btn" to="/">Về trang chủ</Link></div></div>;
  if (!l) return <Spinner />;
  const d = normalizeDesign(l.design, l.envelope);
  const cw = Math.min(W, vw - 32);
  const es = Math.min(380, vw - 48);
  return (
    <div className="view">
      <Link to="/" className="logo" style={{ justifyContent: 'center' }}><i />HeartPost</Link>
      <p className="muted">Một lá thư từ <b style={{ color: 'var(--fg)' }}>{l.author?.name}</b></p>
      <div style={{ display: 'grid', placeItems: 'center', margin: `${open ? es * 0.45 : 30}px 0 20px`, transition: 'margin .5s' }}>
        <Envelope design={d} open={open} size={es} stamp={l.stamp?.image} onClick={() => setOpen(true)}
          paper={<LetterCanvas design={d} width={Math.round(es * 0.84)} />} />
      </div>
      {!open && <p className="muted">Chạm vào phong bì để mở</p>}
      {show && <div className="reveal">
        <div style={{ display: 'grid', placeItems: 'center', gap: 22 }}>{Array.from({ length: pageCount(d) }, (_, i) => <div key={i} className="reveal" style={{ animationDelay: `${i * 0.35}s` }}><LetterCanvas design={d} width={cw} page={i} />{pageCount(d) > 1 && <div className="muted" style={{ fontSize: '.8rem', marginTop: 8 }}>Trang {i + 1}/{pageCount(d)}</div>}</div>)}</div>
        {d.images.length > 0 && <div className="gallery">{d.images.map((u) => <a key={u} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" /></a>)}</div>}
        {l.type === 'PUBLIC' && token && <ReportButton token={token} />}
        {d.audios.map((a) => <div key={a.url} className="aud" style={{ justifyContent: 'center' }}>🎙 <audio controls src={a.url} preload="metadata" /></div>)}
      </div>}
    </div>
  );
}
