import { Component, lazy, ReactNode, Suspense, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Envelope, { ENVELOPES } from '../components/Envelope';
const Envelope3D = lazy(() => import('../components/Envelope3D'));
import { useI18n } from '../i18n';
import { useAuth } from '../auth';

/** WebGL không khả dụng (máy yếu / bị tắt) → quay về phong bì 2D thay vì trắng trang. */
class Safe3D extends Component<{ fallback: ReactNode; children: ReactNode; k: string }, { bad: boolean }> {
  state = { bad: false };
  static getDerivedStateFromError() { return { bad: true }; }
  componentDidCatch() { /* bỏ qua */ }
  render() { return this.state.bad ? this.props.fallback : this.props.children; }
}

export default function Landing() {
  const { t, lang, setLang } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  const keys = Object.keys(ENVELOPES);
  const [i, setI] = useState(0);
  const go = () => nav(user ? '/app?new=1' : '/login');
  return (
    <>
      <header className="nav">
        <Link to="/" className="logo"><i />HeartPost</Link>
        <div className="nav-r">
          <div className="lang">
            <button className={lang === 'vi' ? 'on' : ''} onClick={() => setLang('vi')}>VI</button>
            <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
          </div>
          <a className="hide-m" href="mailto:hello@heartpost.local">{t('contact')}</a>
          <Link to={user ? '/app' : '/login'}>{user ? t('overview') : t('login')}</Link>
          <button className="btn" onClick={go}>{t('write')}</button>
        </div>
      </header>
      <section className="hero">
        <div className="hero-l">
          <h1>{t('h1a')}<span>{t('h1b')}</span></h1>
          <p>{t('sub')}</p>
          <div><button className="btn" onClick={go}>{t('start')} →</button></div>
          <div className="stats">
            <div><b>0đ</b><small>{t('s1')}</small></div>
            <div><b>3D</b><small>{t('s2')}</small></div>
            <div><b>∞</b><small>{t('s3')}</small></div>
          </div>
        </div>
        <div className="hero-r">
          <div style={{ width: '100%' }}><Safe3D k={keys[i]} fallback={<div style={{ display: 'grid', placeItems: 'center', padding: 30 }}><Envelope design={{ env: { model: 'classic', pattern: 'none', color: ENVELOPES[keys[i]].body } }} size={Math.min(320, window.innerWidth - 64)} /></div>}><Suspense fallback={null}><Envelope3D kind={keys[i]} height={window.innerWidth < 860 ? 300 : 460} /></Suspense></Safe3D></div>
          <div className="hero-cap">
            <button className="btn ghost sm" style={{ marginRight: 12 }} onClick={() => setI((i + keys.length - 1) % keys.length)}>‹</button><button className="btn ghost sm" onClick={() => setI((i + 1) % keys.length)}>›</button><br />
            Mô hình {String(i + 1).padStart(2, '0')} · {ENVELOPES[keys[i]].label}
            <div className="dots">{keys.map((_, n) => <i key={n} className={n === i ? 'on' : ''} onClick={() => setI(n)} />)}</div>
            Kéo để xoay · Chạm giữ để mở nắp
          </div>
        </div>
      </section>
    </>
  );
}
