import Logo from '../components/Logo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { api, Letter } from '../api';
import Envelope from '../components/Envelope';
import LetterCanvas from '../components/LetterCanvas';
import Particles from '../components/Particles';
import { Design, normalizeDesign, pageCount, W } from '../design';
import { Spinner, useUI } from '../components/UI';
import { useI18n } from '../i18n';

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


const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const Icon = ({ d }: { d: string }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
const ICONS = {
  letter: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5 M9 13h6 M9 17h4',
  photos: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M21 16l-5-5-9 8',
  audio: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M19 11a7 7 0 0 1-14 0 M12 18v3',
};

function Head() {
  const { lang, setLang } = useI18n();
  return (
    <div className="vw-head">
      <Logo to="/" />
      <div className="lang"><button className={lang === 'vi' ? 'on' : ''} onClick={() => setLang('vi')}>VI</button><button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button></div>
    </div>
  );
}

/** Cổng xác minh người nhận: Google (đúng email) hoặc mã 6 số gửi tới hộp thư. */
function Gate({ token, info, onUnlocked }: { token: string; info: { maskedEmail: string; authorName?: string }; onUnlocked: (vt: string) => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState<'choose' | 'code'>('choose');
  const [code, setCode] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [cool, setCool] = useState(0);
  useEffect(() => { if (cool <= 0) return; const id = setTimeout(() => setCool(cool - 1), 1000); return () => clearTimeout(id); }, [cool]);
  const run = async (fn: () => Promise<any>) => { setErr(''); setBusy(true); try { await fn(); } catch (e: any) { setErr(e.message); } finally { setBusy(false); } };
  const send = () => run(async () => { await api(`/letters/view/${token}/code`, { method: 'POST' }); setStep('code'); setCode(''); setCool(60); });
  const verify = () => run(async () => { const r = await api<{ viewToken: string }>(`/letters/view/${token}/verify`, { body: { code } }); onUnlocked(r.viewToken); });
  const google = (credential?: string) => run(async () => { const r = await api<{ viewToken: string }>(`/letters/view/${token}/google`, { body: { credential } }); onUnlocked(r.viewToken); });
  return (
    <div className="vw">
      <Head />
      <div className="gate">
        <div className="gate-lock"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg></div>
        <h1>{t('gateTitle')}</h1>
        <p>{t('gateFor')} <b>{info.maskedEmail}</b>.</p>
        <p>{t('gateHint')}</p>
        {step === 'choose' ? <>
          {import.meta.env.VITE_GOOGLE_CLIENT_ID && <div className="gate-g"><GoogleLogin text="continue_with" shape="rectangular" theme="outline" onSuccess={(c) => google(c.credential)} onError={() => setErr('Đăng nhập Google thất bại')} /></div>}
          <div className="gate-or"><span>{t('or')}</span></div>
          <button className="gate-btn" disabled={busy} onClick={send}>{busy ? '…' : `${t('sendCode')} ${info.maskedEmail}`}</button>
        </> : <>
          <p className="muted" style={{ margin: '4px 0 12px' }}>{t('codeSent')} <b>{info.maskedEmail}</b></p>
          <input className="gate-code" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6} placeholder="••••••" value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && verify()} aria-label={t('enterCode')} />
          <button className="gate-btn primary" disabled={busy || code.length !== 6} onClick={verify}>{t('verify')}</button>
          <div className="gate-row">
            <button className="linkbtn" disabled={cool > 0 || busy} onClick={send}>{cool > 0 ? `${t('resendIn')} ${cool}s` : t('resend')}</button>
            <button className="linkbtn" onClick={() => { setStep('choose'); setErr(''); }}>{t('otherWay')}</button>
          </div>
        </>}
        {err && <div className="err" role="alert">{err}</div>}
        <p className="gate-foot">{t('haveAcc')} <Link to={`/login?next=${encodeURIComponent(`/l/${token}`)}`}>{t('login')}</Link></p>
      </div>
    </div>
  );
}

/** Băng cassette cho ghi âm (hình trang trí khi lấp ló + trình phát đầy đủ). */
function Cassette({ time, playing, progress = 0, style }: { time: string; playing?: boolean; progress?: number; style?: React.CSSProperties }) {
  const bars = [4, 9, 6, 12, 7, 14, 8, 11, 5, 13, 7, 10, 6, 12, 4, 9, 7, 11, 5, 8, 12, 6, 9, 5];
  return (
    <div className="cass" style={style}>
      <div className="cass-label">
        <div className="cass-wave">{bars.map((h, i) => <i key={i} style={{ height: h * 1.6, opacity: i / bars.length <= progress ? 1 : 0.45 }} />)}<b>{time}</b></div>
        <div className="cass-win"><span className={playing ? 'spin' : ''} /><span className={playing ? 'spin' : ''} /><em /></div>
        <div className="cass-stripe" />
      </div>
    </div>
  );
}

function AudioCard({ url, duration }: { url: string; duration: number }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false); const [cur, setCur] = useState(0); const [dur, setDur] = useState(duration || 0);
  const toggle = () => { const a = ref.current; if (!a) return; if (a.paused) a.play(); else a.pause(); };
  return (
    <div className="acard">
      <audio ref={ref} src={url} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setCur(0); }}
        onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)} onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDur(e.currentTarget.duration)} />
      <Cassette time={fmt(dur || 0)} playing={playing} progress={dur ? cur / dur : 0} />
      <div className="acard-ctl">
        <button className="play" onClick={toggle} aria-label={playing ? 'Tạm dừng' : 'Phát'}>{playing ? '❚❚' : '▶'}</button>
        <input type="range" min={0} max={dur || 1} step={0.1} value={cur} onChange={(e) => { if (ref.current) ref.current.currentTime = +e.target.value; setCur(+e.target.value); }} aria-label="Tiến độ" />
        <span className="muted">{fmt(cur)} / {fmt(dur || 0)}</span>
      </div>
    </div>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const { t } = useI18n();
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div className="sheet" role="dialog" aria-label={title}>
      <div className="sheet-bar"><b>{title}</b><button className="sheet-x" onClick={onClose} aria-label={t('close')}>✕</button></div>
      <div className="sheet-body">{children}</div>
    </div>
  );
}

function Viewer({ l, token }: { l: Letter; token: string }) {
  const { t } = useI18n();
  const d: Design = normalizeDesign(l.design, l.envelope);
  const [vw, setVw] = useState(window.innerWidth); const [vh, setVh] = useState(window.innerHeight);
  const [open, setOpen] = useState(false); const [show, setShow] = useState(false);
  const [view, setView] = useState<'envelope' | 'letter' | 'photos' | 'audio'>('envelope');
  const [zoom, setZoom] = useState<string | null>(null);
  useEffect(() => { const f = () => { setVw(window.innerWidth); setVh(window.innerHeight); }; window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  useEffect(() => { if (open) { const id = setTimeout(() => setShow(true), 1100); return () => clearTimeout(id); } }, [open]);
  const es = Math.min(420, vw - 48, Math.max(240, (vh - 260) / 0.68 / 1.25));
  const cw = Math.min(W, vw - 24);
  const photos = d.images, audios = d.audios;
  const peek = (
    <>
      {photos[0] && <div className="peek-polaroid" style={{ left: es * 0.1, top: -es * 0.06, width: es * 0.36 }}><img src={photos[0]} alt="" /></div>}
      {audios[0] && <Cassette time={fmt(audios[0].duration || 0)} style={{ position: 'absolute', left: es * 0.3, top: es * 0.1, width: es * 0.44, transform: 'rotate(4deg)' }} />}
    </>
  );
  return (
    <div className="vw">
      <Head />
      {open && d.effect && d.effect !== 'none' && <Particles effect={d.effect} burst={show ? 2 : 1} />}
      <div className="vw-stage">
        <p className="muted" style={{ margin: '0 0 6px' }}>{t('fromLabel')} <b style={{ color: 'var(--fg)' }}>{l.author?.name}</b></p>
        <div style={{ display: 'grid', placeItems: 'center', margin: `${open ? es * 0.5 : 24}px 0 10px`, transition: 'margin .5s' }}>
          <Envelope design={d} open={open} size={es} stamp={l.stamp?.image} inside={peek}
            onClick={() => !open && setOpen(true)} onPaperClick={show ? () => setView('letter') : undefined}
            paper={<LetterCanvas design={d} width={Math.round(es * 0.84)} />} />
        </div>
        <p className="muted" style={{ minHeight: 22 }}>{!open ? t('tapOpen') : show ? t('tapRead') : ''}</p>
      </div>

      {show && (
        <nav className="vw-tabs reveal" aria-label="Nội dung thư">
          <button className={view === 'envelope' || view === 'letter' ? 'on' : ''} onClick={() => setView('envelope')} title={t('tabLetter')} aria-label={t('tabLetter')}><Icon d={ICONS.letter} /></button>
          <button className={view === 'photos' ? 'on' : ''} disabled={!photos.length} onClick={() => setView('photos')} title={t('tabPhotos')} aria-label={t('tabPhotos')}><Icon d={ICONS.photos} /></button>
          <button className={view === 'audio' ? 'on' : ''} disabled={!audios.length} onClick={() => setView('audio')} title={t('tabAudio')} aria-label={t('tabAudio')}><Icon d={ICONS.audio} /></button>
        </nav>)}

      {view === 'letter' && (
        <Sheet title={l.title || t('tabLetter')} onClose={() => setView('envelope')}>
          <div style={{ display: 'grid', placeItems: 'center', gap: 22 }}>
            {Array.from({ length: pageCount(d) }, (_, i) => (
              <div key={i} className="reveal" style={{ animationDelay: `${i * 0.25}s` }}>
                <LetterCanvas design={d} width={cw} page={i} reveal />
                {pageCount(d) > 1 && <div className="muted" style={{ fontSize: '.8rem', margin: '8px 0 0', textAlign: 'center' }}>{i + 1}/{pageCount(d)}</div>}
              </div>))}
            {l.type === 'PUBLIC' && <ReportButton token={token} />}
          </div>
        </Sheet>)}
      {view === 'photos' && (
        <Sheet title={t('photosTitle')} onClose={() => setView('envelope')}>
          <div className="polaroids">{photos.map((u, i) => <button key={u} className="polaroid" style={{ transform: `rotate(${(i % 2 ? 1 : -1) * (1.5 + (i % 3))}deg)` }} onClick={() => setZoom(u)}><img src={u} alt="" loading="lazy" /></button>)}</div>
        </Sheet>)}
      {view === 'audio' && (
        <Sheet title={t('audioTitle')} onClose={() => setView('envelope')}>
          <div className="acards">{audios.map((a) => <AudioCard key={a.url} url={a.url} duration={a.duration} />)}</div>
        </Sheet>)}
      {zoom && <div className="lightbox" onClick={() => setZoom(null)} role="dialog"><img src={zoom} alt="" /><button className="sheet-x" aria-label={t('close')}>✕</button></div>}
    </div>
  );
}

export default function ViewLetter() {
  const { token = '' } = useParams();
  const [l, setL] = useState<Letter | null>(null);
  const [lock, setLock] = useState<{ maskedEmail: string; authorName?: string } | null>(null);
  const [err, setErr] = useState('');
  const key = `hp_vt_${token}`;
  const load = useCallback(() => {
    let vt = ''; try { vt = sessionStorage.getItem(key) ?? ''; } catch { /* bỏ qua */ }
    api<Letter>(`/letters/view/${token}`, { headers: vt ? { 'X-View-Token': vt } : undefined })
      .then((x) => { setL(x); setLock(null); })
      .catch((e) => { if (e.status === 403 && e.data?.locked) setLock(e.data); else setErr(e.message); });
  }, [token, key]);
  useEffect(load, [load]);
  if (err) return <div className="center"><div style={{ textAlign: 'center' }}><p>{err}</p><Link className="btn" to="/">Về trang chủ</Link></div></div>;
  if (lock) return <Gate token={token} info={lock} onUnlocked={(vt) => { try { sessionStorage.setItem(key, vt); } catch { /* bỏ qua */ } load(); }} />;
  if (!l) return <Spinner />;
  return <Viewer l={l} token={token} />;
}
