import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, Letter, uploadFile } from '../api';
import {
  Design, ENV_COLORS, ENV_PATTERNS, Item, MODELS, nameOf, normalizeDesign, PAPER_COLORS, PAPER_KINDS, PAPER_PATTERNS,
  SEAL_COLORS, SEAL_EMBLEMS, W, pageCount,
} from '../design';
import LetterCanvas from '../components/LetterCanvas';
import Envelope from '../components/Envelope';
import AppHeader from '../components/AppHeader';
import AudioRecorder from '../components/AudioRecorder';
import { MAX_BYTES, MAX_PAGES, processHandwriting } from '../handwriting';
import { Spinner, useUI } from '../components/UI';

const FONTS = ['Dancing Script', 'Caveat', 'Playfair Display', 'Inter', 'Be Vietnam Pro', 'Georgia', 'Courier New'];
const INKS = ['#1f2328', '#7a1f2b', '#1f4a4a', '#26324d', '#8a5a2b', '#c0392b', '#d4a93c', '#6b4c9a', '#ffffff'];
const STICKERS = ['❤️', '💌', '🌸', '🌹', '⭐', '🌙', '☀️', '🦋', '🕊️', '🍀', '🎀', '✨', '🌻', '🍂', '☕', '🎁', '🧸', '🎈', '🐱', '🐶', '📮', '🪶', '🕯️', '🎶'];
const uid = () => Math.random().toString(36).slice(2, 9);

type Step = 'env' | 'seal' | 'paper' | 'content';
const TABS: [Step, string][] = [['env', 'Phong thư'], ['seal', 'Sáp'], ['paper', 'Giấy'], ['content', 'Nội dung']];
const SUBS: Record<Step, [string, string][]> = {
  env: [['model', 'Mẫu mã'], ['pattern', 'Họa tiết'], ['color', 'Màu sắc']],
  seal: [['color', 'Màu sáp'], ['emblem', 'Biểu tượng']],
  paper: [['kind', 'Loại giấy'], ['pattern', 'Họa tiết'], ['color', 'Màu giấy']],
  content: [['hand', 'Chữ viết tay'], ['text', 'Soạn thảo'], ['photos', 'Ảnh đính kèm'], ['audio', 'Ghi âm']],
};

function Card({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return <button className={'ocard' + (on ? ' on' : '')} onClick={onClick}>{children}{on && <span className="chk">✓</span>}</button>;
}

export default function Editor() {
  const { toast, confirm } = useUI();
  const { id } = useParams();
  const nav = useNavigate();
  const [letter, setLetter] = useState<Letter | null>(null);
  const [design, setDesign] = useState<Design>(normalizeDesign(null));
  const [title, setTitle] = useState('');
  const [step, setStep] = useState<Step>('env');
  const [sub, setSub] = useState<Record<Step, string>>({ env: 'model', seal: 'color', paper: 'kind', content: 'hand' });
  const [open, setOpen] = useState(false);
  const [pg, setPg] = useState(0);
  const [handBusy, setHandBusy] = useState('');
  const [pulled, setPulled] = useState(false);
  const [full, setFull] = useState(false);
  const [grid, setGrid] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'draw'>('select');
  const [brush, setBrush] = useState({ color: '#1f2328', size: 4 });
  const [saved, setSaved] = useState('');
  const [box, setBox] = useState({ w: 600, h: 600 });
  const [busy, setBusy] = useState(false);
  const past = useRef<Design[]>([]); const future = useRef<Design[]>([]);
  const strokeStart = useRef<Design | null>(null);
  const prev = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    api<Letter>(`/letters/${id}`).then((l) => {
      if (l.status !== 'DRAFT') return nav('/app/vault', { replace: true });
      const d = normalizeDesign(l.design, l.envelope);
      setLetter(l); setTitle(l.title); setDesign(d);
      if (d.items.length || d.pages.length || d.images.length || d.audios.length || l.title) setStep('content');
      loaded.current = true;
    }).catch(() => nav('/app'));
  }, [id]);

  useEffect(() => { setOpen(step === 'paper'); setPulled(false); setTool('select'); setSel(null); }, [step]);
  useEffect(() => {
    const el = prev.current; if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight })); ro.observe(el);
    return () => ro.disconnect();
  }, [letter]);

  useEffect(() => { // autosave
    if (!loaded.current) return;
    setSaved('Đang lưu…');
    const t = setTimeout(() => api(`/letters/${id}`, { method: 'PATCH', body: { title, envelope: design.env.model, design } }).then(() => setSaved('Đã lưu ✓')).catch(() => setSaved('Lưu lỗi')), 900);
    return () => clearTimeout(t);
  }, [design, title]);

  const commit = useCallback((d: Design) => {
    past.current.push(design); if (past.current.length > 80) past.current.shift(); future.current = []; setDesign(d);
  }, [design]);
  const onCanvas = (d: Design, c: boolean) => {
    if (!c) { if (!strokeStart.current) strokeStart.current = design; setDesign(d); return; }
    const base = strokeStart.current ?? design; strokeStart.current = null;
    if (base === d) return; past.current.push(base); future.current = []; setDesign(d);
  };
  const undo = () => { const p = past.current.pop(); if (p) { future.current.push(design); setDesign(p); setSel(null); } };
  const redo = () => { const f = future.current.pop(); if (f) { past.current.push(design); setDesign(f); } };

  const set = (patch: Partial<Design>) => commit({ ...design, ...patch });
  const add = (it: Partial<Item> & Pick<Item, 'type'>) => {
    const item = { id: uid(), page: pg, x: 90, y: 120 + (design.items.length % 6) * 50, ...it } as Item;
    commit({ ...design, items: [...design.items, item] }); setSel(item.id); setTool('select');
  };
  const selected = design.items.find((i) => i.id === sel);
  const patchSel = (p: Partial<Item>) => sel && commit({ ...design, items: design.items.map((i) => (i.id === sel ? { ...i, ...p } : i)) });
  const delSel = () => { if (sel) { commit({ ...design, items: design.items.filter((i) => i.id !== sel) }); setSel(null); } };
  const order = (dir: 1 | -1) => {
    const i = design.items.findIndex((x) => x.id === sel), j = i + dir; if (i < 0 || j < 0 || j >= design.items.length) return;
    const items = [...design.items]; [items[i], items[j]] = [items[j], items[i]]; commit({ ...design, items });
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input,textarea,select')) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel) delSel();
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });

  const uploadImages = async (files: FileList | null, asItem: boolean) => {
    if (!files?.length) return; setBusy(true);
    try {
      let d = design; const urls: string[] = [];
      for (const f of Array.from(files).slice(0, asItem ? 1 : 10 - design.images.length)) urls.push((await uploadFile(f, f.name)).url);
      if (asItem) add({ type: 'image', src: urls[0], width: 240, height: 240 });
      else commit({ ...d, images: [...d.images, ...urls] });
    } catch (e: any) { toast(e.message, 'error'); } finally { setBusy(false); }
  };

  const addHandPages = async (files: FileList | File[] | null) => {
    const list = Array.from(files ?? []); if (!list.length) return;
    const room = MAX_PAGES - design.pages.length;
    if (room <= 0) return toast(`Tối đa ${MAX_PAGES} trang`, 'error');
    if (list.length > room) toast(`Chỉ thêm được ${room} trang nữa, bỏ bớt ảnh thừa`, 'error');
    const urls: string[] = [];
    try {
      const picked = list.slice(0, room);
      for (let i = 0; i < picked.length; i++) {
        const f = picked[i];
        if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) { toast(`${f.name}: chỉ nhận JPG, PNG`, 'error'); continue; }
        if (f.size > MAX_BYTES) { toast(`${f.name}: vượt quá 5MB`, 'error'); continue; }
        setHandBusy(`Đang xử lý ảnh ${i + 1}/${picked.length}…`);
        const blob = await processHandwriting(f);
        urls.push((await uploadFile(blob, `hand-${Date.now()}.png`)).url);
      }
      if (urls.length) { commit({ ...design, pages: [...design.pages, ...urls] }); setPg(design.pages.length); setSel(null); toast(`Đã thêm ${urls.length} trang`); }
    } catch (e: any) { toast(e.message, 'error'); } finally { setHandBusy(''); }
  };
  const removePage = (i: number) => {
    const items = design.items.filter((it) => (it.page ?? 0) !== i).map((it) => ((it.page ?? 0) > i ? { ...it, page: (it.page ?? 0) - 1 } : it));
    commit({ ...design, pages: design.pages.filter((_, j) => j !== i), pageInk: design.pageInk.filter((_, j) => j !== i), items });
    setPg((p) => Math.max(0, Math.min(p, design.pages.length - 2))); setSel(null);
  };

  const goSend = async () => {
    await api(`/letters/${id}`, { method: 'PATCH', body: { title, envelope: design.env.model, design } });
    nav(`/send/${id}`);
  };
  const trash = async () => { if (await confirm({ message: 'Xoá bản nháp này?', danger: true, okText: 'Xoá' })) { await api(`/letters/${id}`, { method: 'DELETE' }); nav('/app/vault'); } };

  if (!letter) return <Spinner />;

  const e = design.env, sl = design.seal, pp = design.paper;
  const envSize = Math.max(220, Math.min(520, box.w - 110, (box.h - 150) / 0.68 / 1.3));
  const mob = box.w < 700; // preview mobile: canvas gần full chiều rộng
  const cw = mob ? Math.max(200, Math.min(W, box.w - 20, (box.h - 110) * 0.75)) : Math.max(220, Math.min(W, box.w - 90, (box.h - 130) * 0.75));
  const paperEl = <LetterCanvas design={design} width={Math.round(envSize * 0.84)} />;
  const miniPaper = (k?: string, pattern?: string, color?: string) => ({ ...design, items: [], paper: { kind: k ?? pp.kind, pattern: pattern ?? pp.pattern, color: color ?? pp.color } });

  const panel = (() => {
    const s = sub[step];
    if (step === 'env') {
      if (s === 'model') return <div className="cards">{MODELS.map((m) => <Card key={m.k} on={e.model === m.k} onClick={() => set({ env: { ...e, model: m.k } })}><Envelope design={design} env={{ ...e, model: m.k }} size={72} /><span>{m.n}</span></Card>)}</div>;
      if (s === 'pattern') return <div className="cards">{ENV_PATTERNS.map((m) => <Card key={m.k} on={e.pattern === m.k} onClick={() => set({ env: { ...e, pattern: m.k } })}><Envelope design={design} env={{ ...e, pattern: m.k }} size={72} /><span>{m.n}</span></Card>)}</div>;
      return <div className="cards">{ENV_COLORS.map((m) => <Card key={m.c} on={e.color === m.c} onClick={() => set({ env: { ...e, color: m.c } })}><i className="dot" style={{ background: m.c }} /><span>{m.n}</span></Card>)}</div>;
    }
    if (step === 'seal') {
      if (s === 'color') return <div className="cards">{SEAL_COLORS.map((m) => <Card key={m.c} on={sl.color === m.c} onClick={() => set({ seal: { ...sl, color: m.c } })}><i className="dot" style={{ background: m.c }} /><span>{m.n}</span></Card>)}</div>;
      return <div className="cards c3">{SEAL_EMBLEMS.map((m) => <Card key={m || 'none'} on={sl.emblem === m} onClick={() => set({ seal: { ...sl, emblem: m } })}><i className="dot" style={{ background: sl.color, color: '#fff9' }}>{m}</i><span>{m || 'Trống'}</span></Card>)}</div>;
    }
    if (step === 'paper') {
      if (s === 'kind') return <div className="cards">{PAPER_KINDS.map((m) => <Card key={m.k} on={pp.kind === m.k} onClick={() => set({ paper: { ...pp, kind: m.k } })}><div className="mini"><LetterCanvas design={miniPaper(m.k)} width={48} /></div><span>{m.n}</span></Card>)}</div>;
      if (s === 'pattern') return <div className="cards">{PAPER_PATTERNS.map((m) => <Card key={m.k} on={pp.pattern === m.k} onClick={() => set({ paper: { ...pp, pattern: m.k } })}><div className="mini"><LetterCanvas design={miniPaper(undefined, m.k)} width={48} /></div><span>{m.n}</span></Card>)}</div>;
      return <div className="cards">{PAPER_COLORS.map((m) => <Card key={m.c} on={pp.color === m.c} onClick={() => set({ paper: { ...pp, color: m.c } })}><i className="dot" style={{ background: m.c }} /><span>{m.n}</span></Card>)}</div>;
    }
    if (s === 'photos') return (
      <div className="pad">
        <p className="muted">Ảnh đính kèm sẽ hiện bên dưới lá thư khi người nhận mở. Tối đa 10 ảnh, mỗi ảnh ≤ 5MB.</p>
        <label className={'btn' + (busy || design.images.length >= 10 ? ' disabled' : '')} style={{ cursor: 'pointer' }}>＋ Thêm ảnh
          <input type="file" accept="image/*" multiple hidden disabled={busy || design.images.length >= 10} onChange={(ev) => { uploadImages(ev.target.files, false); ev.target.value = ''; }} /></label>
        {busy && <span className="muted"> Đang tải lên…</span>}
        <div className="thumbs">{design.images.map((u, i) => <div key={u} className="thumb"><img src={u} alt="" /><button onClick={() => set({ images: design.images.filter((_, j) => j !== i) })}>✕</button></div>)}</div>
      </div>);
    if (s === 'hand') return (
      <div className="pad">
        <div className="muted" style={{ fontSize: '.85rem', marginBottom: 10 }}>{design.pages.length}/{MAX_PAGES} trang đã thêm</div>
        {design.pages.length < MAX_PAGES && (
          <label className={'dropzone' + (handBusy ? ' busy' : '')}
            onDragOver={(ev) => ev.preventDefault()} onDrop={(ev) => { ev.preventDefault(); if (!handBusy) addHandPages(ev.dataTransfer.files); }}>
            <span className="plus">{handBusy ? <i className="spinner" /> : '＋'}</span>
            <b>{handBusy || 'Tải ảnh chữ viết của bạn'}</b>
            <span className="muted">JPG, PNG · Tối đa 5MB · Mỗi ảnh là 1 trang thư · Chọn nhiều ảnh một lúc</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden disabled={!!handBusy}
              onChange={(ev) => { addHandPages(ev.target.files); ev.target.value = ''; }} />
          </label>)}
        {design.pages.length > 0 && <>
          <h4>Màu chữ — Trang {Math.min(pg, design.pages.length - 1) + 1}</h4>
          {(() => {
            const cur = Math.min(pg, design.pages.length - 1); const ink = design.pageInk[cur] ?? null;
            const setInk = (c: string | null, all = false) => {
              const arr = design.pages.map((_, i) => (all || i === cur ? c : design.pageInk[i] ?? null));
              commit({ ...design, pageInk: arr });
            };
            return <>
              <div className="row">
                <button className={'chip t' + (!ink ? ' on' : '')} onClick={() => setInk(null)}>Màu gốc</button>
                {INKS.map((c) => <span key={c} className={'swatch' + (ink === c ? ' on' : '')} style={{ background: c }} onClick={() => setInk(c)} />)}
                <label className="swatch custom" title="Chọn màu khác" style={{ background: ink && !INKS.includes(ink) ? ink : undefined }}>
                  <input type="color" value={ink ?? '#1f2328'} onChange={(ev) => setInk(ev.target.value)} /></label>
              </div>
              {design.pages.length > 1 && <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => setInk(ink, true)}>Áp dụng màu này cho mọi trang</button>}
            </>;
          })()}
          <h4>Các trang</h4>
          <div className="pagelist">{design.pages.map((u, i) => (
            <div key={u} className={'pagethumb' + (pg === i ? ' on' : '')} onClick={() => setPg(i)}>
              <div className="pt-img"><img src={u} alt="" /></div>
              <span>Trang {i + 1}</span>
              <button title="Xoá trang" onClick={async (ev) => { ev.stopPropagation(); if (await confirm({ message: `Xoá trang ${i + 1}?`, danger: true, okText: 'Xoá' })) removePage(i); }}>✕</button>
            </div>))}</div>
        </>}
        <p className="muted" style={{ fontSize: '.82rem', marginTop: 14 }}>Ảnh tự co vừa khổ giấy và tách nền trắng để chữ nằm trên màu giấy bạn chọn; bạn có thể đổi màu chữ ở trên. Chụp thẳng, đủ sáng sẽ cho kết quả đẹp nhất. Vào <b>Soạn thảo</b> để thêm sticker, chữ, nét vẽ lên từng trang.</p>
      </div>);
    if (s === 'audio') return (
      <div className="pad">
        <p className="muted">Ghi một lời nhắn bằng giọng nói, người nhận sẽ nghe được khi mở thư. Tối đa 3 bản ghi.</p>
        <AudioRecorder disabled={design.audios.length >= 3} onSaved={(a) => commit({ ...design, audios: [...design.audios, a] })} />
        {design.audios.map((a, i) => <div key={a.url} className="aud"><audio controls src={a.url} preload="metadata" /><button className="btn danger sm" onClick={() => set({ audios: design.audios.filter((_, j) => j !== i) })}>Xoá</button></div>)}
      </div>);
    // text (soạn thảo)
    return (
      <div className="pad">
        <h4>Thêm vào lá thư</h4>
        <div className="row">
          <button className="btn sm" onClick={() => add({ type: 'text', text: 'Viết gì đó…', fontFamily: 'Dancing Script', fontSize: 34, fill: '#1f2328', width: 400 })}>＋ Chữ viết tay</button>
          <button className="btn ghost sm" onClick={() => add({ type: 'text', text: 'Tiêu đề', fontFamily: 'Playfair Display', fontSize: 40, bold: true, fill: '#7a1f2b', width: 400 })}>＋ Tiêu đề</button>
          <label className="btn ghost sm" style={{ cursor: 'pointer' }}>🖼 Ảnh dán<input type="file" accept="image/*" hidden onChange={(ev) => { uploadImages(ev.target.files, true); ev.target.value = ''; }} /></label>
        </div>
        <h4>Vẽ tay</h4>
        <div className="row">{INKS.map((c) => <span key={c} className={'swatch' + (brush.color === c ? ' on' : '')} style={{ background: c }} onClick={() => { setBrush({ ...brush, color: c }); setTool('draw'); }} />)}</div>
        <div className="row" style={{ marginTop: 8 }}><input type="range" min={1} max={30} value={brush.size} onChange={(ev) => setBrush({ ...brush, size: +ev.target.value })} /><span className="muted">{brush.size}px</span>
          <button className={'btn sm' + (tool === 'draw' ? '' : ' ghost')} onClick={() => setTool(tool === 'draw' ? 'select' : 'draw')}>{tool === 'draw' ? '✏️ Đang vẽ — bấm để dừng' : '✏️ Bật vẽ'}</button></div>
        <h4>Sticker</h4><div className="chips">{STICKERS.map((st) => <span key={st} className="chip" onClick={() => add({ type: 'sticker', text: st, fontSize: 64 })}>{st}</span>)}</div>
        {selected && <>
          <h4>Đối tượng đang chọn</h4>
          <div className="row"><button className="btn ghost sm" onClick={() => add({ ...selected, id: undefined as any, x: selected.x + 24, y: selected.y + 24 })}>Nhân bản</button><button className="btn ghost sm" onClick={() => order(1)}>↑</button><button className="btn ghost sm" onClick={() => order(-1)}>↓</button><button className="btn danger sm" onClick={delSel}>Xoá</button></div>
          {selected.type === 'text' && <>
            <textarea className="input" rows={4} style={{ marginTop: 10 }} value={selected.text} onChange={(ev) => patchSel({ text: ev.target.value })} />
            <div className="row" style={{ marginTop: 8 }}>
              <select className="input" style={{ flex: 1 }} value={selected.fontFamily} onChange={(ev) => patchSel({ fontFamily: ev.target.value })}>{FONTS.map((f) => <option key={f}>{f}</option>)}</select>
              <input type="number" className="input" style={{ width: 80 }} min={12} max={120} value={Math.round(selected.fontSize ?? 28)} onChange={(ev) => patchSel({ fontSize: +ev.target.value })} /></div>
            <div className="row" style={{ marginTop: 8 }}>{INKS.map((c) => <span key={c} className={'swatch' + (selected.fill === c ? ' on' : '')} style={{ background: c }} onClick={() => patchSel({ fill: c })} />)}</div>
            <div className="row" style={{ marginTop: 8 }}>
              <button className={'chip t' + (selected.bold ? ' on' : '')} onClick={() => patchSel({ bold: !selected.bold })}><b>B</b></button>
              <button className={'chip t' + (selected.italic ? ' on' : '')} onClick={() => patchSel({ italic: !selected.italic })}><i>I</i></button>
              {(['left', 'center', 'right'] as const).map((a) => <button key={a} className={'chip t' + (selected.align === a ? ' on' : '')} onClick={() => patchSel({ align: a })}>{{ left: '⬅', center: '↔', right: '➡' }[a]}</button>)}</div>
          </>}
        </>}
        <label className="f" style={{ marginTop: 16 }}>Tên thư<input className="input" value={title} onChange={(ev) => setTitle(ev.target.value)} placeholder="Ví dụ: Gửi em…" /></label>
      </div>);
  })();

  return (
    <div className="ed2">
      <AppHeader />
      <div className="ed2-main">
        <section className="ed2-panel">
          <div className="tabbar">
            {TABS.map(([k, n]) => <button key={k} className={'tab' + (step === k ? ' on' : '')} onClick={() => setStep(k)}>{n}</button>)}
            <button className="sendbtn" onClick={goSend}>✈ Gửi</button>
            <div className="tools"><button onClick={undo} disabled={!past.current.length} title="Hoàn tác">↶</button><button onClick={redo} disabled={!future.current.length} title="Làm lại">↷</button><span /><button onClick={trash} title="Xoá thư">🗑</button></div>
          </div>
          <div className="seg">{SUBS[step].map(([k, n]) => <button key={k} className={sub[step] === k ? 'on' : ''} onClick={() => setSub({ ...sub, [step]: k })}>{n}</button>)}</div>
          <div className="panel-body">{panel}</div>
        </section>

        <section ref={prev} className={'ed2-prev' + (full ? ' full' : '') + (grid ? ' grid' : '') + (step === 'content' ? ' content' : '')}>
          <div className="side-tools">
            <button title="Toàn màn hình" onClick={() => setFull(!full)}>⤢</button>
            {step !== 'content' && <>
              <button title="Phát lại" onClick={() => { setPulled(false); setOpen(false); setTimeout(() => setOpen(true), 700); }}>↻</button>
              <button title={open ? 'Đóng phong thư' : 'Mở phong thư'} onClick={() => setOpen(!open)}>{open ? '⌃' : '⌄'}</button>
              <button title="Hiện/ẩn lưới" onClick={() => setGrid(!grid)}>▦</button>
            </>}
          </div>
          <div className="stage">
            {step === 'content'
              ? <div style={{ display: 'grid', gap: 10, justifyItems: 'center' }}>
                  {pageCount(design) > 1 && <div className="pagetabs">{Array.from({ length: pageCount(design) }, (_, i) => <button key={i} className={pg === i ? 'on' : ''} onClick={() => { setPg(i); setSel(null); }}>Trang {i + 1}</button>)}</div>}
                  <LetterCanvas design={design} width={cw} page={Math.min(pg, pageCount(design) - 1)} editable tool={tool} brush={brush} selectedId={sel} onSelect={setSel} onChange={onCanvas} />
                </div>
              : <div style={{ marginTop: open ? envSize * 0.45 : 0, transition: 'margin .5s' }}><Envelope design={design} open={open} pulled={pulled} size={envSize} paper={paperEl} onClick={() => { if (pulled) setPulled(false); else setOpen(!open); }} onPaperClick={() => setPulled(!pulled)} /></div>}
          </div>
          <div className="infobar">
            <span>Mẫu: <b>{nameOf(MODELS, e.model)}</b></span><span>Loại giấy: <b>{nameOf(PAPER_KINDS, pp.kind)}</b></span>
            <span>Sáp: <b>{nameOf(SEAL_COLORS, sl.color)}</b></span><span>Giấy: <b>{nameOf(PAPER_COLORS, pp.color)}</b></span>
            <span>Nét mực: <b>{tool === 'draw' ? <i className="dot s" style={{ background: brush.color }} /> : selected?.fill ? <i className="dot s" style={{ background: selected.fill }} /> : '—'}</b></span>
            <span className="muted">{saved}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
