import { Design, Item } from './design';

/** Mẫu thư dựng sẵn theo dịp. Toạ độ theo khổ giấy 600×800. */
type Raw = Omit<Item, 'id'>;
export type Template = { k: string; n: string; icon: string; env: Design['env']; seal: Design['seal']; paper: Design['paper']; items: Raw[] };

const txt = (text: string, y: number, ff: string, size: number, fill: string, o: Partial<Raw> = {}): Raw =>
  ({ type: 'text', text, x: 60, y, width: 480, fontFamily: ff, fontSize: size, fill, align: 'center', ...o });
const stk = (text: string, x: number, y: number, size = 64, o: Partial<Raw> = {}): Raw => ({ type: 'sticker', text, x, y, fontSize: size, ...o });
const tape = (pattern: string, fill: string, x: number, y: number, rotation: number, w = 170): Raw => ({ type: 'tape', text: pattern, fill, x, y, width: w, height: 38, rotation });
const body = (y: number, fill = '#3a3030', ff = 'Patrick Hand', size = 30): Raw => txt('Viết lời nhắn của bạn ở đây…\n\nBấm vào chữ này rồi chọn “✎ Sửa” để thay nội dung.', y, ff, size, fill, { align: 'left', x: 80, width: 440 });
const sign = (text: string, y: number, ff: string, fill: string): Raw => txt(text, y, ff, 38, fill, { align: 'right', x: 60, width: 470 });

const E = (model: string, pattern: string, color: string) => ({ model, pattern, color });
const S = (color: string, emblem: string) => ({ color, emblem });
const P = (kind: string, color: string, pattern: string, border: string, borderColor: string, fx = 'none') => ({ kind, color, pattern, border, borderColor, fx });

export const TEMPLATES: Template[] = [
  { k: 'love', n: 'Thư tình', icon: '💌', env: E('heart', 'hearts', '#d8a0ac'), seal: S('#9a1f2c', '❤'),
    paper: P('ford', '#fdf0f3', 'plain', 'hearts', '#c9788a'),
    items: [tape('hearts', '#f4b6c2', 210, 36, -4), txt('Gửi người em thương', 100, 'Dancing Script', 52, '#7a1f2b', { bold: true }), stk('💕', 60, 40, 56, { rotation: -14 }), stk('🌹', 470, 640, 70, { rotation: 12 }), body(220), sign('Mãi yêu em ♥', 600, 'Dancing Script', '#7a1f2b')] },
  { k: 'confess', n: 'Tỏ tình', icon: '😍', env: E('round', 'dots', '#f0b8a8'), seal: S('#b03a5b', '♡'),
    paper: P('rounded', '#fff6dd', 'plain', 'dashed', '#c9788a'),
    items: [txt('Anh có điều muốn nói…', 110, 'Pacifico', 40, '#c2476a', { shadow: true }), stk('🥺', 240, 190, 80), body(330), stk('✨', 60, 600, 52), stk('💘', 440, 590, 80, { rotation: 10 }), sign('— người thích em', 690, 'Caveat', '#c2476a')] },
  { k: 'birthday', n: 'Sinh nhật', icon: '🎂', env: E('cloud', 'stars', '#cbbfe0'), seal: S('#b8892b', '★'),
    paper: P('scallop', '#fff6dd', 'plain', 'none', '#b8892b', 'glitter'),
    items: [txt('Chúc mừng sinh nhật!', 90, 'Lobster', 52, '#c2476a', { shadow: true }), stk('🎂', 220, 180, 130), stk('🎈', 60, 150, 90, { rotation: -10 }), stk('🎉', 450, 150, 90, { rotation: 12 }), body(380, '#3a3030', 'Mali', 26), stk('🎁', 70, 640, 80), sign('Yêu thương', 650, 'Dancing Script', '#c2476a')] },
  { k: 'tet', n: 'Năm mới / Tết', icon: '🧧', env: E('classic', 'diamonds', '#7a2433'), seal: S('#b8892b', '✦'),
    paper: P('frame', '#fde8dc', 'plain', 'ornate', '#b8892b'),
    items: [txt('Chúc Mừng Năm Mới', 110, 'Playfair Display', 38, '#b3342f', { bold: true, spacing: 1 }), stk('🏮', 70, 40, 70), stk('🏮', 460, 40, 70), stk('🧧', 240, 190, 120), txt('An khang · Thịnh vượng · Vạn sự như ý', 340, 'Cormorant Garamond', 28, '#7a2433', { italic: true }), body(420, '#3a2a2a', 'Playpen Sans', 24), stk('🌸', 70, 650, 70), stk('🌸', 460, 650, 70)] },
  { k: 'xmas', n: 'Giáng sinh', icon: '🎄', env: E('zigzag', 'stripes', '#2f5d46'), seal: S('#9a1f2c', '❄'),
    paper: P('ford', '#f7f2e8', 'plain', 'lights', '#b3342f'),
    items: [txt('Merry Christmas', 110, 'Pacifico', 46, '#c0392b', { shadow: true }), stk('🎄', 230, 190, 120), stk('⛄', 60, 640, 90), stk('🎁', 450, 650, 80), body(380, '#2f3a2f', 'Patrick Hand', 28), sign('Ho ho ho!', 600, 'Caveat', '#c0392b'), stk('❄️', 480, 200, 56), stk('❄️', 70, 220, 44)] },
  { k: 'valentine', n: 'Valentine', icon: '❤️', env: E('heart', 'none', '#7a2433'), seal: S('#9a1f2c', '♡'),
    paper: P('rounded', '#f8d9e0', 'hearts', 'ribbon', '#c9788a', 'wash'),
    items: [txt('Happy Valentine’s Day', 110, 'Dancing Script', 52, '#9a1f2c', { bold: true }), stk('🌹', 230, 190, 120), body(360, '#5b2a3a', 'Caveat', 34), sign('Forever yours', 620, 'Dancing Script', '#9a1f2c'), stk('💋', 70, 650, 70, { rotation: -14 })] },
  { k: 'thanks', n: 'Cảm ơn', icon: '🙏', env: E('square', 'none', '#7f9a82'), seal: S('#2f5d46', '☘'),
    paper: P('ford', '#f0f5ec', 'lined', 'single', '#6f9a7a'),
    items: [tape('stripes', '#b7e0c8', 200, 30, 3), txt('Cảm ơn bạn rất nhiều!', 100, 'Pangolin', 44, '#2f7a74'), stk('🌻', 60, 170, 80, { rotation: -8 }), stk('🌿', 460, 180, 70), body(300, '#2f3a2f', 'Patrick Hand', 30), stk('☕', 70, 640, 70), sign('Thân ái', 640, 'Caveat', '#2f7a74')] },
  { k: 'sorry', n: 'Xin lỗi', icon: '🥺', env: E('classic', 'none', '#26324d'), seal: S('#5b3a7a', '☾'),
    paper: P('torn', '#e9dfcb', 'plain', 'none', '#3a3a3a', 'aged'),
    items: [txt('Mình xin lỗi…', 110, 'Playpen Sans', 40, '#26324d', { italic: false }), stk('🌧️', 230, 180, 100), body(330, '#2b2b30', 'Caveat', 36), sign('Mong bạn tha thứ', 640, 'Caveat', '#26324d'), stk('🕊️', 440, 560, 80)] },
  { k: 'miss', n: 'Nhớ nhung', icon: '🌙', env: E('moon', 'stars', '#26324d'), seal: S('#b8892b', '☾'),
    paper: P('ford', '#1f2a44', 'plain', 'floral', '#f0c987', 'glitter'),
    items: [txt('Nhớ em nhiều lắm…', 110, 'Dancing Script', 50, '#f0c987', { shadow: true }), stk('🌙', 240, 190, 110), stk('⭐', 70, 200, 50), stk('✨', 470, 230, 56), body(380, '#f5f0e6', 'Caveat', 34), sign('Từ phía bên kia bầu trời', 650, 'Caveat', '#f0c987')] },
  { k: 'grad', n: 'Chúc mừng tốt nghiệp', icon: '🎓', env: E('square', 'plaid', '#26324d'), seal: S('#b8892b', '★'),
    paper: P('cut', '#ffffff', 'plain', 'double', '#26324d'),
    items: [txt('Chúc mừng tốt nghiệp!', 100, 'Playfair Display', 42, '#26324d', { bold: true }), stk('🎓', 230, 180, 130), stk('🎉', 60, 200, 70), stk('🏆', 470, 200, 70), body(380, '#2b2b30', 'Be Vietnam Pro', 24), sign('Tự hào về bạn', 620, 'Dancing Script', '#26324d')] },
  { k: 'anniv', n: 'Kỷ niệm', icon: '💍', env: E('diamond', 'none', '#e4ddcf'), seal: S('#b9805f', '♛'),
    paper: P('frame', '#f7f2e8', 'plain', 'lace', '#b8892b', 'aged'),
    items: [txt('Kỷ niệm của chúng mình', 110, 'Cormorant Garamond', 38, '#5b2a4a', { italic: true, bold: true }), stk('💍', 250, 200, 100), txt('❦ ─────── ❦', 300, 'Playfair Display', 28, '#b8892b'), body(360, '#3a3030', 'Lora', 24), sign('Mãi bên nhau', 640, 'Dancing Script', '#5b2a4a')] },
  { k: 'friend', n: 'Gửi bạn thân', icon: '🤗', env: E('wave', 'dots', '#9cc0dd'), seal: S('#3f6fa8', '☺'),
    paper: P('stamp', '#fff6dd', 'dots', 'none', '#5b8fc9'),
    items: [tape('checks', '#a9cfe8', 60, 40, -6), tape('dots', '#f6e08f', 360, 50, 5), txt('Chào bạn thân mến!', 120, 'Mali', 38, '#26324d', { bold: true }), stk('😆', 70, 200, 80, { rotation: -10 }), stk('🍕', 450, 210, 80, { rotation: 10 }), body(340, '#2b2b30', 'Patrick Hand', 30), sign('Bạn của bạn', 640, 'Caveat', '#26324d')] },
];
