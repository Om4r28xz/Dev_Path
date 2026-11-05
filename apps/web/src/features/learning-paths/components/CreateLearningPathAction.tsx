import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Alert } from '../../../components/feedback/Alert.js';
import { Button } from '../../../components/ui/Button.js';
import { ApiError } from '../../../lib/http/client.js';
import { createLearningPath } from '../api.js';

function messageFor(error: unknown): string {
  if (error instanceof ApiError && error.status === 404)
    return 'El análisis ya no está disponible. Vuelve al historial y elige otro resultado.';
  if (error instanceof ApiError && error.status === 409)
    return 'La solicitud ya se utilizó con datos distintos. Reintenta para iniciar una solicitud segura.';
  return 'No se pudo generar la ruta. El análisis permanece intacto y puedes reintentar.';
}

export function CreateLearningPathAction({
  analysisId,
  hasGaps,
}: {
  analysisId: string;
  hasGaps: boolean;
}) {
  const navigate = useNavigate();
  const submitting = useRef(false);
  const idempotencyKey = useRef(crypto.randomUUID());
  const errorRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function create() {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError('');
    try {
      const path = await createLearningPath(analysisId, idempotencyKey.current);
      navigate(`/learning-paths/${path.id}`);
    } catch (cause) {
      setError(messageFor(cause));
      submitting.current = false;
      setPending(false);
      if (cause instanceof ApiError && cause.status === 409)
        idempotencyKey.current = crypto.randomUUID();
    }
  }

  return (
    <section className="learning-create surface-soft" aria-labelledby="learning-create-title">
      <h2 id="learning-create-title">
        {hasGaps ? 'Convierte las brechas en pasos concretos' : 'Tu análisis no tiene brechas'}
      </h2>
      <p>
        {hasGaps
          ? 'La ruta usa las habilidades faltantes, tus proyectos actuales y contenido curado. No modifica tu análisis.'
          : 'Puedes guardar este resultado como una ruta positiva sin pasos pendientes.'}
      </p>
      <p className="learning-disclaimer">
        El progreso es autodeclarado y completar una ruta no garantiza empleo ni certifica dominio.
      </p>
      {error && (
        <div ref={errorRef} tabIndex={-1}>
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      <Button isLoading={pending} onClick={() => void create()}>
        {hasGaps ? 'Generar ruta de aprendizaje' : 'Guardar ruta sin brechas'}
      </Button>
    </section>
  );
}
