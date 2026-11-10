import { createContext, ReactNode, useContext, useState } from 'react';

const dict = {
  vi: {
    contact: 'Liên hệ', login: 'Đăng nhập', write: 'Viết thư', start: 'Bắt đầu viết',
    h1a: 'Lưu giữ hơi ấm', h1b: 'trong từng nét chữ.',
    sub: 'Gửi thư tay chân thực trong không gian kỹ thuật số — nơi nét mực của bạn được nâng niu như một tác phẩm nghệ thuật.',
    s1: 'Chi phí vật liệu', s2: 'Phong bì chân thực', s3: 'Cảm xúc được trao', swipe: 'Kéo sang để xem mẫu khác',
    overview: 'Tổng quan', vault: 'Kho thư', stamps: 'Tem thư', settings: 'Tùy chỉnh', logout: 'Đăng xuất',
    gateTitle: 'Lá thư riêng tư', gateFor: 'Lá thư này chỉ dành cho người nhận', gateHint: 'Xác minh địa chỉ email này để mở thư — không cần tạo tài khoản.',
    or: 'hoặc', sendCode: 'Gửi mã xác minh tới', haveAcc: 'Đã có tài khoản HeartPost bằng email này?', codeSent: 'Đã gửi mã 6 số tới', enterCode: 'Nhập mã 6 số', verify: 'Xác minh',
    resend: 'Gửi lại mã', resendIn: 'Gửi lại sau', otherWay: 'Dùng cách khác', fromLabel: 'Một lá thư từ', tapOpen: 'Chạm vào phong bì để mở', tapRead: 'Chạm vào lá thư để đọc',
    tabLetter: 'Thư', tabPhotos: 'Ảnh', tabAudio: 'Ghi âm', close: 'Đóng', photosTitle: 'Ảnh đính kèm', audioTitle: 'Lời nhắn bằng giọng nói', loading: 'Đang tải…',
  },
  en: {
    contact: 'Contact', login: 'Log in', write: 'Write', start: 'Start writing',
    h1a: 'Keep the warmth', h1b: 'in every stroke.',
    sub: 'Send authentic handwritten letters in a digital space — where your ink is treasured like a work of art.',
    s1: 'Material cost', s2: 'Real envelopes', s3: 'Feelings shared', swipe: 'Swipe to see more designs',
    overview: 'Overview', vault: 'Letters', stamps: 'Stamps', settings: 'Settings', logout: 'Log out',
    gateTitle: 'A private letter', gateFor: 'This letter is only for', gateHint: 'Verify this email address to open it — no account needed.',
    or: 'or', sendCode: 'Send a verification code to', haveAcc: 'Already have a HeartPost account with this email?', codeSent: 'We sent a 6-digit code to', enterCode: 'Enter the 6-digit code', verify: 'Verify',
    resend: 'Resend code', resendIn: 'Resend in', otherWay: 'Use another way', fromLabel: 'A letter from', tapOpen: 'Tap the envelope to open', tapRead: 'Tap the letter to read',
    tabLetter: 'Letter', tabPhotos: 'Photos', tabAudio: 'Voice', close: 'Close', photosTitle: 'Attached photos', audioTitle: 'Voice messages', loading: 'Loading…',
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
