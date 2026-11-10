import { useEffect, useRef } from 'react';
import {
  BoxGeometry, CircleGeometry, Color, CylinderGeometry, DirectionalLight, DoubleSide, Group, HemisphereLight, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, PerspectiveCamera, Scene, Shape, ShapeGeometry, TorusGeometry, Vector2, WebGLRenderer,
} from 'three';
import { ENVELOPES } from './Envelope';

/**
 * Phong bì 3D: kéo để xoay (có quán tính), mở nắp khi rê chuột / nhấn giữ / chạm 1 lần.
 * Khởi tạo WebGL MỘT lần; đổi mẫu chỉ nội suy màu (không tạo lại renderer) nên không bị chớp.
 * Tạm dừng khi ngoài màn hình hoặc tab ẩn; chuyển động không phụ thuộc tần số quét màn hình.
 */
export default function Envelope3D({ kind = 'classic', height = 420, sealColor = '#9a1f2c' }: { kind?: string; height?: number; sealColor?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const hRef = useRef(height); hRef.current = height;
  // màu đích — thay đổi khi props đổi, vòng lặp sẽ nội suy dần
  const target = useRef({ kind, seal: sealColor, nudge: 0 });
  useEffect(() => { target.current.kind = kind; target.current.seal = sealColor; target.current.nudge = 1; }, [kind, sealColor]);

  useEffect(() => {
    const el = host.current!;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    const cv = renderer.domElement;
    cv.style.cssText = 'display:block;width:100%;opacity:0;transition:opacity .6s ease;touch-action:pan-y;cursor:grab;outline:none';
    el.appendChild(cv);

    const scene = new Scene();
    const cam = new PerspectiveCamera(35, 1, 0.1, 50); cam.position.set(0, 0, 9);
    scene.add(new HemisphereLight(0xffffff, 0x2a1d21, 1.15));
    const sun = new DirectionalLight(0xfff3e6, 2); sun.position.set(3, 5, 6); scene.add(sun);
    const rim = new DirectionalLight(0xffc9d4, 0.8); rim.position.set(-4, 2, -3); scene.add(rim);

    const e0 = ENVELOPES[target.current.kind] ?? ENVELOPES.classic;
    const W = 4.4, H = 3.1, D = 0.14;
    const std = (c: string | number | Color, roughness = 0.85, extra: object = {}) => new MeshStandardMaterial({ color: c, roughness, ...extra });
    const bodyM = std(e0.body), flapM = std(e0.flap, 0.8, { side: DoubleSide });
    const frontM = std(new Color(e0.body).offsetHSL(0, 0, 0.03), 0.85, { side: DoubleSide });
    const bottomM = std(new Color(e0.body).offsetHSL(0, 0, -0.04));
    const sealM = std(target.current.seal, 0.35, { metalness: 0.1 }), ringM = std(0x6e1420, 0.4);
    const paperM = std(0xf5f0e6, 1);

    const group = new Group(); scene.add(group);
    group.add(new Mesh(new BoxGeometry(W, H, D), bodyM));
    const paper = new Mesh(new BoxGeometry(W * 0.9, H * 0.85, 0.02), paperM); paper.position.z = D / 2 + 0.01; group.add(paper);
    const tri = (pts: number[][]) => new ShapeGeometry(new Shape(pts.map(([x, y]) => new Vector2(x, y))));
    const front = new Group(); front.position.z = D / 2 + 0.03; group.add(front);
    front.add(new Mesh(tri([[-W / 2, H / 2], [0, -0.1], [-W / 2, -H / 2]]), frontM));
    front.add(new Mesh(tri([[W / 2, H / 2], [0, -0.1], [W / 2, -H / 2]]), frontM));
    front.add(new Mesh(tri([[-W / 2, -H / 2], [0, -0.1], [W / 2, -H / 2]]), bottomM));
    const hinge = new Group(); hinge.position.set(0, H / 2, D / 2 + 0.05); group.add(hinge);
    hinge.add(new Mesh(tri([[-W / 2, 0], [W / 2, 0], [0, -H * 0.62]]), flapM));
    const seal = new Mesh(new CylinderGeometry(0.34, 0.38, 0.08, 40), sealM);
    seal.rotation.x = Math.PI / 2; seal.position.set(0, -H * 0.62, 0.06); hinge.add(seal);
    const ring = new Mesh(new TorusGeometry(0.22, 0.03, 12, 40), ringM); ring.position.set(0, -H * 0.62, 0.12); hinge.add(ring);
    const shadowM = new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false });
    const shadow = new Mesh(new CircleGeometry(2.6, 40), shadowM); shadow.scale.y = 0.18; shadow.position.y = -2.3; scene.add(shadow);

    // ---------- trạng thái chuyển động ----------
    let rotY = 0.25, vel = 0, flap = 0, intro = reduce ? 1 : 0, pop = 0;
    let dragging = false, hover = false, pressed = false, locked = false;
    let lastX = 0, lastT = 0, downX = 0, downT = 0;
    const tmp = new Color();
    const k = (rate: number, dt: number) => 1 - Math.exp(-rate * dt); // hệ số nội suy độc lập FPS

    cv.addEventListener('pointerdown', (ev) => {
      dragging = pressed = true; lastX = downX = ev.clientX; lastT = downT = performance.now(); vel = 0;
      cv.setPointerCapture(ev.pointerId); cv.style.cursor = 'grabbing';
    });
    cv.addEventListener('pointermove', (ev) => {
      if (!dragging) return;
      const now = performance.now(), dx = ev.clientX - lastX, dtm = Math.max(1, now - lastT);
      rotY += dx * 0.01; vel = (dx * 0.01) / (dtm / 1000); // rad/giây
      lastX = ev.clientX; lastT = now;
    });
    const end = (ev: PointerEvent) => {
      if (!dragging) return; dragging = pressed = false; cv.style.cursor = 'grab';
      if (performance.now() - lastT > 80) vel = 0; // dừng tay trước khi thả → không văng
      if (ev.type === 'pointerup' && Math.abs(ev.clientX - downX) < 6 && performance.now() - downT < 280 && ev.pointerType !== 'mouse') locked = !locked; // chạm 1 lần để mở/đóng (điện thoại)
    };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('pointerenter', (ev) => { if (ev.pointerType === 'mouse') hover = true; });
    cv.addEventListener('pointerleave', () => { hover = false; });
    cv.addEventListener('webglcontextlost', (ev) => ev.preventDefault());

    // ---------- kích thước ----------
    const resize = () => {
      const w = el.clientWidth, h = hRef.current; if (!w) return;
      const cur = renderer.getSize(new Vector2());
      if (cur.x !== w || cur.y !== h) { renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    };
    resize(); const ro = new ResizeObserver(resize); ro.observe(el);

    // ---------- vòng lặp (dừng khi không nhìn thấy) ----------
    let raf = 0, last = 0, t = 0, onScreen = true, first = true;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; t += dt;
      resize();

      if (target.current.nudge) { pop = 1; vel += 1.2; target.current.nudge = 0; } // phản hồi khi đổi mẫu
      if (!dragging) {
        rotY += vel * dt; vel *= Math.exp(-3.2 * dt);
        if (!reduce) rotY += (Math.sin(t * 0.6) * 0.35 - rotY) * k(0.9, dt); // quay về vị trí đung đưa
        else rotY += (0.25 - rotY) * k(1.5, dt);
      }
      intro += (1 - intro) * k(3.2, dt); pop += (0 - pop) * k(5, dt);
      const open = pressed || hover || locked ? 1 : 0;
      flap += (open - flap) * k(7, dt);
      const sway = reduce ? 0 : 1, bob = Math.sin(t * 1.1) * 0.08 * sway;

      group.rotation.y = rotY; group.rotation.x = -0.05 + Math.sin(t * 0.9) * 0.03 * sway;
      group.position.y = bob - (1 - intro) * 0.6;
      const s = (0.88 + 0.12 * intro) * (1 + pop * 0.035); group.scale.setScalar(s);
      hinge.rotation.x = -flap * Math.PI * 0.9;
      seal.visible = ring.visible = flap < 0.5;
      paper.position.y = flap * 0.5;
      shadow.scale.x = 1 - bob * 0.6; shadowM.opacity = 0.22 * (0.4 + 0.6 * intro);

      // nội suy màu sang mẫu đích
      const e = ENVELOPES[target.current.kind] ?? ENVELOPES.classic, kc = k(6, dt);
      bodyM.color.lerp(tmp.set(e.body), kc);
      flapM.color.lerp(tmp.set(e.flap), kc);
      frontM.color.lerp(tmp.set(e.body).offsetHSL(0, 0, 0.03), kc);
      bottomM.color.lerp(tmp.set(e.body).offsetHSL(0, 0, -0.04), kc);
      sealM.color.lerp(tmp.set(target.current.seal), kc);

      renderer.render(scene, cam);
      if (first) { first = false; cv.style.opacity = '1'; } // hiện mượt sau khung hình đầu tiên
    };
    const start = () => { if (!raf && onScreen && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const io = new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; onScreen ? start() : stop(); }, { threshold: 0.01 });
    io.observe(el);
    const vis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', vis);
    start();

    return () => {
      stop(); io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', vis);
      scene.traverse((o: any) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
      renderer.dispose(); renderer.forceContextLoss(); if (cv.parentNode === el) el.removeChild(cv);
    };
  }, []);

  return <div ref={host} style={{ width: '100%', minHeight: height }} aria-hidden="true" />;
}
