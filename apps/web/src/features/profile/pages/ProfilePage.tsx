import React from 'react';
import { Alert } from '../../../components/feedback/Alert.js';

export const ProfilePage: React.FC = () => {
  return (
    <div className="page-form">
      <h1>Mi perfil</h1>
      <Alert variant="info">
        La conexión con la API estará disponible al completar los módulos de autenticación.
      </Alert>
      <p>Perfil pendiente de conexión.</p>
    </div>
  );
};
