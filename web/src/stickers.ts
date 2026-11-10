/** Kho sticker theo chủ đề. `glyph` = ký hiệu chữ (đổi được màu), còn lại là emoji. */
export type StickerPack = { k: string; n: string; icon: string; items: string[]; glyph?: boolean; size?: number };

const sp = (s: string) => s.split(/\s+/).filter(Boolean);

export const STICKER_PACKS: StickerPack[] = [
  { k: 'love', n: 'Tình yêu', icon: '❤️', items: sp('❤️ 💕 💖 💗 💘 💝 💞 💓 💌 😍 🥰 😘 💋 💍 💑 👩‍❤️‍👨 🌹 🥀 💐 💏 ❣️ 💟 🧡 💛 💚 💙 💜 🤍 🖤 😻 💒') },
  { k: 'birthday', n: 'Sinh nhật', icon: '🎂', items: sp('🎂 🎉 🎈 🎁 🎊 🥳 🍰 🧁 🎀 🕯️ 🍾 🥂 🎵 🍭 🍬 🎇 🎆 🍩 🍦 🤩 🎶 👑 🎠 🎪 🪁 🎯 🎤 🎸') },
  { k: 'tet', n: 'Tết & Xuân', icon: '🧧', items: sp('🧧 🌸 🏮 🎆 🎇 🐉 🐲 🍊 🍑 🎋 🧨 🎍 💮 🌼 🥮 🍵 🐅 🐈 🐓 🐖 🐎 🐍 🐇 🐀 🐂 🐒 🐕 🐐 🍀 🌟') },
  { k: 'xmas', n: 'Giáng sinh', icon: '🎄', items: sp('🎄 🎅 🤶 ⛄ ☃️ ❄️ 🦌 🎁 🔔 ⭐ 🕯️ 🧦 🍪 🥛 🌟 🧣 🧤 🍷 🛷 🏔️ 🎶 ✨ 🕊️ 🍫 🎿 ⛷️ 🌨️ 🧸') },
  { k: 'night', n: 'Đêm & Mơ mộng', icon: '🌙', items: sp('🌙 ⭐ 🌟 💫 ✨ 🌠 🌌 🔭 🕯️ 🍷 🥂 🌹 🎻 🎹 🎶 🕰️ 🗝️ 💎 🔮 🦢 🧸 🍫 🌃 🌉 🌛 🌜 🌝 ☄️') },
  { k: 'thanks', n: 'Cảm ơn', icon: '🙏', items: sp('🙏 🤝 😊 😇 💐 🌻 🍵 ☕ 🧡 💛 👏 🌈 ☀️ 🎁 💌 🤗 🌿 🍀 🏅 🌟 ✨ 👍 🙌 💪 🥇 🎖️') },
  { k: 'sorry', n: 'Xin lỗi & Nhớ', icon: '🥺', items: sp('😢 😔 🥺 😞 🙇 💔 🩹 🌧️ ☔ 🕊️ 🤍 🍃 🕯️ 📞 ✉️ 📮 🧸 🌙 🥀 🍂 😭 🤧 🌫️ 🕰️ 📷 🎧 🛤️ ⏳') },
  { k: 'grad', n: 'Chúc mừng', icon: '🎓', items: sp('🎓 📜 🏆 🥇 🎉 🎊 👏 🍾 🥂 📚 ✏️ 🖋️ 🎒 🏫 🌟 🚀 💼 🎯 🏅 🎖️ 💪 🙌 🔥 ✅ 👑 🥳') },
  { k: 'flower', n: 'Hoa lá', icon: '🌸', items: sp('🌸 🌹 🌷 🌺 🌻 🌼 💐 🥀 🌿 🍀 ☘️ 🍃 🍂 🍁 🌾 🌵 🌴 🌳 🌲 🍄 🪴 🌱 💮 🏵️ 🌰 🍒') },
  { k: 'nature', n: 'Thiên nhiên', icon: '🌈', items: sp('☀️ 🌤️ ⛅ ☁️ 🌧️ ⛈️ 🌈 ❄️ 🌙 ⭐ 🌊 🔥 💧 🌋 🏔️ 🏖️ 🌅 🌄 🌌 ☄️ 🌍 🌬️ 🍃 ⚡ 🌪️ 🏝️') },
  { k: 'animal', n: 'Động vật', icon: '🐱', items: sp('🐱 🐶 🐰 🐻 🐼 🦊 🐨 🐯 🦁 🐸 🐥 🐣 🦄 🐢 🐠 🦋 🐝 🐞 🕊️ 🦢 🦉 🐧 🐹 🐭 🐑 🦆 🐬 🐳') },
  { k: 'food', n: 'Đồ ăn & uống', icon: '🍰', items: sp('☕ 🍵 🧋 🍰 🍪 🍫 🍓 🍒 🍑 🍉 🍕 🍔 🍜 🍣 🍦 🍩 🍷 🥂 🍹 🥐 🍯 🍞 🍎 🍇 🍋 🥞 🍿 🍡') },
  { k: 'travel', n: 'Du lịch', icon: '✈️', items: sp('✈️ 🚂 🚢 🚗 🚲 🗺️ 🧳 📷 🏖️ ⛺ 🗼 🏰 🗽 🌉 🎡 🏝️ 🧭 🏔️ 🚀 🛳️ 🌏 📍 🎫 🗻 🚁 🛵') },
  { k: 'mail', n: 'Thư & Ghim', icon: '💌', items: sp('💌 ✉️ 📮 📪 📬 📜 🖋️ ✒️ 🪶 📎 🖇️ 📌 📍 🔖 🏷️ 📝 📖 📔 🕰️ 🗝️ 🔑 🔒 🧷 ✂️ 📅 🗒️ 📒') },
  { k: 'face', n: 'Biểu cảm', icon: '😊', items: sp('😀 😂 🤣 😊 😍 🥰 😘 😎 🤩 😜 🤗 😴 🤔 😅 😭 😡 🥳 😇 🙈 🙉 🙊 👍 👋 🤞 😋 😌 😏 🤭') },
  { k: 'glyph', n: 'Ký hiệu (đổi màu)', icon: '✿', glyph: true, size: 56,
    items: sp('♥ ♡ ❤ ❥ ❦ ❧ ✿ ❀ ✦ ✧ ★ ☆ ✶ ❖ ☾ ☽ ♪ ♫ ❝ ❞ ✂ ❋ ✾ ❁ ✺ ❂ ☘ ⚘ ✈ ☺ ♛ ❄') },
  { k: 'divider', n: 'Đường kẻ trang trí', icon: '〰', glyph: true, size: 34,
    items: ['───── ♥ ─────', '· · · ✦ · · ·', '〰〰〰〰〰', '⋆⁺₊ ☾ ₊⁺⋆', '❦ ─── ❦', '♡ ♡ ♡', '✧･ﾟ: *✧･ﾟ:*', '❀ ❀ ❀ ❀ ❀', '━━ ✿ ━━', '◦•●•◦', '✦ ─ ✦ ─ ✦', '❧ ━━━━ ☙', '~ ♡ ~', '⋯⋯ ❤ ⋯⋯'] },
];

const KEY = 'hp_recent_stickers';
export const loadRecent = (): string[] => { try { const a = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(a) ? a.filter((x) => typeof x === 'string').slice(0, 16) : []; } catch { return []; } };
export const pushRecent = (s: string) => { try { const a = [s, ...loadRecent().filter((x) => x !== s)].slice(0, 16); localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* bỏ qua */ } };

/** Phông chữ (đều hỗ trợ tiếng Việt). */
export const FONT_GROUPS: { n: string; fonts: string[] }[] = [
  { n: 'Viết tay', fonts: ['Dancing Script', 'Caveat', 'Pacifico', 'Lobster', 'Patrick Hand', 'Pangolin', 'Mali', 'Itim', 'Sriracha', 'Playpen Sans', 'Amatic SC'] },
  { n: 'Có chân (cổ điển)', fonts: ['Playfair Display', 'Lora', 'Cormorant Garamond', 'Noto Serif', 'Georgia'] },
  { n: 'Không chân (hiện đại)', fonts: ['Be Vietnam Pro', 'Quicksand', 'Comfortaa', 'Oswald', 'Inter'] },
  { n: 'Máy chữ', fonts: ['Courier Prime', 'Courier New'] },
];

/** Mẫu câu / tiêu đề dựng sẵn: bấm là chèn vào thư. */
export type Preset = { label: string; text: string; fontFamily: string; fontSize: number; fill: string; bold?: boolean; italic?: boolean; align?: string; width?: number; rotation?: number; shadow?: boolean; outline?: string; spacing?: number; underline?: boolean; opacity?: number };
export const PRESET_GROUPS: { n: string; items: Preset[] }[] = [
  { n: 'Lời mở đầu', items: [
    { label: 'Gửi em yêu,', text: 'Gửi em yêu,', fontFamily: 'Dancing Script', fontSize: 44, fill: '#7a1f2b' },
    { label: 'Gửi người tôi thương', text: 'Gửi người tôi thương,', fontFamily: 'Pacifico', fontSize: 32, fill: '#c0392b' },
    { label: 'Dear you', text: 'Dear you,', fontFamily: 'Caveat', fontSize: 48, fill: '#26324d', bold: true },
    { label: 'Chào bạn thân', text: 'Chào bạn thân mến!', fontFamily: 'Patrick Hand', fontSize: 36, fill: '#1f4a4a' },
  ] },
  { n: 'Dịp đặc biệt', items: [
    { label: 'Sinh nhật', text: 'Chúc mừng sinh nhật!', fontFamily: 'Lobster', fontSize: 44, fill: '#c2476a', shadow: true, align: 'center' },
    { label: 'Năm mới', text: 'Chúc mừng năm mới', fontFamily: 'Playfair Display', fontSize: 40, fill: '#b8892b', bold: true, align: 'center', spacing: 2 },
    { label: 'Giáng sinh', text: 'Merry Christmas', fontFamily: 'Pacifico', fontSize: 42, fill: '#c0392b', align: 'center', shadow: true },
    { label: 'Valentine', text: 'Happy Valentine’s Day', fontFamily: 'Dancing Script', fontSize: 46, fill: '#c2476a', bold: true, align: 'center' },
    { label: '8/3 – 20/10', text: 'Chúc mừng ngày của bạn', fontFamily: 'Mali', fontSize: 34, fill: '#c9788a', bold: true, align: 'center' },
    { label: 'Kỷ niệm', text: 'Kỷ niệm của chúng mình', fontFamily: 'Cormorant Garamond', fontSize: 44, fill: '#5b2a4a', italic: true, align: 'center' },
  ] },
  { n: 'Lời nhắn', items: [
    { label: 'Nhớ nhiều', text: 'Nhớ em nhiều lắm…', fontFamily: 'Caveat', fontSize: 40, fill: '#7a1f2b' },
    { label: 'Cảm ơn', text: 'Cảm ơn bạn rất nhiều!', fontFamily: 'Pangolin', fontSize: 38, fill: '#2f7a74', align: 'center' },
    { label: 'Xin lỗi', text: 'Mình xin lỗi…', fontFamily: 'Playpen Sans', fontSize: 34, fill: '#26324d' },
    { label: 'Yêu thương', text: 'Yêu em hơn mỗi ngày', fontFamily: 'Dancing Script', fontSize: 42, fill: '#c0392b', align: 'center' },
    { label: 'Cố lên', text: 'Cố lên nhé, mình luôn ở đây!', fontFamily: 'Itim', fontSize: 32, fill: '#8a5a2b', align: 'center' },
  ] },
  { n: 'Lời kết', items: [
    { label: 'Với tình yêu', text: 'Với tất cả tình yêu ♥', fontFamily: 'Dancing Script', fontSize: 40, fill: '#7a1f2b', align: 'right' },
    { label: 'Mãi mãi', text: 'Mãi mãi của anh,', fontFamily: 'Caveat', fontSize: 42, fill: '#26324d', align: 'right' },
    { label: 'Thân ái', text: 'Thân ái,', fontFamily: 'Patrick Hand', fontSize: 34, fill: '#1f2328', align: 'right' },
    { label: 'P.S.', text: 'P.S. Em đừng quên uống nước nhé :)', fontFamily: 'Caveat', fontSize: 30, fill: '#6b4c9a' },
  ] },
  { n: 'Dấu đóng', items: [
    { label: 'AIR MAIL', text: 'AIR MAIL', fontFamily: 'Courier Prime', fontSize: 34, fill: '#c0392b', bold: true, spacing: 4, rotation: -8, opacity: 0.85, width: 240, align: 'center' },
    { label: 'WITH LOVE', text: 'WITH LOVE', fontFamily: 'Courier Prime', fontSize: 30, fill: '#7a1f2b', bold: true, spacing: 5, rotation: 6, opacity: 0.8, width: 240, align: 'center' },
    { label: 'PRIVATE', text: 'RIÊNG TƯ', fontFamily: 'Oswald', fontSize: 34, fill: '#26324d', bold: true, spacing: 6, rotation: -5, opacity: 0.75, width: 240, align: 'center' },
    { label: 'FOR YOU', text: 'DÀNH CHO EM', fontFamily: 'Courier Prime', fontSize: 28, fill: '#1f4a4a', bold: true, spacing: 3, rotation: 4, opacity: 0.8, width: 260, align: 'center' },
  ] },
];

/** Băng dính washi. */
export const TAPE_PATTERNS = [
  { k: 'solid', n: 'Trơn' }, { k: 'stripes', n: 'Sọc chéo' }, { k: 'dots', n: 'Chấm bi' }, { k: 'hearts', n: 'Trái tim' },
  { k: 'checks', n: 'Caro' }, { k: 'zigzag', n: 'Zigzag' }, { k: 'stars', n: 'Ngôi sao' }, { k: 'flowers', n: 'Hoa nhỏ' },
];
export const TAPE_COLORS = ['#f4b6c2', '#f7c9a8', '#f6e08f', '#b7e0c8', '#a9cfe8', '#cbbfe0', '#ffffff', '#d9c4a5', '#d9534f', '#2f4a7a'];
