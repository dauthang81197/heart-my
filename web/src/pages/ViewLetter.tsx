import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, Letter } from '../api';
import Envelope from '../components/Envelope';
import { Spinner } from '../components/UI';
import LetterCanvas from '../components/LetterCanvas';
import { normalizeDesign, pageCount, W } from '../design';

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
        {d.audios.map((a) => <div key={a.url} className="aud" style={{ justifyContent: 'center' }}>🎙 <audio controls src={a.url} preload="metadata" /></div>)}
      </div>}
    </div>
  );
}
