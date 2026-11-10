export const W = 600, H = 800;

export type Item = {
  id: string; type: 'text' | 'sticker' | 'image' | 'line';
  x: number; y: number; rotation?: number; page?: number;
  text?: string; fontFamily?: string; fontSize?: number; fill?: string; bold?: boolean; italic?: boolean; align?: string; width?: number;
  src?: string; height?: number;
  points?: number[]; stroke?: string; strokeWidth?: number;
};
export type EnvDesign = { model: string; pattern: string; color: string };
export type Seal = { color: string; emblem: string };
export type PaperDesign = { kind: string; color: string; pattern: string };
export type Design = {
  env: EnvDesign; seal: Seal; paper: PaperDesign; items: Item[];
  pageInk: (string | null)[]; // màu mực đổi lại cho từng trang (null = màu gốc)
  pages: string[]; // ảnh chữ viết tay, mỗi ảnh là 1 trang (PNG đã fit khổ giấy)
  images: string[]; audios: { url: string; duration: number }[];
};

export const MODELS = [
  { k: 'classic', n: 'Thư Cổ Điển' }, { k: 'square', n: 'Thư Nắp Vuông' }, { k: 'wave', n: 'Thư Gợn Sóng' },
  { k: 'heart', n: 'Thư Trái Tim' }, { k: 'moon', n: 'Thư Trăng Non' }, { k: 'scallop', n: 'Thư Diềm Sóng' },
  { k: 'zigzag', n: 'Thư Răng Cưa' }, { k: 'diamond', n: 'Thư Kim Cương' }, { k: 'round', n: 'Thư Bo Tròn' }, { k: 'cloud', n: 'Thư Đám Mây' },
];
export const ENV_PATTERNS = [
  { k: 'none', n: 'Trơn' }, { k: 'dots', n: 'Chấm bi' }, { k: 'stripes', n: 'Sọc chéo' },
  { k: 'hearts', n: 'Trái tim' }, { k: 'grid', n: 'Ô vuông' }, { k: 'stars', n: 'Ngôi sao' },
  { k: 'flowers', n: 'Hoa nhỏ' }, { k: 'diamonds', n: 'Hình thoi' }, { k: 'plaid', n: 'Caro' }, { k: 'waves', n: 'Sóng nước' },
  { k: 'notes', n: 'Nốt nhạc' }, { k: 'checker', n: 'Bàn cờ' }, { k: 'vlines', n: 'Sọc dọc' },
];
export const ENV_COLORS = [
  { n: 'Giấy Kraft', c: '#c9b995' }, { n: 'Xanh Cổ Điển', c: '#1f4a4a' }, { n: 'Hồng Phấn', c: '#d8a0ac' },
  { n: 'Xanh Đêm', c: '#26324d' }, { n: 'Xanh Sage', c: '#7f9a82' }, { n: 'Kem Sữa', c: '#e4ddcf' },
  { n: 'Đỏ Rượu', c: '#7a2433' }, { n: 'Tím Oải Hương', c: '#8b7bb0' }, { n: 'Vàng Nắng', c: '#d8b55a' },
  { n: 'Trắng Ngà', c: '#f1ede4' }, { n: 'Xám Khói', c: '#8d949b' }, { n: 'Nâu Cà Phê', c: '#6b4a35' },
  { n: 'Hồng Đào', c: '#f0b8a8' }, { n: 'Xanh Bạc Hà', c: '#a8d5c2' }, { n: 'Xanh Trời', c: '#9cc0dd' },
  { n: 'Xanh Ngọc', c: '#2f7a74' }, { n: 'Cam Đất', c: '#c47a4f' }, { n: 'Mận Chín', c: '#5b2a4a' },
  { n: 'Xanh Rêu', c: '#4d5a3a' }, { n: 'Hồng Đậm', c: '#c2476a' }, { n: 'Lavender Nhạt', c: '#cbbfe0' },
  { n: 'Be Nắng', c: '#d9c4a5' }, { n: 'Đen Than', c: '#2b2b30' }, { n: 'Vàng Mơ', c: '#f0d49a' },
];
export const SEAL_COLORS = [
  { n: 'Đỏ Lãng Mạn', c: '#9a1f2c' }, { n: 'Vàng Hồng', c: '#b9805f' }, { n: 'Vàng Hoàng Gia', c: '#b8892b' },
  { n: 'Xanh Hải Quân', c: '#26324d' }, { n: 'Xanh Rừng', c: '#2f5d46' }, { n: 'Tím Mộng', c: '#5b3a7a' },
  { n: 'Đen Huyền Bí', c: '#2b2b2b' }, { n: 'Hồng Phấn', c: '#c9788a' },
  { n: 'Xanh Ngọc', c: '#1f6f6a' }, { n: 'Cam Cháy', c: '#b5532a' }, { n: 'Bạc Ánh Kim', c: '#9aa0a6' },
  { n: 'Hồng Đậm', c: '#b03a5b' }, { n: 'Nâu Socola', c: '#5a3a2a' }, { n: 'Xanh Trời', c: '#3f6fa8' },
];
export const SEAL_EMBLEMS = ['❤', '✦', '☾', '✿', '✉', '♪', '✝', '★', '❀', '♡', '☀', '❄', '♛', '☘', '⚘', '✈', '♬', '☺', '✧', '❣', ''];
export const PAPER_KINDS = [
  { k: 'ford', n: 'Giấy Ford' }, { k: 'stamp', n: 'Giấy Mép Tem' }, { k: 'torn', n: 'Giấy Xé Tay' }, { k: 'burnt', n: 'Giấy Cháy Mép' },
  { k: 'rounded', n: 'Giấy Bo Góc' }, { k: 'scallop', n: 'Giấy Mép Lượn' }, { k: 'cut', n: 'Giấy Cắt Góc' }, { k: 'folded', n: 'Giấy Gấp Nếp' }, { k: 'frame', n: 'Giấy Viền Hoa' },
];
export const PAPER_PATTERNS = [
  { k: 'plain', n: 'Trơn' }, { k: 'lined', n: 'Kẻ ngang' }, { k: 'grid', n: 'Ô vuông' }, { k: 'dots', n: 'Chấm' },
  { k: 'notebook', n: 'Vở học sinh' }, { k: 'diagonal', n: 'Sọc chéo' }, { k: 'hearts', n: 'Trái tim' }, { k: 'stars', n: 'Ngôi sao' }, { k: 'flowers', n: 'Hoa nhỏ' },
];
export const PAPER_COLORS = [
  { n: 'Ngà Trắng', c: '#f7f2e8' }, { n: 'Trắng Tinh', c: '#ffffff' }, { n: 'Hồng Nhạt', c: '#fdf0f3' },
  { n: 'Xanh Sương', c: '#eef3f7' }, { n: 'Xanh Lá Nhạt', c: '#f0f5ec' }, { n: 'Vàng Bơ', c: '#fff6dd' },
  { n: 'Da Giấy Cũ', c: '#e9dfcb' }, { n: 'Than Đêm', c: '#2a2f35' },
  { n: 'Xanh Bạc Hà', c: '#e8f4ee' }, { n: 'Lavender', c: '#f1ecf8' }, { n: 'Cam Đào', c: '#fde8dc' }, { n: 'Hồng Phấn', c: '#f8d9e0' },
  { n: 'Xanh Thiên', c: '#dcecf7' }, { n: 'Be Cát', c: '#efe3cc' }, { n: 'Xám Nhạt', c: '#ececec' }, { n: 'Xanh Navy', c: '#1f2a44' },
];
// Legacy: bản nháp cũ lưu envelope theo tên màu
const LEGACY_ENV: Record<string, string> = { classic: '#1f4a4a', kraft: '#c9b995', rose: '#d8a0ac', midnight: '#26324d', sage: '#7f9a82', cream: '#e4ddcf' };

export const defaultDesign = (): Design => ({
  env: { model: 'classic', pattern: 'none', color: ENV_COLORS[0].c },
  seal: { color: SEAL_COLORS[1].c, emblem: '❤' },
  paper: { kind: 'ford', color: PAPER_COLORS[0].c, pattern: 'lined' },
  items: [], pages: [], pageInk: [], images: [], audios: [],
});

/** Chuẩn hoá design từ server (có thể thiếu field / định dạng cũ). */
export function normalizeDesign(raw: any, legacyEnvelope?: string): Design {
  const d = defaultDesign();
  if (!raw || typeof raw !== 'object') return d;
  return {
    env: { ...d.env, ...(legacyEnvelope && LEGACY_ENV[legacyEnvelope] ? { color: LEGACY_ENV[legacyEnvelope] } : {}), ...(raw.env ?? {}) },
    seal: { ...d.seal, ...(raw.seal ?? {}) },
    paper: { ...d.paper, ...(raw.paper ?? {}) },
    items: Array.isArray(raw.items) ? raw.items.filter((it: any) => it && (it.type !== 'image' || safeUrl(it.src))) : [],
    pageInk: Array.isArray(raw.pageInk) ? raw.pageInk.map((c: unknown) => (typeof c === 'string' ? c : null)) : [],
    pages: Array.isArray(raw.pages) ? raw.pages.filter(safeUrl) : [],
    images: Array.isArray(raw.images) ? raw.images.filter(safeUrl) : [],
    audios: Array.isArray(raw.audios) ? raw.audios.filter((a: any) => a && safeUrl(a.url)) : [],
  };
}
export const pageCount = (d: { pages?: string[] }) => Math.max(1, d.pages?.length ?? 0);
const safeUrl = (u: unknown): u is string => typeof u === 'string' && /^(https?:\/\/|\/uploads\/)/i.test(u);
export const nameOf = (list: { k?: string; c?: string; n: string }[], v: string) => list.find((x) => x.k === v || x.c === v)?.n ?? '—';
