import { AnalysisResponseError } from '../validation.js';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { Button } from '../../../components/ui/Button.js';
import { Alert } from '../../../components/feedback/Alert.js';
import { ApiError } from '../../../lib/http/client.js';
import { browserSession } from '../../../lib/session/session.js';
import { useSession } from '../../auth/SessionProvider.js';
import { createAnalysis } from '../api.js';
import { AnalysisAttempt, validateAnalysisDraft, type DraftErrors } from '../draft.js';

function failureMessage(error: unknown): string {
  if (error instanceof AnalysisResponseError)
    return 'No se pudo validar el resultado. Conservamos la vacante para que reintentes.';
  if (error instanceof ApiError) {
    if (error.code === 'DEPENDENCY_TIMEOUT')
      return 'El análisis tardó demasiado. Conservamos la vacante para que reintentes la misma solicitud.';
    if (error.code === 'DEPENDENCY_UNAVAILABLE')
      return 'No se pudo completar el análisis. Conservamos la vacante para que reintentes.';
    if (error.code === 'IDEMPOTENCY_KEY_REUSED')
      return 'Esta solicitud ya está asociada a otra entrada. Revisa y edita la vacante antes de volver a enviarla.';
    if (error.status === 429) return 'Hay demasiadas solicitudes. Espera antes de reintentar.';
    if (error.status === 401) return 'Inicia sesión para continuar.';
    if (error.status === 400) return 'Revisa el título y el texto de la vacante.';
  }
  return 'No se pudo conectar. Conservamos la vacante; puedes reintentar de forma segura.';
}
export function NewAnalysisPage() {
  const { session } = useSession();
  return session ? <AnalysisForm key={session.user.id} owner={session.user.id} /> : null;
}
function AnalysisForm({ owner }: { owner: string }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<DraftErrors>({});
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const attempt = useRef(new AnalysisAttempt());
  const sending = useRef(false);
  const request = useRef<AbortController | null>(null);
  const textField = useRef<HTMLTextAreaElement>(null);
  const titleField = useRef<HTMLInputElement>(null);
  const errorRegion = useRef<HTMLDivElement>(null);
  const client = useQueryClient();
  const navigate = useNavigate();
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (errors.text) textField.current?.focus();
    else if (errors.title) titleField.current?.focus();
    else if (message) errorRegion.current?.focus();
  }, [errors, message]);
  function edited() {
    attempt.current.edited();
    setMessage('');
    setErrors({});
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const invalid = validateAnalysisDraft(title, text);
    setErrors(invalid);
    setMessage('');
    if (Object.keys(invalid).length) return;
    if (browserSession.snapshot().session?.user.id !== owner) return;
    const prepared = attempt.current.prepare(title, text);
    const controller = new AbortController();
    request.current = controller;
    sending.current = true;
    setPending(true);
    try {
      const analysis = await createAnalysis(prepared.command, prepared.key, controller.signal);
      if (controller.signal.aborted || browserSession.snapshot().session?.user.id !== owner) return;
      client.setQueryData(['analysis', owner, analysis.id], analysis);
      await client.invalidateQueries({ queryKey: ['analyses', owner] });
      if (controller.signal.aborted || browserSession.snapshot().session?.user.id !== owner) return;
      navigate('/analyses/' + encodeURIComponent(analysis.id));
    } catch (error) {
      if (!controller.signal.aborted && browserSession.snapshot().session?.user.id === owner)
        setMessage(failureMessage(error));
    } finally {
      sending.current = false;
      request.current = null;
      setPending(false);
    }
  }
  return (
    <div className="page-form">
      <h1>Nuevo análisis</h1>
      <p>
        Pega una vacante y compárala con <Link to="/profile">tus habilidades guardadas</Link>.
      </p>
      {message && (
        <div ref={errorRegion} tabIndex={-1}>
          <Alert variant="error">{message}</Alert>
        </div>
      )}
      <form onSubmit={(event) => void submit(event)} noValidate aria-busy={pending}>
        <div className="field">
          <label className="field__label" htmlFor="analysis-title">
            Título del puesto (opcional)
          </label>
          <input
            ref={titleField}
            id="analysis-title"
            className="field__input"
            maxLength={120}
            value={title}
            disabled={pending}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'analysis-title-error' : undefined}
            onChange={(event) => {
              edited();
              setTitle(event.target.value);
            }}
          />
          {errors.title && (
            <span id="analysis-title-error" className="field__error" role="alert">
              {errors.title}
            </span>
          )}
        </div>
        <div className="field">
          <label className="field__label" htmlFor="analysis-text">
            Texto de la vacante
          </label>
          <textarea
            ref={textField}
            id="analysis-text"
            className="field__input"
            required
            rows={10}
            maxLength={20000}
            value={text}
            disabled={pending}
            aria-invalid={Boolean(errors.text)}
            aria-describedby={'analysis-text-hint' + (errors.text ? ' analysis-text-error' : '')}
            onChange={(event) => {
              edited();
              setText(event.target.value);
            }}
          />
          <span id="analysis-text-hint" className="field__hint">
            {text.length} / 20 000 caracteres
          </span>
          {errors.text && (
            <span id="analysis-text-error" className="field__error" role="alert">
              {errors.text}
            </span>
          )}
        </div>
        <Button type="submit" isLoading={pending}>
          Analizar
        </Button>
      </form>
      {pending && <p role="status">Analizando vacante…</p>}
    </div>
  );
}
