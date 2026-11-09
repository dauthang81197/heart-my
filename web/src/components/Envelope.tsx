import { ReactNode, useEffect, useId, useState } from 'react';
import { Design, EnvDesign, normalizeDesign, Seal } from '../design';

// Giữ lại cho trang chủ / Envelope3D
export const ENVELOPES: Record<string, { body: string; flap: string; label: string }> = {
  classic: { body: '#1f4a4a', flap: '#245656', label: 'Cổ điển' },
  kraft: { body: '#b08d62', flap: '#bd9b72', label: 'Giấy kraft' },
  rose: { body: '#c98a96', flap: '#d89aa6', label: 'Hồng phấn' },
  midnight: { body: '#26324d', flap: '#2e3b5a', label: 'Đêm xanh' },
  sage: { body: '#7f9a82', flap: '#8da890', label: 'Xanh sage' },
  cream: { body: '#d9d2c3', flap: '#e4ddcf', label: 'Kem' },
};

// ---- Hình học (viewBox 500x340, nắp treo từ y=0) ----
const wave = (() => { let d = 'M0,0 H500 V105'; for (let i = 0; i < 5; i++) d += ` c-25,${i % 2 ? -34 : 34} -75,${i % 2 ? -34 : 34} -100,0`; return d + ' Z'; })();
const scallop = 'M0,0 H500 V95' + ' a50,50 0 0 1 -100,0'.repeat(5) + ' Z';
const zigzag = 'M0,0 H500 V95' + ' l-25,28 l-25,-28'.repeat(10) + ' Z';
const cloud = 'M0,0 H500 V95' + ' a41.67,41.67 0 0 1 -83.33,0'.repeat(6) + ' Z';
const MODEL: Record<string, { flap: string; tip: number; pocket: string }> = {
  classic: { flap: 'M0,0 H500 L250,192 Z', tip: 150, pocket: 'M0,0 L250,186 L500,0 V340 H0 Z' },
  square: { flap: 'M0,0 H500 V135 Q500,150 485,150 H15 Q0,150 0,135 Z', tip: 118, pocket: 'M0,128 H500 V340 H0 Z' },
  wave: { flap: wave, tip: 108, pocket: 'M0,112 H500 V340 H0 Z' },
  heart: { flap: 'M0,0 H500 V40 C500,125 340,135 250,205 C160,135 0,125 0,40 Z', tip: 158, pocket: 'M0,0 L250,198 L500,0 V340 H0 Z' },
  moon: { flap: 'M0,0 H500 C500,112 392,192 250,192 C108,192 0,112 0,0 Z', tip: 150, pocket: 'M0,0 C0,112 108,192 250,192 C392,192 500,112 500,0 V340 H0 Z' },
  scallop: { flap: scallop, tip: 112, pocket: 'M0,100 H500 V340 H0 Z' },
  zigzag: { flap: zigzag, tip: 112, pocket: 'M0,100 H500 V340 H0 Z' },
  diamond: { flap: 'M0,0 H500 V55 L250,205 L0,55 Z', tip: 150, pocket: 'M0,55 L250,200 L500,55 V340 H0 Z' },
  round: { flap: 'M0,0 H500 V40 Q500,62 470,80 L270,196 Q250,208 230,196 L30,80 Q0,62 0,40 Z', tip: 150, pocket: 'M0,0 L250,198 L500,0 V340 H0 Z' },
  cloud: { flap: cloud, tip: 112, pocket: 'M0,100 H500 V340 H0 Z' },
};

const mix = (c: string, w: string, p: number) => `color-mix(in srgb, ${c} ${p}%, ${w})`;

function PatternDefs({ id }: { id: string }) {
  const f = { fill: '#fff', fillOpacity: 0.28 };
  return (
    <defs>
      <pattern id={`${id}-dots`} width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="2.4" {...f} /></pattern>
      <pattern id={`${id}-stripes`} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="16" {...f} /></pattern>
      <pattern id={`${id}-hearts`} width="34" height="34" patternUnits="userSpaceOnUse"><text x="17" y="24" fontSize="16" textAnchor="middle" {...f}>♥</text></pattern>
      <pattern id={`${id}-grid`} width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="1.2" /></pattern>
      <pattern id={`${id}-stars`} width="34" height="34" patternUnits="userSpaceOnUse"><text x="17" y="24" fontSize="15" textAnchor="middle" {...f}>✦</text></pattern>
      <pattern id={`${id}-flowers`} width="38" height="38" patternUnits="userSpaceOnUse"><text x="19" y="26" fontSize="18" textAnchor="middle" {...f}>✿</text></pattern>
      <pattern id={`${id}-diamonds`} width="26" height="26" patternUnits="userSpaceOnUse"><path d="M13 3 L23 13 L13 23 L3 13 Z" fill="none" stroke="#fff" strokeOpacity=".32" strokeWidth="1.5" /></pattern>
      <pattern id={`${id}-plaid`} width="36" height="36" patternUnits="userSpaceOnUse"><rect width="12" height="36" {...f} fillOpacity=".16" /><rect width="36" height="12" {...f} fillOpacity=".16" /></pattern>
      <pattern id={`${id}-waves`} width="40" height="20" patternUnits="userSpaceOnUse"><path d="M0 10 Q10 0 20 10 T40 10" fill="none" stroke="#fff" strokeOpacity=".32" strokeWidth="1.8" /></pattern>
      <pattern id={`${id}-notes`} width="44" height="44" patternUnits="userSpaceOnUse"><text x="22" y="30" fontSize="20" textAnchor="middle" {...f}>♪</text></pattern>
      <pattern id={`${id}-checker`} width="40" height="40" patternUnits="userSpaceOnUse"><rect width="20" height="20" {...f} fillOpacity=".16" /><rect x="20" y="20" width="20" height="20" {...f} fillOpacity=".16" /></pattern>
      <pattern id={`${id}-vlines`} width="14" height="14" patternUnits="userSpaceOnUse"><rect width="4" height="14" {...f} /></pattern>
      <linearGradient id={`${id}-sh`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".10" /><stop offset="1" stopColor="#000" stopOpacity=".16" /></linearGradient>
    </defs>
  );
}

type Props = {
  design?: Partial<Design> | null; env?: EnvDesign; seal?: Seal; open?: boolean; size?: number; stamp?: string;
  paper?: ReactNode; onClick?: () => void;
  /** Rút hẳn lá thư ra khỏi phong bì (chỉ có tác dụng khi open). */
  pulled?: boolean; onPaperClick?: () => void;
};

/** Phong bì SVG: nắp mở/đóng (lật scaleY), giấy trượt lên khi mở. */
export default function Envelope({ design, env, seal, open = false, size = 280, stamp, paper, onClick, pulled = false, onPaperClick }: Props) {
  // Giai đoạn rút thư: in (nằm trong) → out (nhảy hẳn ra ngoài, sau túi) → over (đáp xuống đè lên phong bì) → lift (nhấc lên lại trước khi cất)
  const [phase, setPhase] = useState<'in' | 'out' | 'over' | 'lift'>('in');
  const want = open && pulled;
  useEffect(() => {
    if (want) {
      setPhase('out');
      const t = setTimeout(() => setPhase('over'), 800);
      return () => clearTimeout(t);
    }
    setPhase((p) => (p === 'over' ? 'lift' : 'in'));
  }, [want]);
  useEffect(() => {
    if (phase !== 'lift') return;
    const t = setTimeout(() => setPhase('in'), 650);
    return () => clearTimeout(t);
  }, [phase]);
  const out = phase !== 'in';
  const front = phase === 'over' || phase === 'lift';
  const d = normalizeDesign(design);
  const e = env ?? d.env, sl = seal ?? d.seal;
  const m = MODEL[e.model] ?? MODEL.classic;
  const id = useId().replace(/:/g, '');
  const H = size * 0.68;
  const pat = e.pattern !== 'none' ? `url(#${id}-${e.pattern})` : null;
  const paperW = size * 0.84;
  const ease = 'cubic-bezier(.3,.7,.2,1)';
  const full = { position: 'absolute', left: 0, top: 0, width: size, height: H, overflow: 'visible' } as const;

  return (
    <div className="env2" style={{ width: size, height: H, position: 'relative', cursor: onClick ? 'pointer' : undefined,
      transform: want ? 'scale(.85)' : 'scale(1)', transformOrigin: '50% 100%', transition: `transform .9s ${ease}` }} onClick={onClick}>
      {/* lớp 1: ruột phong bì */}
      <svg viewBox="0 0 500 340" style={{ ...full, zIndex: 1 }}><PatternDefs id={id} />
        <rect width="500" height="340" rx="6" style={{ fill: mix(e.color, '#000', 78) }} /></svg>

      {/* lớp 3: giấy */}
      <div style={{ ...full, zIndex: front ? 7 : 3, clipPath: out ? 'inset(-300% -60% -300% -60%)' : 'inset(-300% 0 0 0)', pointerEvents: 'none' }}>
        <div className={phase === 'over' ? 'paper-pulled' : undefined}
          onClick={open && onPaperClick ? (ev) => { ev.stopPropagation(); onPaperClick(); } : undefined}
          style={{
          position: 'absolute', left: (size - paperW) / 2, width: paperW, top: open ? (phase === 'over' ? -size * 0.5 : out ? -size * 1.02 : -size * 0.27) : H * 0.55,
          opacity: open ? 1 : 0,
          transform: phase === 'out' ? 'rotate(4deg)' : phase === 'over' ? 'rotate(-1.5deg)' : 'rotate(0)', transformOrigin: '50% 100%',
          transition: `top ${phase === 'out' ? '.75s cubic-bezier(.2,.9,.3,1.25)' : (out || !open) ? '.7s ' + ease : '.7s ' + ease} ${open && !out ? '.3s' : '0s'}, transform .75s ${ease}, opacity .2s linear ${open ? '.3s' : '.6s'}, filter .6s`,
          filter: front ? 'drop-shadow(0 14px 22px #000a)' : 'drop-shadow(0 4px 10px #0006)',
          pointerEvents: open && onPaperClick ? 'auto' : 'none', cursor: open && onPaperClick ? 'pointer' : undefined,
        }}>{paper ?? <div style={{ width: paperW, height: paperW * 1.33, background: '#f7f2e8' }} />}</div>
      </div>

      {/* lớp 4: mặt trước (túi) */}
      <svg viewBox="0 0 500 340" style={{ ...full, zIndex: 4, pointerEvents: 'none' }}>
        <path d={m.pocket} style={{ fill: e.color }} />
        {pat && <path d={m.pocket} fill={pat} />}
        <path d={m.pocket} fill={`url(#${id}-sh)`} stroke="#00000022" strokeWidth="1.5" />
      </svg>

      {/* nắp: lật quanh cạnh trên */}
      <svg viewBox="0 0 500 340" style={{
        ...full, zIndex: open ? 2 : 5, transformOrigin: '50% 0', transform: open ? 'scaleY(-1)' : 'scaleY(1)',
        transition: `transform .6s ${ease}, z-index 0s linear .27s`, filter: 'drop-shadow(0 5px 6px #0005)', pointerEvents: 'none',
      }}>
        <path d={m.flap} style={{ fill: open ? mix(e.color, '#000', 86) : mix(e.color, '#fff', 93) }} stroke="#00000024" strokeWidth="1.5" />
        {pat && !open && <path d={m.flap} fill={pat} />}
        {!open && <path d={m.flap} fill={`url(#${id}-sh)`} />}
        <g style={{ opacity: open ? 0 : 1, transition: 'opacity .15s' }}>
          <circle cx="250" cy={m.tip} r="36" style={{ fill: mix(sl.color, '#000', 78) }} />
          <circle cx="250" cy={m.tip - 1} r="33" style={{ fill: sl.color }} />
          <circle cx="250" cy={m.tip - 1} r="25" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="2" />
          <text x="250" y={m.tip + 9} textAnchor="middle" fontSize="28" fill="#fff" fillOpacity=".75" style={{ filter: 'drop-shadow(0 -1px 0 #0006)' }}>{sl.emblem}</text>
        </g>
      </svg>

      {stamp && <div className="env-stamp" style={{ zIndex: 6, width: size * 0.15 }}>{stamp}</div>}
    </div>
  );
}
