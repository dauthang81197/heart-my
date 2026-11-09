import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ENVELOPES } from './Envelope';

/** Phong bì 3D: kéo để xoay, tự đung đưa nhẹ, nắp mở khi hover/chạm giữ. */
export default function Envelope3D({ kind = 'classic', height = 420, sealColor = '#9a1f2c' }: { kind?: string; height?: number; sealColor?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const e = ENVELOPES[kind] ?? ENVELOPES.classic;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 50); cam.position.set(0, 0, 9);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 2); sun.position.set(3, 5, 6); sun.castShadow = true; scene.add(sun);

    const W = 4.4, H = 3.1, D = 0.14;
    const body = new THREE.MeshStandardMaterial({ color: e.body, roughness: 0.85 });
    const flapMat = new THREE.MeshStandardMaterial({ color: e.flap, roughness: 0.8, side: THREE.DoubleSide });
    const group = new THREE.Group(); scene.add(group);
    group.add(new THREE.Mesh(new THREE.BoxGeometry(W, H, D), body));
    // giấy bên trong
    const paper = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, H * 0.85, 0.02), new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 1 }));
    paper.position.z = D / 2 + 0.01; group.add(paper);
    // mặt trước: hai tam giác trái/phải + đáy
    const tri = (pts: number[][]) => { const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))); return new THREE.ShapeGeometry(s); };
    const fm = new THREE.MeshStandardMaterial({ color: new THREE.Color(e.body).offsetHSL(0, 0, 0.03), roughness: 0.85, side: THREE.DoubleSide });
    const front = new THREE.Group(); front.position.z = D / 2 + 0.03; group.add(front);
    front.add(new THREE.Mesh(tri([[-W / 2, H / 2], [0, -0.1], [-W / 2, -H / 2]]), fm));
    front.add(new THREE.Mesh(tri([[W / 2, H / 2], [0, -0.1], [W / 2, -H / 2]]), fm));
    front.add(new THREE.Mesh(tri([[-W / 2, -H / 2], [0, -0.1], [W / 2, -H / 2]]), new THREE.MeshStandardMaterial({ color: new THREE.Color(e.body).offsetHSL(0, 0, -0.04), roughness: 0.85 })));
    // nắp (bản lề ở cạnh trên)
    const hinge = new THREE.Group(); hinge.position.set(0, H / 2, D / 2 + 0.05); group.add(hinge);
    const flap = new THREE.Mesh(tri([[-W / 2, 0], [W / 2, 0], [0, -H * 0.62]]), flapMat); hinge.add(flap);
    // dấu sáp
    const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.08, 40), new THREE.MeshStandardMaterial({ color: sealColor, roughness: 0.35, metalness: 0.1 }));
    seal.rotation.x = Math.PI / 2; seal.position.set(0, -H * 0.62, 0.06); hinge.add(seal);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 12, 40), new THREE.MeshStandardMaterial({ color: 0x6e1420, roughness: 0.4 }));
    ring.position.set(0, -H * 0.62, 0.12); hinge.add(ring);
    // bóng
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(2.6, 40), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22 }));
    shadow.scale.y = 0.18; shadow.position.y = -2.3; scene.add(shadow);

    let rotY = 0.25, rotX = -0.05, vel = 0, dragging = false, lastX = 0, hover = false, flapT = 0;
    const down = (ev: PointerEvent) => { dragging = true; lastX = ev.clientX; hover = true; renderer.domElement.setPointerCapture(ev.pointerId); };
    const move = (ev: PointerEvent) => { if (!dragging) return; vel = (ev.clientX - lastX) * 0.01; rotY += vel; lastX = ev.clientX; };
    const up = () => { dragging = false; hover = false; };
    const d = renderer.domElement; d.style.touchAction = 'pan-y'; d.style.cursor = 'grab';
    d.addEventListener('pointerdown', down); d.addEventListener('pointermove', move); d.addEventListener('pointerup', up); d.addEventListener('pointercancel', up);
    d.addEventListener('pointerenter', () => (hover = true)); d.addEventListener('pointerleave', () => { hover = false; dragging = false; });

    const resize = () => { const w = el.clientWidth; renderer.setSize(w, height); cam.aspect = w / height; cam.updateProjectionMatrix(); };
    resize(); const ro = new ResizeObserver(resize); ro.observe(el);
    let raf = 0; const t0 = performance.now();
    const loop = () => {
      const t = (performance.now() - t0) / 1000;
      if (!dragging) { vel *= 0.94; rotY += vel; rotY += (Math.sin(t * 0.6) * 0.35 - rotY) * 0.01; }
      group.rotation.y = rotY; group.rotation.x = rotX + Math.sin(t * 0.9) * 0.03; group.position.y = Math.sin(t * 1.1) * 0.08;
      flapT += ((hover ? 1 : 0) - flapT) * 0.08;
      hinge.rotation.x = -flapT * Math.PI * 0.9;
      seal.visible = ring.visible = flapT < 0.5;
      paper.position.y = flapT * 0.5;
      renderer.render(scene, cam); raf = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); el.removeChild(renderer.domElement);
      scene.traverse((o: any) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
    };
  }, [kind, height, sealColor]);
  return <div ref={ref} style={{ width: '100%' }} />;
}
