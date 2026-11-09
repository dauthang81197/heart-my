import { useEffect, useRef, useState } from 'react';
import { uploadFile } from '../api';

const MAX = 300; // giây
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function AudioRecorder({ disabled, onSaved }: { disabled?: boolean; onSaved: (a: { url: string; duration: number }) => void }) {
  const [rec, setRec] = useState(false);
  const [sec, setSec] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const mr = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number>();
  const secRef = useRef(0);

  useEffect(() => () => { clearInterval(timer.current); mr.current?.stream.getTracks().forEach((t) => t.stop()); }, []);

  const start = async () => {
    setErr('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return setErr('Trình duyệt không hỗ trợ ghi âm (cần HTTPS hoặc localhost).');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((m) => MediaRecorder.isTypeSupported(m));
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = []; secRef.current = 0; setSec(0);
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop()); clearInterval(timer.current); setRec(false);
        const type = (r.mimeType || 'audio/webm').split(';')[0];
        const blob = new Blob(chunks.current, { type });
        setBusy(true);
        try { const { url } = await uploadFile(blob, `rec.${type.split('/')[1]}`); onSaved({ url, duration: secRef.current }); } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
      };
      r.start(); mr.current = r; setRec(true);
      timer.current = window.setInterval(() => { secRef.current += 1; setSec(secRef.current); if (secRef.current >= MAX) r.stop(); }, 1000);
    } catch { setErr('Không truy cập được micro. Hãy cấp quyền cho trình duyệt.'); }
  };

  return (
    <div className="rec">
      <button className={'rec-btn' + (rec ? ' on' : '')} disabled={disabled || busy} onClick={() => (rec ? mr.current?.stop() : start())}>{rec ? '■' : '●'}</button>
      <div><b>{rec ? `Đang ghi… ${fmt(sec)}` : busy ? 'Đang tải lên…' : 'Bấm để ghi âm'}</b><div className="muted" style={{ fontSize: '.8rem' }}>Tối đa {fmt(MAX)} mỗi bản ghi</div></div>
      {err && <div className="err" style={{ flexBasis: '100%' }}>{err}</div>}
    </div>
  );
}
