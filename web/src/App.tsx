import { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import SendLetter from './pages/SendLetter';
import Admin from './pages/Admin';
import ViewLetter from './pages/ViewLetter';
import { Privacy, Terms } from './pages/Legal';
import { Forgot, Reset, Verify } from './pages/AuthLinks';
import { Spinner } from './components/UI';

function Private({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot" element={<Forgot />} />
      <Route path="/reset" element={<Reset />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/l/:token" element={<ViewLetter />} />
      <Route path="/app/*" element={<Private><Dashboard /></Private>} />
      <Route path="/admin" element={<Private><Admin /></Private>} />
      <Route path="/editor/:id" element={<Private><Editor /></Private>} />
      <Route path="/send/:id" element={<Private><SendLetter /></Private>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
