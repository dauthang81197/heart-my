import { sanitizeDesign, safeUrl } from './design';

describe('sanitizeDesign', () => {
  it('chặn javascript:/data: và giữ https', () => {
    const d = sanitizeDesign({
      images: ['javascript:alert(1)', 'https://ok.com/a.png', 'data:text/html,x'],
      pages: ['//evil.com/x.png', '/uploads/u/p.png'],
      audios: [{ url: 'javascript:x', duration: 1 }, { url: 'https://ok.com/a.webm', duration: 3 }],
      items: [{ type: 'image', src: 'javascript:x' }, { type: 'text', text: 'hi' }],
    });
    expect(d.images).toEqual(['https://ok.com/a.png']);
    expect(d.pages).toEqual(['/uploads/u/p.png']);
    expect(d.audios).toHaveLength(1);
    expect(d.items).toEqual([{ type: 'text', text: 'hi' }]);
  });
  it('giới hạn số lượng và màu mực hợp lệ', () => {
    const d = sanitizeDesign({ images: Array(30).fill('https://a.com/x.png'), pages: Array(9).fill('https://a.com/x.png'), pageInk: ['#ff0000', 'red', null, '#00ff00'] });
    expect(d.images).toHaveLength(10);
    expect(d.pages).toHaveLength(3);
    expect(d.pageInk).toEqual(['#ff0000', null, null]);
  });
  it('safeUrl từ chối không phải chuỗi', () => { expect(safeUrl(123)).toBe(false); expect(safeUrl('ftp://x')).toBe(false); });
});
