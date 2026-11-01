import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Alert } from '../../../components/feedback/Alert.js';
import { TextField } from '../../../components/forms/TextField.js';
import { Button } from '../../../components/ui/Button.js';
import { ApiError, authRequest } from '../../../lib/http/client.js';
import type { SessionResponse } from '../../../lib/session/session.js';
import { useSession } from '../SessionProvider.js';
import { authErrorMessage, safeReturnTo, validateLogin } from '../form-utils.js';
import type { FieldErrors, LoginFields } from '../form-utils.js';

export function LoginPage() {
  const [fields, setFields] = useState<LoginFields>({ email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors<LoginFields>>({});
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
    const nextErrors = validateLogin(fields);
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
      const session = await authRequest<SessionResponse>('login', {
        email: fields.email.trim().toLowerCase(),
        password: fields.password,
      });
      await accept(session);
      navigate(returnTo, { replace: true });
      completed = true;
    } catch (error) {
      setServerError(authErrorMessage(error));
      if (error instanceof ApiError && error.status === 401)
        setFields((old) => ({ ...old, password: '' }));
    } finally {
      if (!completed) {
        submitting.current = false;
        setPending(false);
      }
    }
  }

  return (
    <main className="page-form">
      <h1>Iniciar sesión</h1>
      {serverError && (
        <div ref={errorFocus} tabIndex={-1}>
          <Alert variant="error">{serverError}</Alert>
        </div>
      )}
      <form onSubmit={(event) => void handleSubmit(event)} noValidate aria-busy={pending}>
        <TextField
          id="email"
          label="Correo electrónico"
          type="email"
          required
          autoComplete="email"
          autoFocus
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
          autoComplete="current-password"
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
          Entrar
        </Button>
      </form>
      <p>
        ¿No tienes cuenta?{' '}
        <Link
          to={
            returnTo === '/profile'
              ? '/register'
              : `/register?returnTo=${encodeURIComponent(returnTo)}`
          }
        >
          Regístrate
        </Link>
      </p>
    </main>
  );
}
