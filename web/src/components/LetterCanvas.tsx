import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Circle, Group, Image as KImage, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import { Design, defaultDesign, H, Item, W } from '../design';
import { Border, Fx, tapeTile } from './paperDeco';

export { W, H };
export type { Item, Design };
export const emptyDesign = defaultDesign;

function Pattern({ kind }: { kind: string }) {
  const els: JSX.Element[] = [];
  if (kind === 'lined') for (let y = 80; y < H; y += 36) els.push(<Line key={y} points={[30, y, W - 30, y]} stroke="#00000022" strokeWidth={1} />);
  if (kind === 'grid') {
    for (let y = 30; y < H; y += 30) els.push(<Line key={'h' + y} points={[0, y, W, y]} stroke="#00000014" strokeWidth={1} />);
    for (let x = 30; x < W; x += 30) els.push(<Line key={'v' + x} points={[x, 0, x, H]} stroke="#00000014" strokeWidth={1} />);
  }
  if (kind === 'dots') for (let y = 30; y < H; y += 30) for (let x = 30; x < W; x += 30) els.push(<Rect key={x + '-' + y} x={x} y={y} width={2} height={2} fill="#00000030" />);
  const glyph = (ch: string, step: number, size: number, op: string) => {
    for (let y = 40; y < H; y += step) for (let x = 40 + ((y / step) % 2) * (step / 2); x < W; x += step)
      els.push(<Text key={x + '-' + y} x={x - size / 2} y={y - size / 2} text={ch} fontSize={size} fill={op} />);
  };
  if (kind === 'hearts') glyph('♥', 64, 18, '#c9788a40');
  if (kind === 'stars') glyph('✦', 64, 16, '#b8892b40');
  if (kind === 'flowers') glyph('✿', 70, 20, '#c9788a38');
  if (kind === 'diagonal') for (let k = -H; k < W; k += 28) els.push(<Line key={k} points={[k, 0, k + H, H]} stroke="#00000012" strokeWidth={1} />);
  if (kind === 'notebook') {
    for (let y = 80; y < H; y += 36) els.push(<Line key={y} points={[0, y, W, y]} stroke="#5b8fc933" strokeWidth={1} />);
    els.push(<Line key="m" points={[70, 0, 70, H]} stroke="#d9534f55" strokeWidth={1.5} />);
  }
  return <Group listening={false}>{els}</Group>;
}


const rnd = (i: number, seed: number) => { const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x); };
/** Đường viền giấy: răng cưa theo seed (xé tay / cháy mép). */
function jagged(amp: number, step: number, seed: number) {
  const pts: number[] = []; let i = 0;
  for (let x = 0; x < W; x += step) pts.push(x, rnd(i++, seed) * amp);
  for (let y = 0; y < H; y += step) pts.push(W - rnd(i++, seed) * amp, y);
  for (let x = W; x > 0; x -= step) pts.push(x, H - rnd(i++, seed) * amp * 1.4);
  for (let y = H; y > 0; y -= step) pts.push(rnd(i++, seed) * amp, y);
  return pts;
}
const TORN = jagged(9, 9, 1), BURNT = jagged(16, 7, 2);
const roundedPts = (r: number) => {
  const pts: number[] = [];
  const arc = (cx: number, cy: number, a0: number) => { for (let i = 0; i <= 8; i++) { const a = a0 + (i / 8) * (Math.PI / 2); pts.push(cx + r * Math.cos(a), cy + r * Math.sin(a)); } };
  arc(W - r, r, -Math.PI / 2); arc(W - r, H - r, 0); arc(r, H - r, Math.PI / 2); arc(r, r, Math.PI);
  return pts;
};
const scallopPts = (r: number) => {
  const pts: number[] = []; const arc = (cx: number, cy: number, a0: number) => { for (let i = 0; i <= 8; i++) { const a = a0 + (i / 8) * Math.PI; pts.push(cx + r * Math.cos(a), cy + r * Math.sin(a)); } };
  const nx = Math.round(W / (2 * r)), ny = Math.round(H / (2 * r)), rx = W / nx / 2, ry = H / ny / 2;
  for (let i = 0; i < nx; i++) for (let j = 0; j <= 8; j++) { const a = Math.PI + (j / 8) * Math.PI; pts.push(rx * (2 * i + 1) + rx * Math.cos(a), r * 0.55 + r * 0.55 * Math.sin(a)); }
  for (let i = 0; i < ny; i++) for (let j = 0; j <= 8; j++) { const a = -Math.PI / 2 + (j / 8) * Math.PI; pts.push(W - r * 0.55 + r * 0.55 * Math.cos(a), ry * (2 * i + 1) + ry * Math.sin(a)); }
  for (let i = nx - 1; i >= 0; i--) for (let j = 0; j <= 8; j++) { const a = (j / 8) * Math.PI; pts.push(rx * (2 * i + 1) + rx * Math.cos(a), H - r * 0.55 + r * 0.55 * Math.sin(a)); }
  for (let i = ny - 1; i >= 0; i--) for (let j = 0; j <= 8; j++) { const a = Math.PI / 2 + (j / 8) * Math.PI; pts.push(r * 0.55 + r * 0.55 * Math.cos(a), ry * (2 * i + 1) + ry * Math.sin(a)); }
  void arc; return pts;
};
const cutPts = (c: number) => [c, 0, W - c, 0, W, c, W, H - c, W - c, H, c, H, 0, H - c, 0, c];
const ROUNDED = roundedPts(36), SCALLOP = scallopPts(22), CUT = cutPts(44);
const clipPts = (pts: number[]) => (ctx: any) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); };

function PaperShape({ paper }: { paper: Design['paper'] }) {
  const base = <><Rect name="bg" width={W} height={H} fill={paper.color} /><Pattern kind={paper.pattern} /><Fx kind={paper.fx ?? 'none'} /></>;
  const border = <Border kind={paper.border ?? 'none'} color={/^#[0-9a-f]{6}$/i.test(paper.borderColor ?? '') ? paper.borderColor! : '#c9788a'} />;
  return <>{paperBody(paper, base)}{border}</>;
}

function paperBody(paper: Design['paper'], base: JSX.Element): JSX.Element {
  if (paper.kind === 'stamp') {
    const holes: JSX.Element[] = [];
    for (let x = 12; x < W; x += 24) { holes.push(<Circle key={'t' + x} x={x} y={0} radius={8} fill="#000" globalCompositeOperation="destination-out" listening={false} />, <Circle key={'b' + x} x={x} y={H} radius={8} fill="#000" globalCompositeOperation="destination-out" listening={false} />); }
    for (let y = 12; y < H; y += 24) { holes.push(<Circle key={'l' + y} x={0} y={y} radius={8} fill="#000" globalCompositeOperation="destination-out" listening={false} />, <Circle key={'r' + y} x={W} y={y} radius={8} fill="#000" globalCompositeOperation="destination-out" listening={false} />); }
    return <>{base}<Group listening={false}>{holes}</Group></>;
  }
  if (paper.kind === 'torn') {
    return <><Line points={TORN} closed fill="#ffffff" listening={false} offsetX={-2} offsetY={-1} opacity={0.9} /><Group clipFunc={clipPts(TORN)}>{base}</Group></>;
  }
  if (paper.kind === 'burnt') {
    const g = (x: number, y: number, w: number, h: number, sx: number, sy: number, ex: number, ey: number) =>
      <Rect key={`${x}${y}`} x={x} y={y} width={w} height={h} listening={false} fillLinearGradientStartPoint={{ x: sx, y: sy }} fillLinearGradientEndPoint={{ x: ex, y: ey }} fillLinearGradientColorStops={[0, 'rgba(70,30,5,.85)', 0.45, 'rgba(120,60,15,.35)', 1, 'rgba(120,60,15,0)']} />;
    return <><Group clipFunc={clipPts(BURNT)}>{base}{g(0, 0, W, 90, 0, 0, 0, 90)}{g(0, H - 90, W, 90, 0, 90, 0, 0)}{g(0, 0, 90, H, 0, 0, 90, 0)}{g(W - 90, 0, 90, H, 90, 0, 0, 0)}</Group>
      <Line points={BURNT} closed stroke="#2d1305" strokeWidth={3} listening={false} /></>;
  }
  const shaped = (pts: number[], extra?: JSX.Element) => <><Group clipFunc={clipPts(pts)}>{base}{extra}</Group><Line points={pts} closed stroke="#00000022" strokeWidth={1.5} listening={false} /></>;
  if (paper.kind === 'rounded') return shaped(ROUNDED);
  if (paper.kind === 'scallop') return shaped(SCALLOP);
  if (paper.kind === 'cut') return shaped(CUT);
  if (paper.kind === 'folded') {
    const crease = (y: number, h: number) => <Rect key={y} y={y} width={W} height={h} listening={false} fillLinearGradientStartPoint={{ x: 0, y: 0 }} fillLinearGradientEndPoint={{ x: 0, y: h }} fillLinearGradientColorStops={[0, 'rgba(0,0,0,0)', 0.5, 'rgba(0,0,0,.14)', 0.52, 'rgba(255,255,255,.35)', 1, 'rgba(0,0,0,0)']} />;
    return <>{base}{crease(H / 3 - 20, 40)}{crease((2 * H) / 3 - 20, 40)}</>;
  }
  if (paper.kind === 'frame') {
    const corner = (x: number, y: number, r: number) => <Text key={x + '' + y} x={x} y={y} text="❦" fontSize={26} fill="#00000055" rotation={r} listening={false} />;
    return <>{base}
      <Rect x={18} y={18} width={W - 36} height={H - 36} stroke="#00000040" strokeWidth={2} listening={false} />
      <Rect x={26} y={26} width={W - 52} height={H - 52} stroke="#00000028" strokeWidth={1} listening={false} />
      {corner(36, 34, 0)}{corner(W - 36, 34, 90)}{corner(W - 36, H - 34, 180)}{corner(36, H - 34, 270)}</>;
  }
  return base;
}

/** Đổi màu mực: giữ nguyên độ trong suốt, thay toàn bộ màu bằng màu chọn. */
function tint(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (img: ImageData) => { const d = img.data; for (let i = 0; i < d.length; i += 4) { d[i] = r; d[i + 1] = g; d[i + 2] = b; } };
}
function PageImg({ src, ink }: { src: string; ink?: string | null }) {
  const [img] = useImage(src, 'anonymous');
  const ref = useRef<Konva.Image>(null);
  useEffect(() => {
    const n = ref.current; if (!n || !img) return;
    if (ink && /^#[0-9a-f]{6}$/i.test(ink)) { n.cache({ pixelRatio: 2 }); n.filters([tint(ink)]); } else { n.clearCache(); n.filters([]); }
    n.getLayer()?.batchDraw();
  }, [img, ink]);
  return <KImage ref={ref} image={img} x={0} y={0} width={W} height={H} listening={false} />;
}

function Img({ item, ...rest }: { item: Item } & any) {
  const [img] = useImage(item.src!, 'anonymous');
  return <KImage image={img} {...rest} />;
}

export type CanvasHandle = { toDataURL: () => string };

type Props = {
  design: Design; width: number; page?: number; editable?: boolean; tool?: 'select' | 'draw';
  brush?: { color: string; size: number }; selectedId?: string | null;
  onSelect?: (id: string | null) => void; onEdit?: (id: string) => void; onChange?: (d: Design, commit: boolean) => void;
};

const LetterCanvas = forwardRef<CanvasHandle, Props>(function LetterCanvas(
  { design, width, page = 0, editable, tool = 'select', brush, selectedId, onSelect, onEdit, onChange }, ref) {
  const scale = width / W;
  const stage = useRef<Konva.Stage>(null);
  const tr = useRef<Konva.Transformer>(null);
  const drawing = useRef(false);
  useImperativeHandle(ref, () => ({ toDataURL: () => stage.current!.toDataURL({ pixelRatio: 1 / scale }) }));

  useEffect(() => { // vẽ lại khi web font tải xong
    const redraw = () => stage.current?.batchDraw();
    document.fonts?.ready.then(redraw); document.fonts?.addEventListener?.('loadingdone', redraw);
    return () => document.fonts?.removeEventListener?.('loadingdone', redraw);
  }, []);

  useEffect(() => {
    if (!editable || !tr.current || !stage.current) return;
    const node = selectedId && tool === 'select' ? stage.current.findOne('#' + selectedId) : null;
    tr.current.nodes(node && node.className !== 'Line' ? [node] : []);
    tr.current.getLayer()?.batchDraw();
  }, [selectedId, design, editable, tool]);

  const upd = (id: string, patch: Partial<Item>, commit = true) =>
    onChange?.({ ...design, items: design.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }, commit);

  const pos = () => { const p = stage.current!.getPointerPosition()!; return { x: p.x / scale, y: p.y / scale }; };
  const down = () => {
    if (!editable) return;
    if (tool === 'draw' && brush) {
      drawing.current = true; const p = pos();
      onChange?.({ ...design, items: [...design.items, { id: 'l' + Date.now(), type: 'line', page, x: 0, y: 0, points: [p.x, p.y], stroke: brush.color, strokeWidth: brush.size }] }, false);
    }
  };
  const move = () => {
    if (!drawing.current) return;
    const p = pos(); const last = design.items[design.items.length - 1];
    if (last?.type !== 'line') return;
    onChange?.({ ...design, items: [...design.items.slice(0, -1), { ...last, points: [...last.points!, p.x, p.y] }] }, false);
  };
  const up = () => { if (drawing.current) { drawing.current = false; onChange?.(design, true); } };

  return (
    <Stage ref={stage} width={width} height={H * scale} scaleX={scale} scaleY={scale} className={editable ? 'paper editable' : 'paper'}
      onMouseDown={(e) => { if (e.target === e.target.getStage() || e.target.name() === 'bg') onSelect?.(null); down(); }}
      onTouchStart={(e) => { if (e.target === e.target.getStage() || e.target.name() === 'bg') onSelect?.(null); down(); }}
      onMouseMove={move} onTouchMove={move} onMouseUp={up} onTouchEnd={up}>
      <Layer>
        <PaperShape paper={design.paper} />
        {design.pages?.[page] && <PageImg src={design.pages[page]} ink={design.pageInk?.[page]} />}
        {design.items.filter((it) => (it.page ?? 0) === page).map((it) => {
          const common = {
            key: it.id, id: it.id, x: it.x, y: it.y, rotation: it.rotation ?? 0, opacity: it.opacity ?? 1,
            draggable: editable && tool === 'select',
            onClick: () => editable && tool === 'select' && onSelect?.(it.id),
            onTap: () => editable && tool === 'select' && onSelect?.(it.id),
            onDblClick: () => editable && tool === 'select' && onEdit?.(it.id), onDblTap: () => editable && tool === 'select' && onEdit?.(it.id),
            onDragStart: () => editable && tool === 'select' && onSelect?.(it.id),
            onDragEnd: (e: any) => upd(it.id, { x: e.target.x(), y: e.target.y() }),
            onTransformEnd: (e: any) => {
              const n = e.target as Konva.Node; const sx = n.scaleX(), sy = n.scaleY();
              n.scaleX(1); n.scaleY(1);
              if (it.type === 'image' || it.type === 'tape') upd(it.id, { x: n.x(), y: n.y(), rotation: n.rotation(), width: n.width() * sx, height: n.height() * sy });
              else if (it.type === 'sticker') upd(it.id, { x: n.x(), y: n.y(), rotation: n.rotation(), fontSize: (it.fontSize ?? 64) * sx });
              else upd(it.id, { x: n.x(), y: n.y(), rotation: n.rotation(), width: Math.max(40, n.width() * sx), fontSize: (it.fontSize ?? 28) * (sy > 0 ? sy : 1) });
            },
          };
          if (it.type === 'line') return <Line {...common} points={it.points} stroke={it.stroke} strokeWidth={it.strokeWidth} lineCap="round" lineJoin="round" tension={0.4} listening={!!editable && tool === 'select'} hitStrokeWidth={Math.max(20, it.strokeWidth ?? 0)} shadowColor="#8aa4b5" shadowBlur={selectedId === it.id ? 12 : 0} />;
          if (it.type === 'image') return <Img item={it} {...common} width={it.width} height={it.height} />;
          if (it.type === 'tape') return <Rect {...common} width={it.width ?? 150} height={it.height ?? 38} fillPatternImage={tapeTile(it.text ?? 'solid', it.fill ?? '#f4b6c2') as any} fillPatternScale={{ x: 0.5, y: 0.5 }}
            shadowColor="#000" shadowBlur={4} shadowOpacity={0.18} shadowOffsetY={1.5} />;
          if (it.type === 'sticker') return <Text {...common} text={it.text} fontSize={it.fontSize ?? 64} fill={it.fill} />;
          return <Text {...common} text={it.text} width={it.width ?? 360} fontFamily={it.fontFamily} fontSize={it.fontSize ?? 28} fill={it.fill}
            fontStyle={`${it.italic ? 'italic ' : ''}${it.bold ? 'bold' : 'normal'}`} align={it.align ?? 'left'} lineHeight={1.3}
            letterSpacing={it.spacing ?? 0} textDecoration={it.underline ? 'underline' : ''}
            stroke={it.outline} strokeWidth={it.outline ? Math.max(1, (it.fontSize ?? 28) / 16) : 0} fillAfterStrokeEnabled
            shadowColor="#000" shadowBlur={it.shadow ? 5 : 0} shadowOpacity={0.35} shadowOffsetX={it.shadow ? 2 : 0} shadowOffsetY={it.shadow ? 2 : 0} />;
        })}
        {editable && <Transformer ref={tr} rotateEnabled keepRatio={false} borderStroke="#8aa4b5" anchorStroke="#8aa4b5" anchorSize={14} />}
      </Layer>
    </Stage>
  );
});
export default LetterCanvas;
