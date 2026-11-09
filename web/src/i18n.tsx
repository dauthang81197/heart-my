import { createContext, ReactNode, useContext, useState } from 'react';

const dict = {
  vi: {
    contact: 'Liên hệ', login: 'Đăng nhập', write: 'Viết thư', start: 'Bắt đầu viết',
    h1a: 'Lưu giữ hơi ấm', h1b: 'trong từng nét chữ.',
    sub: 'Gửi thư tay chân thực trong không gian kỹ thuật số — nơi nét mực của bạn được nâng niu như một tác phẩm nghệ thuật.',
    s1: 'Chi phí vật liệu', s2: 'Phong bì chân thực', s3: 'Cảm xúc được trao', swipe: 'Kéo sang để xem mẫu khác',
    overview: 'Tổng quan', vault: 'Kho thư', stamps: 'Tem thư', settings: 'Tùy chỉnh', logout: 'Đăng xuất',
  },
  en: {
    contact: 'Contact', login: 'Log in', write: 'Write', start: 'Start writing',
    h1a: 'Keep the warmth', h1b: 'in every stroke.',
    sub: 'Send authentic handwritten letters in a digital space — where your ink is treasured like a work of art.',
    s1: 'Material cost', s2: 'Real envelopes', s3: 'Feelings shared', swipe: 'Swipe to see more designs',
    overview: 'Overview', vault: 'Letters', stamps: 'Stamps', settings: 'Settings', logout: 'Log out',
  },
};
type Key = keyof typeof dict.vi;
const Ctx = createContext<{ lang: 'vi' | 'en'; setLang: (l: 'vi' | 'en') => void; t: (k: Key) => string }>(null!);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setL] = useState<'vi' | 'en'>(() => (localStorage.getItem('hp_lang') as 'vi' | 'en') || 'vi');
  const setLang = (l: 'vi' | 'en') => { localStorage.setItem('hp_lang', l); setL(l); };
  return <Ctx.Provider value={{ lang, setLang, t: (k) => dict[lang][k] }}>{children}</Ctx.Provider>;
}
export const useI18n = () => useContext(Ctx);
