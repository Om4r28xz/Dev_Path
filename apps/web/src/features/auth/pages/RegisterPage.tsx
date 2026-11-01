import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Alert } from '../../../components/feedback/Alert.js';
import { TextField } from '../../../components/forms/TextField.js';
import { Button } from '../../../components/ui/Button.js';
import { ApiError, authRequest } from '../../../lib/http/client.js';
import type { SessionResponse } from '../../../lib/session/session.js';
import { useSession } from '../SessionProvider.js';
import { authErrorMessage, safeReturnTo, validateRegister } from '../form-utils.js';
import type { FieldErrors, RegisterFields } from '../form-utils.js';

export function RegisterPage() {
  const [fields, setFields] = useState<RegisterFields>({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors<RegisterFields>>({});
  const [serverError, setServerError] = useState('');
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const errorFocus = useRef<HTMLDivElement>(null);
  const { accept } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = safeReturnTo(
    new URLSearchParams(location.search).get('returnTo'),
    window.location.origin,
  );

  useEffect(() => {
    if (serverError) errorFocus.current?.focus();
  }, [serverError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const nextErrors = validateRegister(fields);
    setErrors(nextErrors);
    setServerError('');
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      document.getElementById(firstError)?.focus();
      return;
    }
    submitting.current = true;
    setPending(true);
    let completed = false;
    try {
      const session = await authRequest<SessionResponse>('register', {
        name: fields.name.trim(),
        email: fields.email.trim().toLowerCase(),
        password: fields.password,
      });
      await accept(session);
      navigate(returnTo, { replace: true });
      completed = true;
    } catch (error) {
      setServerError(authErrorMessage(error));
      if (error instanceof ApiError && error.status === 409)
        setErrors((old) => ({ ...old, email: 'Ese correo ya está registrado.' }));
    } finally {
      if (!completed) {
        submitting.current = false;
        setPending(false);
      }
    }
  }

  return (
    <main className="page-form">
      <h1>Crear cuenta</h1>
      {serverError && (
        <div ref={errorFocus} tabIndex={-1}>
          <Alert variant="error">{serverError}</Alert>
        </div>
      )}
      <form onSubmit={(event) => void handleSubmit(event)} noValidate aria-busy={pending}>
        <TextField
          id="name"
          label="Nombre completo"
          required
          autoComplete="name"
          autoFocus
          maxLength={100}
          disabled={pending}
          error={errors.name ?? ''}
          value={fields.name}
          onChange={(event) => {
            setFields((old) => ({ ...old, name: event.target.value }));
            setErrors((old) => ({ ...old, name: undefined }));
          }}
        />
        <TextField
          id="email"
          label="Correo electrónico"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          disabled={pending}
          error={errors.email ?? ''}
          value={fields.email}
          onChange={(event) => {
            setFields((old) => ({ ...old, email: event.target.value }));
            setErrors((old) => ({ ...old, email: undefined }));
          }}
        />
        <TextField
          id="password"
          label="Contraseña"
          type="password"
          required
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          disabled={pending}
          error={errors.password ?? ''}
          value={fields.password}
          onChange={(event) => {
            setFields((old) => ({ ...old, password: event.target.value }));
            setErrors((old) => ({ ...old, password: undefined }));
          }}
        />
        <Button type="submit" variant="primary" isLoading={pending}>
          Registrarse
        </Button>
      </form>
      <p>
        ¿Ya tienes cuenta?{' '}
        <Link
          to={
            returnTo === '/profile' ? '/login' : `/login?returnTo=${encodeURIComponent(returnTo)}`
          }
        >
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
