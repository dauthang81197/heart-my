import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import { AuthProvider } from './auth';
import { I18nProvider } from './i18n';
import { UIProvider } from './components/UI';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
      <BrowserRouter><UIProvider><I18nProvider><AuthProvider><App /></AuthProvider></I18nProvider></UIProvider></BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
);
