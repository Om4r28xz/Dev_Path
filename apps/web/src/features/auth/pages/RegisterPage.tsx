import React, { useState } from 'react';
import { TextField } from '../../../components/forms/TextField.js';
import { Button } from '../../../components/ui/Button.js';
import { Alert } from '../../../components/feedback/Alert.js';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // Not yet connected to API — M1 visual preview only
  };

  return (
    <div className="page-form">
      <h1>Crear cuenta</h1>
      <Alert variant="info">
        La autenticación aún no está implementada. Esta pantalla es un avance visual de M1.
      </Alert>
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          id="full_name"
          label="Nombre completo"
          type="text"
          required
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="primary">
          Registrarse
        </Button>
      </form>
    </div>
  );
};
