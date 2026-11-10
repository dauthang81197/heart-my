import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { useI18n } from '../i18n';
import Logo from './Logo';

export default function AppHeader() {
  const { user } = useAuth();
  const { lang, setLang, t } = useI18n();
  const { pathname } = useLocation();
  const [n, setN] = useState(0);
  const links: [string, string][] = lang === 'vi' ? [['/app', 'Tổng quan'], ['/app/vault', 'Hộp thư'], ['/app/stamps', 'Tem']] : [['/app', 'Overview'], ['/app/vault', 'Mailbox'], ['/app/stamps', 'Stamps']];
  useEffect(() => { api('/stamps/mine').then((m: any[]) => setN(m.reduce((a, s) => a + s.quantity, 0))).catch(() => undefined); }, []);
  return (
    <header className="apphead">
      <Logo to="/app" />
      <nav className="appnav hide-m">{links.map(([to, n]) => <Link key={to} to={to} className={pathname === to ? 'on' : ''}>{n}</Link>)}</nav>
      <div className="nav-r">
        <div className="lang">
          <button className={lang === 'vi' ? 'on' : ''} onClick={() => setLang('vi')}>VI</button>
          <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
        </div>
        <a className="hide-m" href="mailto:hello@truenote.online">{t('contact')}</a>
        <Link to="/app/stamps" className="pill">🏷 {n}</Link>
        <Link to="/app/settings" className="avatar">{user?.avatar ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" /> : (user?.name?.[0] ?? '?').toUpperCase()}</Link>
      </div>
    </header>
  );
}
