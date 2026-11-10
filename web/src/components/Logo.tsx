import { Link } from 'react-router-dom';
import { BRAND } from '../brand';

/** Biểu tượng: tấm thiệp nghiêng + nếp phong bì + tia sáng nhỏ. */
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg className="logomark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs><linearGradient id="lm-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f0b3ba" /><stop offset="1" stopColor="#d4a373" /></linearGradient></defs>
      <g transform="rotate(-6 32 32)">
        <rect x="6" y="10" width="52" height="44" rx="12" fill="url(#lm-g)" />
        <path d="M16 24l16 13 16-13" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d="M47 8l2.2 5.3L54.5 15.5 49.2 17.7 47 23l-2.2-5.3-5.3-2.2 5.3-2.2z" fill="#fff" />
    </svg>
  );
}

export default function Logo({ to = '/', size = 34, className = '', style }: { to?: string; size?: number; className?: string; style?: React.CSSProperties }) {
  const i = BRAND.search(/[A-Z](?=[a-z]+$)/); // "True" + "Note"
  const a = BRAND.slice(0, i > 0 ? i : BRAND.length), b = i > 0 ? BRAND.slice(i) : '';
  return (
    <Link to={to} className={'brand ' + className} style={style} aria-label={BRAND}>
      <LogoMark size={size} />
      <span className="brand-name">{a}<em>{b}</em></span>
    </Link>
  );
}
