import { Link, Navigate, Outlet, useLocation } from 'react-router';
import { Alert } from '../../components/feedback/Alert.js';
import { useSession } from './SessionProvider.js';
import { safeReturnTo } from './form-utils.js';

function SessionPending() {
  return (
    <main className="page-form" role="status" aria-live="polite">
      <p>Comprobando tu sesión…</p>
    </main>
  );
}

export function RequireSession() {
  const { status } = useSession();
  const location = useLocation();
  if (status === 'bootstrapping') return <SessionPending />;
  if (status === 'unavailable')
    return (
      <main className="page-form">
        <Alert variant="error">No pudimos confirmar tu sesión.</Alert>
        <Link to="/login">Iniciar sesión de nuevo</Link>
      </main>
    );
  if (status === 'anonymous') {
    const returnTo = location.pathname + location.search + location.hash;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }
  return <Outlet />;
}

export function GuestRoute() {
  const { status } = useSession();
  const location = useLocation();
  if (status === 'bootstrapping') return <SessionPending />;
  if (status === 'authenticated') {
    const destination = safeReturnTo(
      new URLSearchParams(location.search).get('returnTo'),
      window.location.origin,
    );
    return <Navigate to={destination} replace />;
  }
  return <Outlet />;
}
