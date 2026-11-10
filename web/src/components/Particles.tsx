import { useEffect, useRef } from 'react';

type P = { x: number; y: number; vx: number; vy: number; s: number; r: number; vr: number; c: string; ph: number; a: number; life?: number };
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const PINK = ['#f48fb1', '#ec6f95', '#e8506f', '#f8bbd0', '#ff8a9b'];
const CONF = ['#f0c987', '#f29e8e', '#7bc9d6', '#b39ddb', '#f48fb1', '#a5d6a7', '#fff3b0'];

const heartPath = (c: CanvasRenderingContext2D, s: number) => {
  c.beginPath(); c.moveTo(0, s * 0.35);
  c.bezierCurveTo(-s, -s * 0.35, -s * 0.5, -s, 0, -s * 0.4);
  c.bezierCurveTo(s * 0.5, -s, s, -s * 0.35, 0, s * 0.35); c.closePath();
};
const petalPath = (c: CanvasRenderingContext2D, s: number) => {
  c.beginPath(); c.moveTo(0, -s); c.bezierCurveTo(s * 0.9, -s * 0.5, s * 0.7, s * 0.6, 0, s); c.bezierCurveTo(-s * 0.7, s * 0.6, -s * 0.9, -s * 0.5, 0, -s); c.closePath();
};
const starPath = (c: CanvasRenderingContext2D, s: number) => {
  c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.25, -s * 0.25); c.lineTo(s, 0); c.lineTo(s * 0.25, s * 0.25); c.lineTo(0, s); c.lineTo(-s * 0.25, s * 0.25); c.lineTo(-s, 0); c.lineTo(-s * 0.25, -s * 0.25); c.closePath();
};

function spawn(effect: string, w: number, h: number, initial: boolean): P {
  const base: P = { x: rnd(0, w), y: initial ? rnd(0, h) : -20, vx: 0, vy: 0, s: 8, r: rnd(0, 6.28), vr: rnd(-1, 1), c: '#fff', ph: rnd(0, 6.28), a: 1 };
  switch (effect) {
    case 'hearts': return { ...base, y: initial ? rnd(0, h) : h + 30, vy: -rnd(28, 70), vx: rnd(-8, 8), s: rnd(7, 15), c: pick(PINK), r: 0, vr: 0, a: rnd(0.55, 0.95) };
    case 'petals': return { ...base, vy: rnd(30, 70), vx: rnd(-18, 18), s: rnd(6, 11), c: pick(['#f8bbd0', '#f48fb1', '#fce4ec', '#f6a5c0']), vr: rnd(-2, 2), a: 0.9 };
    case 'confetti': return { ...base, vy: rnd(70, 150), vx: rnd(-25, 25), s: rnd(4, 7), c: pick(CONF), vr: rnd(-6, 6) };
    case 'snow': return { ...base, vy: rnd(25, 60), vx: rnd(-10, 10), s: rnd(1.5, 4), c: '#ffffff', a: rnd(0.5, 0.95) };
    case 'stars': return { ...base, y: rnd(0, h), vx: 0, vy: 0, s: rnd(3, 8), c: pick(['#fff3b0', '#ffffff', '#f0c987']) };
    case 'bubbles': return { ...base, y: initial ? rnd(0, h) : h + 30, vy: -rnd(25, 60), vx: rnd(-10, 10), s: rnd(5, 18), c: '#bfe3ff', a: rnd(0.35, 0.7) };
    case 'fireflies': return { ...base, y: rnd(0, h), vx: rnd(-14, 14), vy: rnd(-14, 14), s: rnd(2, 4.5), c: pick(['#fff59d', '#ffe082', '#f0f4a3']) };
    case 'sparkle': return { ...base, vy: rnd(25, 60), vx: rnd(-12, 12), s: rnd(3, 7), c: pick(['#f0c987', '#ffe9a8', '#ffffff', '#e8b44f']), vr: rnd(-3, 3) };
    default: return base;
  }
}

/** Hiệu ứng hạt (tim bay, cánh hoa, kim tuyến…). Tự tạm dừng khi tab ẩn, tắt khi người dùng bật "giảm chuyển động". */
export default function Particles({ effect, burst = 0, contained = false }: { effect: string; burst?: number; contained?: boolean }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const bump = useRef(0);
  useEffect(() => { bump.current = burst; }, [burst]);

  useEffect(() => {
    const canvas = cv.current; if (!canvas || !effect || effect === 'none') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let w = 0, h = 0, raf = 0, last = performance.now(), seenBurst = bump.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = () => {
      const el = contained ? canvas.parentElement! : null;
      w = el ? el.clientWidth : window.innerWidth; h = el ? el.clientHeight : window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const count = () => Math.round(Math.min(contained ? 26 : 56, Math.max(14, (w * h) / (contained ? 14000 : 20000))));
    const ps: P[] = Array.from({ length: count() }, () => spawn(effect, w, h, true));
    const onResize = () => size();
    window.addEventListener('resize', onResize);
    const ro = contained && canvas.parentElement ? new ResizeObserver(size) : null; ro?.observe(canvas.parentElement!);

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; const t = now / 1000;
      if (bump.current !== seenBurst) { seenBurst = bump.current; for (let i = 0; i < 40; i++) { const p = spawn(effect, w, h, false); if (effect === 'confetti') { p.x = w / 2 + rnd(-30, 30); p.y = h * 0.4; p.vx = rnd(-260, 260); p.vy = rnd(-320, -60); p.life = 2.2; } else if (effect === 'hearts') { p.y = h + 10; p.vy *= 2.2; } else { p.y = rnd(-h * 0.3, 0); } ps.push(p); } }
      ctx.clearRect(0, 0, w, h);
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        if (effect === 'confetti' && p.life !== undefined) { p.vy += 380 * dt; p.vx *= 1 - 0.8 * dt; p.life -= dt; if (p.life <= 0) p.life = undefined; }
        p.x += (p.vx + (effect === 'fireflies' ? Math.sin(t * 0.8 + p.ph) * 12 : Math.sin(t + p.ph) * 14)) * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        if (effect === 'fireflies') { p.vx += rnd(-30, 30) * dt; p.vy += rnd(-30, 30) * dt; p.vx = Math.max(-18, Math.min(18, p.vx)); p.vy = Math.max(-18, Math.min(18, p.vy)); if (p.x < 0) p.x = w; if (p.x > w) p.x = 0; if (p.y < 0) p.y = h; if (p.y > h) p.y = 0; }
        const out = effect === 'hearts' || effect === 'bubbles' ? p.y < -40 : effect === 'stars' || effect === 'fireflies' ? false : p.y > h + 30;
        if (out) { ps[i] = spawn(effect, w, h, false); if (ps.length > count() + 4) ps.splice(i, 1); continue; }
        ctx.save(); ctx.translate(p.x, p.y);
        let alpha = p.a;
        if (effect === 'stars') alpha = 0.25 + 0.75 * Math.abs(Math.sin(t * 1.4 + p.ph));
        if (effect === 'fireflies') alpha = 0.2 + 0.8 * Math.abs(Math.sin(t * 1.1 + p.ph));
        ctx.globalAlpha = alpha; ctx.fillStyle = p.c; ctx.strokeStyle = p.c;
        if (effect === 'hearts') { ctx.rotate(Math.sin(t + p.ph) * 0.3); heartPath(ctx, p.s); ctx.fill(); }
        else if (effect === 'petals') { ctx.rotate(p.r); ctx.scale(1, 0.7 + 0.3 * Math.sin(t * 2 + p.ph)); petalPath(ctx, p.s); ctx.fill(); }
        else if (effect === 'confetti') { ctx.rotate(p.r); ctx.scale(1, Math.sin(t * 5 + p.ph)); ctx.fillRect(-p.s, -p.s * 0.5, p.s * 2, p.s); }
        else if (effect === 'snow') { ctx.beginPath(); ctx.arc(0, 0, p.s, 0, 6.3); ctx.fill(); }
        else if (effect === 'stars') { ctx.rotate(p.r * 0.2); starPath(ctx, p.s); ctx.fill(); }
        else if (effect === 'bubbles') { ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, p.s, 0, 6.3); ctx.stroke(); ctx.globalAlpha = alpha * 0.25; ctx.fill(); }
        else if (effect === 'fireflies') { ctx.shadowColor = p.c; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(0, 0, p.s, 0, 6.3); ctx.fill(); }
        else if (effect === 'sparkle') { ctx.rotate(p.r); ctx.globalAlpha = alpha * (0.5 + 0.5 * Math.abs(Math.sin(t * 4 + p.ph))); starPath(ctx, p.s); ctx.fill(); }
        ctx.restore();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); ro?.disconnect(); };
  }, [effect, contained]);

  if (!effect || effect === 'none') return null;
  return <canvas ref={cv} className={'fxlayer' + (contained ? ' in' : '')} aria-hidden="true" style={{ width: '100%', height: '100%' }} />;
}
