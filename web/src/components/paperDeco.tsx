import { Circle, Group, Line, Rect, Shape, Text } from 'react-konva';
import { H, W } from '../design';

const nat = (c: any) => c._context as CanvasRenderingContext2D;
const rnd = (i: number, seed: number) => { const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x); };

/** Viền trang trí vẽ đè lên giấy. */
export function Border({ kind, color }: { kind: string; color: string }) {
  if (!kind || kind === 'none') return null;
  const els: JSX.Element[] = [];
  const m = 18; // lề viền
  const rect = (inset: number, sw: number, op = 1, dash?: number[]) =>
    <Rect key={`r${inset}${sw}`} x={inset} y={inset} width={W - inset * 2} height={H - inset * 2} stroke={color} strokeWidth={sw} opacity={op} dash={dash} />;
  // điểm dọc 4 cạnh, cách nhau `step`, lùi vào `inset`
  const along = (inset: number, step: number, fn: (x: number, y: number, side: number, i: number) => JSX.Element) => {
    let i = 0;
    for (let x = inset + step / 2; x < W - inset; x += step) { els.push(fn(x, inset, 0, i++)); els.push(fn(x, H - inset, 2, i++)); }
    for (let y = inset + step * 1.5; y < H - inset - step / 2; y += step) { els.push(fn(inset, y, 3, i++)); els.push(fn(W - inset, y, 1, i++)); }
  };
  const glyph = (ch: string, size: number, op = 0.9) => (x: number, y: number, _s: number, i: number) =>
    <Text key={'g' + i} x={x - size / 2} y={y - size / 2} text={ch} fontSize={size} fill={color} opacity={op} />;
  const corner = (ch: string, size: number, inset: number) => [
    { x: inset, y: inset, r: 0 }, { x: W - inset, y: inset, r: 90 }, { x: W - inset, y: H - inset, r: 180 }, { x: inset, y: H - inset, r: 270 },
  ].map((c, i) => <Text key={'c' + i} x={c.x} y={c.y} text={ch} fontSize={size} fill={color} rotation={c.r} offsetX={size / 2} offsetY={size / 2} />);

  switch (kind) {
    case 'single': els.push(rect(m, 2.5)); break;
    case 'double': els.push(rect(m, 3), rect(m + 9, 1.2)); break;
    case 'dashed': els.push(rect(m + 4, 2.5, 0.9, [12, 7])); break;
    case 'floral': els.push(rect(m + 6, 1.6, 0.8), ...corner('❦', 44, m + 14), ...corner('✿', 18, m + 46)); break;
    case 'hearts': els.push(rect(m + 16, 1, 0.45)); along(m + 2, 30, glyph('♥', 17)); break;
    case 'stars': els.push(rect(m + 16, 1, 0.45)); along(m + 2, 30, glyph('✦', 16)); break;
    case 'dots': along(m + 4, 22, (x, y, _s, i) => <Circle key={'d' + i} x={x} y={y} radius={i % 2 ? 3.4 : 2.2} fill={color} opacity={0.85} />); break;
    case 'lace': {
      els.push(rect(m + 14, 1.2, 0.7));
      along(m + 4, 18, (x, y, _s, i) => <Circle key={'l' + i} x={x} y={y} radius={8} stroke={color} strokeWidth={1.4} opacity={0.85} fillEnabled={false}
        listening={false} />);
      break;
    }
    case 'ribbon':
      els.push(<Rect key="rb" x={m} y={m} width={W - m * 2} height={H - m * 2} stroke={color} strokeWidth={14} opacity={0.38} cornerRadius={4} />,
        rect(m + 12, 1.2, 0.7), rect(m - 6, 1.2, 0.7),
        <Text key="bow" x={W / 2 - 18} y={2} text="🎀" fontSize={36} />);
      break;
    case 'vines': {
      els.push(rect(m + 8, 1, 0.5));
      along(m + 2, 34, (x, y, s, i) => <Text key={'v' + i} x={x} y={y} text="❧" fontSize={24} fill={color} opacity={0.9} offsetX={12} offsetY={12} rotation={s * 90 + (i % 2 ? 180 : 0)} />);
      els.push(...corner('❦', 34, m + 6));
      break;
    }
    case 'ornate': {
      const g = '#b8892b';
      els.push(<Rect key="o1" x={m} y={m} width={W - m * 2} height={H - m * 2} stroke={color} strokeWidth={3} />,
        <Rect key="o2" x={m + 8} y={m + 8} width={W - m * 2 - 16} height={H - m * 2 - 16} stroke={color} strokeWidth={1} opacity={0.7} />);
      [[m, m], [W - m, m], [W - m, H - m], [m, H - m]].forEach(([x, y], i) => els.push(
        <Rect key={'ob' + i} x={x} y={y} width={22} height={22} offsetX={11} offsetY={11} rotation={45} fill={g} stroke={color} strokeWidth={1.5} />,
        <Circle key={'oc' + i} x={x} y={y} radius={3.5} fill="#fff" opacity={0.9} />));
      [[W / 2, m], [W / 2, H - m], [m, H / 2], [W - m, H / 2]].forEach(([x, y], i) => els.push(
        <Rect key={'om' + i} x={x} y={y} width={12} height={12} offsetX={6} offsetY={6} rotation={45} fill={color} />));
      break;
    }
    case 'lights': {
      const cols = ['#e8505b', '#f6c453', '#5bbf8a', '#5b9be0', '#c77dd6'];
      els.push(<Shape key="wire" listening={false} sceneFunc={(c) => { const ctx = nat(c);
        ctx.beginPath(); ctx.moveTo(0, 8);
        const n = 6, w = W / n; for (let i = 0; i < n; i++) ctx.quadraticCurveTo(w * i + w / 2, 46, w * (i + 1), 8);
        ctx.strokeStyle = '#2c3e2f'; ctx.lineWidth = 2; ctx.stroke();
      }} />);
      for (let i = 0; i < 6; i++) for (let k = 1; k <= 3; k++) {
        const t = k / 4, x = (i + t) * (W / 6), y = 2 * (1 - t) * t * 46 + 8 * ((1 - t) * (1 - t) + t * t);
        els.push(<Circle key={`b${i}${k}`} x={x} y={y + 7} radius={7} fill={cols[(i * 3 + k) % 5]} shadowColor={cols[(i * 3 + k) % 5]} shadowBlur={10} opacity={0.95} />);
      }
      break;
    }
  }
  return <Group listening={false}>{els}</Group>;
}

/** Hiệu ứng bề mặt giấy (đặt dưới chữ, bị cắt theo hình tờ giấy). */
export function Fx({ kind }: { kind: string }) {
  if (!kind || kind === 'none') return null;
  const grad = (key: string, x: number, y: number, w: number, h: number, sx: number, sy: number, ex: number, ey: number, c0: string) =>
    <Rect key={key} x={x} y={y} width={w} height={h} fillLinearGradientStartPoint={{ x: sx, y: sy }} fillLinearGradientEndPoint={{ x: ex, y: ey }}
      fillLinearGradientColorStops={[0, c0, 1, 'rgba(0,0,0,0)']} />;
  switch (kind) {
    case 'aged': {
      const c = 'rgba(150,100,30,.24)', d = 110;
      return <Group listening={false}>
        <Rect width={W} height={H} fill="rgba(210,170,90,.14)" />
        {grad('t', 0, 0, W, d, 0, 0, 0, d, c)}{grad('b', 0, H - d, W, d, 0, d, 0, 0, c)}{grad('l', 0, 0, d, H, 0, 0, d, 0, c)}{grad('r', W - d, 0, d, H, d, 0, 0, 0, c)}
      </Group>;
    }
    case 'coffee': {
      const ring = (x: number, y: number, r: number, k: number) => <Group key={k}>
        <Circle x={x} y={y} radius={r} fill="rgba(140,90,40,.08)" /><Circle x={x} y={y} radius={r} stroke="rgba(120,70,25,.38)" strokeWidth={4} />
        <Circle x={x + 3} y={y + 2} radius={r - 7} stroke="rgba(120,70,25,.16)" strokeWidth={2} />
      </Group>;
      return <Group listening={false}>{ring(W - 120, H - 130, 62, 1)}{ring(110, 90, 34, 2)}
        <Circle x={W - 60} y={90} radius={9} fill="rgba(120,70,25,.22)" /><Circle x={70} y={H - 60} radius={6} fill="rgba(120,70,25,.2)" /></Group>;
    }
    case 'foxing':
      return <Shape listening={false} sceneFunc={(c) => { const ctx = nat(c);
        for (let i = 0; i < 70; i++) { const x = rnd(i, 3) * W, y = rnd(i, 7) * H, r = 1 + rnd(i, 11) * 5;
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = `rgba(150,95,40,${0.1 + rnd(i, 13) * 0.22})`; ctx.fill(); }
      }} />;
    case 'grain':
      return <Shape listening={false} sceneFunc={(c) => { const ctx = nat(c);
        for (let i = 0; i < 2600; i++) { ctx.fillStyle = i % 2 ? 'rgba(90,70,40,.16)' : 'rgba(255,255,255,.55)'; ctx.fillRect(rnd(i, 5) * W, rnd(i, 9) * H, 1.8, 1.8); }
      }} />;
    case 'crumple':
      return <Shape listening={false} sceneFunc={(c) => { const ctx = nat(c);
        for (let i = 0; i < 26; i++) {
          const x = rnd(i, 21) * W, y = rnd(i, 22) * H, a = rnd(i, 23) * Math.PI, l = 140 + rnd(i, 24) * 360;
          const dx = Math.cos(a) * l, dy = Math.sin(a) * l;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(0,0,0,.09)'; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + 2, y + 1); ctx.lineTo(x + dx + 2, y + dy + 1); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.stroke();
        }
      }} />;
    case 'wash': {
      const blob = (x: number, y: number, r: number, c: string, k: number) =>
        <Circle key={k} x={x} y={y} radius={r} fillRadialGradientStartPoint={{ x: 0, y: 0 }} fillRadialGradientEndPoint={{ x: 0, y: 0 }}
          fillRadialGradientStartRadius={0} fillRadialGradientEndRadius={r} fillRadialGradientColorStops={[0, c, 1, 'rgba(255,255,255,0)']} />;
      return <Group listening={false}>{blob(80, 90, 230, 'rgba(240,150,170,.45)', 1)}{blob(W - 60, 160, 200, 'rgba(150,190,230,.40)', 2)}{blob(W / 2, H - 70, 260, 'rgba(250,210,150,.40)', 3)}</Group>;
    }
    case 'glitter':
      return <Shape listening={false} sceneFunc={(c) => { const ctx = nat(c);
        for (let i = 0; i < 90; i++) { const x = rnd(i, 31) * W, y = rnd(i, 32) * H, r = 1 + rnd(i, 33) * 3.2;
          ctx.fillStyle = i % 3 ? 'rgba(212,170,70,.75)' : 'rgba(255,255,255,.9)';
          ctx.beginPath(); ctx.moveTo(x, y - r * 2); ctx.lineTo(x + r * 0.5, y - r * 0.5); ctx.lineTo(x + r * 2, y); ctx.lineTo(x + r * 0.5, y + r * 0.5);
          ctx.lineTo(x, y + r * 2); ctx.lineTo(x - r * 0.5, y + r * 0.5); ctx.lineTo(x - r * 2, y); ctx.lineTo(x - r * 0.5, y - r * 0.5); ctx.closePath(); ctx.fill(); }
      }} />;
  }
  return null;
}

/** Ô hoạ tiết cho băng dính washi (canvas lặp). */
const tiles = new Map<string, HTMLCanvasElement>();
export function tapeTile(kind: string, color: string): HTMLCanvasElement {
  const key = kind + color; const hit = tiles.get(key); if (hit) return hit;
  const S = 24, k = 2; const c = document.createElement('canvas'); c.width = S * k; c.height = S * k;
  const x = c.getContext('2d')!; x.scale(k, k);
  x.fillStyle = color; x.fillRect(0, 0, S, S);
  const white = 'rgba(255,255,255,.7)'; x.fillStyle = white; x.strokeStyle = white; x.lineWidth = 5;
  if (kind === 'stripes') { for (const o of [-S, 0, S]) { x.beginPath(); x.moveTo(o, S); x.lineTo(o + S, 0); x.stroke(); } }
  if (kind === 'dots') { for (const [a, b] of [[7, 7], [19, 19]]) { x.beginPath(); x.arc(a, b, 3, 0, 7); x.fill(); } }
  if (kind === 'checks') { x.fillRect(0, 0, S / 2, S / 2); x.fillRect(S / 2, S / 2, S / 2, S / 2); }
  if (kind === 'zigzag') { x.lineWidth = 2.5; x.beginPath(); for (let i = 0; i <= 4; i++) x.lineTo(i * 6, i % 2 ? 8 : 16); x.stroke(); x.beginPath(); for (let i = 0; i <= 4; i++) x.lineTo(i * 6, i % 2 ? 20 : 28); x.stroke(); }
  if (kind === 'hearts' || kind === 'stars' || kind === 'flowers') { x.font = '15px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(kind === 'hearts' ? '♥' : kind === 'stars' ? '✦' : '✿', S / 2, S / 2 + 1); }
  tiles.set(key, c); return c;
}
