import React, { useState } from 'react';
import { Link } from 'react-router';
import { TextField } from '../../../components/forms/TextField.js';
import { Button } from '../../../components/ui/Button.js';
import { Alert } from '../../../components/feedback/Alert.js';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // Not yet connected to API — M1 visual preview only
  };

  return (
    <div className="page-form">
      <h1>Iniciar sesión</h1>
      <Alert variant="info">
        La autenticación aún no está implementada. Esta pantalla es un avance visual de M1.
      </Alert>
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          id="email"
          label="Correo electrónico"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          id="password"
          label="Contraseña"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="primary">
          Entrar
        </Button>
      </form>
      <p>
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </div>
  );
};
