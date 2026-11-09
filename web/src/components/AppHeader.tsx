import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { useI18n } from '../i18n';

export default function AppHeader() {
  const { user } = useAuth();
  const { lang, setLang, t } = useI18n();
  const [n, setN] = useState(0);
  useEffect(() => { api('/stamps/mine').then((m: any[]) => setN(m.reduce((a, s) => a + s.quantity, 0))).catch(() => undefined); }, []);
  return (
    <header className="apphead">
      <Link to="/app" className="logo"><i />HeartPost</Link>
      <div className="nav-r">
        <div className="lang">
          <button className={lang === 'vi' ? 'on' : ''} onClick={() => setLang('vi')}>VI</button>
          <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
        </div>
        <a className="hide-m" href="mailto:hello@heartpost.local">{t('contact')}</a>
        <Link to="/app/stamps" className="pill">🏷 {n}</Link>
        <Link to="/app/settings" className="avatar">{user?.avatar ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" /> : (user?.name?.[0] ?? '?').toUpperCase()}</Link>
      </div>
    </header>
  );
}
