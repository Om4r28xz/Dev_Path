import React from 'react';
import { Link } from 'react-router';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="page-form">
      <h1>Página no encontrada</h1>
      <p>La ruta que buscas no existe.</p>
      <p>
        <Link to="/">Volver al inicio</Link>
      </p>
    </div>
  );
};
