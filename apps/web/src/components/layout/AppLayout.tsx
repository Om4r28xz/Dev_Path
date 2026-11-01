import { useRef, useState } from 'react';
import { Link, Outlet, NavLink, useNavigate } from 'react-router';
import { useSession } from '../../features/auth/SessionProvider.js';
import { Alert } from '../feedback/Alert.js';
import { Button } from '../ui/Button.js';

export function AppLayout() {
  const { logout, session } = useSession();
  const navigate = useNavigate();
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function handleLogout() {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError('');
    let completed = false;
    try {
      await logout();
      navigate('/login', { replace: true });
      completed = true;
    } catch {
      setError('No se pudo cerrar la sesión. Inténtalo más tarde.');
    } finally {
      if (!completed) {
        submitting.current = false;
        setPending(false);
      }
    }
  }

  return (
    <>
      <header className="layout-header">
        <Link to="/profile" className="layout-header__brand">
          DevPath
        </Link>
        <nav className="layout-nav" aria-label="Navegación principal">
          <NavLink to="/profile">Mi perfil</NavLink>
          <NavLink to="/analysis/new">Nuevo análisis</NavLink>
          <NavLink to="/analyses">Historial</NavLink>
        </nav>
        <div className="layout-actions">
          <span>{session?.user.name}</span>
          <Button variant="secondary" isLoading={pending} onClick={() => void handleLogout()}>
            Cerrar sesión
          </Button>
        </div>
      </header>
      <main className="layout-main">
        {error && <Alert variant="error">{error}</Alert>}
        <Outlet />
      </main>
    </>
  );
}
