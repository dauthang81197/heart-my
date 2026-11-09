// Xử lý ảnh chữ viết tay: co vừa khổ giấy (600x800, x2) và tách nền trắng để chữ nằm trên màu/họa tiết giấy.
export const MAX_PAGES = 3;
export const MAX_BYTES = 5 << 20;
const OUT_W = 1200, OUT_H = 1600, MARGIN = 56, CELL = 24;

async function load(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { /* fallback */ }
  }
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Không đọc được ảnh')); };
    img.src = url;
  });
}

/** Ước lượng màu nền giấy theo từng ô (chịu được bóng đổ), nội suy song tuyến. */
function removeBackground(data: ImageData) {
  const { width: w, height: h } = data; const px = data.data;
  const gw = Math.ceil(w / CELL), gh = Math.ceil(h / CELL);
  const bg = new Float32Array(gw * gh * 3);
  for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
    const samples: [number, number, number, number][] = [];
    for (let y = gy * CELL; y < Math.min(h, (gy + 1) * CELL); y += 2) for (let x = gx * CELL; x < Math.min(w, (gx + 1) * CELL); x += 2) {
      const i = (y * w + x) * 4; samples.push([.299 * px[i] + .587 * px[i + 1] + .114 * px[i + 2], px[i], px[i + 1], px[i + 2]]);
    }
    samples.sort((a, b) => a[0] - b[0]);
    const top = samples.slice(Math.floor(samples.length * 0.8)); const n = top.length || 1;
    let r = 0, g = 0, b = 0; for (const s of top) { r += s[1]; g += s[2]; b += s[3]; }
    const o = (gy * gw + gx) * 3; bg[o] = r / n; bg[o + 1] = g / n; bg[o + 2] = b / n;
  }
  const cell = (gx: number, gy: number, c: number) => bg[(Math.min(gh - 1, Math.max(0, gy)) * gw + Math.min(gw - 1, Math.max(0, gx))) * 3 + c];
  const bgAt = (x: number, y: number, c: number) => {
    const fx = x / CELL - 0.5, fy = y / CELL - 0.5; const x0 = Math.floor(fx), y0 = Math.floor(fy); const tx = fx - x0, ty = fy - y0;
    return (cell(x0, y0, c) * (1 - tx) + cell(x0 + 1, y0, c) * tx) * (1 - ty) + (cell(x0, y0 + 1, c) * (1 - tx) + cell(x0 + 1, y0 + 1, c) * tx) * ty;
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const br = bgAt(x, y, 0), bgc = bgAt(x, y, 1), bb = bgAt(x, y, 2);
    const bl = Math.max(1, .299 * br + .587 * bgc + .114 * bb);
    const ratio = (.299 * px[i] + .587 * px[i + 1] + .114 * px[i + 2]) / bl;
    const a = Math.min(1, Math.max(0, (0.9 - ratio) / 0.4));
    if (a < 0.03) { px[i + 3] = 0; continue; }
    const inv = 1 - a;
    px[i] = Math.max(0, Math.min(255, (px[i] - br * inv) / a));
    px[i + 1] = Math.max(0, Math.min(255, (px[i + 1] - bgc * inv) / a));
    px[i + 2] = Math.max(0, Math.min(255, (px[i + 2] - bb * inv) / a));
    px[i + 3] = Math.round(a * 255);
  }
}

/** Trả về PNG 1200x1600 (trong suốt ngoài vùng ảnh) đã fit vào 1 trang giấy. */
export async function processHandwriting(file: File, removeBg = true): Promise<Blob> {
  const src = await load(file);
  const sw = 'naturalWidth' in src ? src.naturalWidth : src.width, sh = 'naturalHeight' in src ? src.naturalHeight : src.height;
  const k = Math.min((OUT_W - MARGIN * 2) / sw, (OUT_H - MARGIN * 2) / sh);
  const dw = Math.max(1, Math.round(sw * k)), dh = Math.max(1, Math.round(sh * k));
  const tmp = document.createElement('canvas'); tmp.width = dw; tmp.height = dh;
  const tctx = tmp.getContext('2d', { willReadFrequently: true })!;
  tctx.drawImage(src, 0, 0, dw, dh);
  if (removeBg) { const data = tctx.getImageData(0, 0, dw, dh); removeBackground(data); tctx.putImageData(data, 0, 0); }
  const out = document.createElement('canvas'); out.width = OUT_W; out.height = OUT_H;
  out.getContext('2d')!.drawImage(tmp, Math.round((OUT_W - dw) / 2), Math.round((OUT_H - dh) / 2));
  return new Promise((res, rej) => out.toBlob((b) => (b ? res(b) : rej(new Error('Không xử lý được ảnh'))), 'image/png'));
}
