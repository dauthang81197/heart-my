/** Làm sạch `design` do client gửi lên: chặn URL nguy hiểm (javascript:, data:...) và giới hạn kích thước. */
const URL_OK = /^(https:\/\/|http:\/\/|\/uploads\/)/i;
export const safeUrl = (u: unknown): u is string => typeof u === 'string' && u.length < 1000 && URL_OK.test(u);
const HEX = /^#[0-9a-f]{6}$/i;

export function sanitizeDesign(d: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...d };
  out.images = Array.isArray(d.images) ? d.images.filter(safeUrl).slice(0, 10) : [];
  out.pages = Array.isArray(d.pages) ? d.pages.filter(safeUrl).slice(0, 3) : [];
  out.pageInk = Array.isArray(d.pageInk) ? d.pageInk.slice(0, 3).map((c: unknown) => (typeof c === 'string' && HEX.test(c) ? c : null)) : [];
  out.audios = Array.isArray(d.audios)
    ? d.audios.filter((a: any) => a && safeUrl(a.url)).slice(0, 3).map((a: any) => ({ url: a.url, duration: Number(a.duration) || 0 })) : [];
  out.items = Array.isArray(d.items)
    ? d.items.slice(0, 500).filter((it: any) => it && typeof it === 'object' && (it.type !== 'image' || safeUrl(it.src))) : [];
  return out;
}
