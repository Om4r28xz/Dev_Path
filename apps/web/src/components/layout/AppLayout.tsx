import React from 'react';
import { Outlet, NavLink } from 'react-router';

export const AppLayout: React.FC = () => {
  return (
    <>
      <header className="layout-header">
        <a href="/" className="layout-header__brand">
          DevPath
        </a>
        <nav className="layout-nav" aria-label="Navegación principal">
          <NavLink to="/profile">Mi perfil</NavLink>
          <NavLink to="/analysis/new">Nuevo análisis</NavLink>
          <NavLink to="/analyses">Historial</NavLink>
        </nav>
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
    </>
  );
};
