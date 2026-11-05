import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { Alert } from '../../../components/feedback/Alert.js';
import { StatePanel } from '../../../components/feedback/StatePanel.js';
import { Button } from '../../../components/ui/Button.js';
import { ApiError } from '../../../lib/http/client.js';
import { useSession } from '../../auth/SessionProvider.js';
import { loadLearningPath, updateLearningStep } from '../api.js';
import { safeExternalResource, type LearningPath, type LearningStep } from '../types.js';
import './learning-paths.css';

const statusLabels: Record<LearningStep['status'], string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  completed: 'Completado',
};

export function LearningPathDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { session } = useSession();
  return session ? (
    <OwnedLearningPath key={`${session.user.id}:${id}`} owner={session.user.id} id={id} />
  ) : null;
}

function OwnedLearningPath({ owner, id }: { owner: string; id: string }) {
  const queryClient = useQueryClient();
  const validId = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/iu.test(id);
  const pathKey = ['learning-path', owner, id];
  const path = useQuery({
    queryKey: pathKey,
    queryFn: ({ signal }) => loadLearningPath(id, signal),
    enabled: validId,
    retry: false,
  });
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');
  const errorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const missing =
    !validId || (path.error instanceof ApiError && [400, 404].includes(path.error.status));

  useEffect(() => {
    if (error || missing || path.isError) errorRef.current?.focus();
  }, [error, missing, path.isError]);
  useEffect(() => {
    if (path.data) contentRef.current?.focus();
  }, [path.data?.id]);

  async function changeStatus(step: LearningStep, status: LearningStep['status']) {
    if (updating || status === step.status) return;
    setUpdating(step.id);
    setError('');
    try {
      const updated = await updateLearningStep(id, step.id, status);
      queryClient.setQueryData<LearningPath>(pathKey, updated);
      await queryClient.invalidateQueries({ queryKey: ['learning-paths', owner] });
    } catch {
      setError(
        `No se pudo cambiar “${step.title}”. Se conserva el estado ${statusLabels[step.status].toLowerCase()}.`,
      );
    } finally {
      setUpdating(null);
    }
  }

  if (missing)
    return (
      <div ref={errorRef} tabIndex={-1}>
        <StatePanel kind="error" title="Ruta no encontrada">
          <p>La ruta no existe, fue eliminada o pertenece a otra cuenta.</p>
          <Link to="/learning-paths">Volver a mis rutas</Link>
        </StatePanel>
      </div>
    );
  if (path.isPending)
    return (
      <StatePanel kind="loading" title="Cargando la ruta">
        <p>Consultando pasos y progreso guardados.</p>
      </StatePanel>
    );
  if (path.isError)
    return (
      <div ref={errorRef} tabIndex={-1}>
        <StatePanel
          kind="error"
          title="No se pudo cargar la ruta"
          action={<Button onClick={() => void path.refetch()}>Reintentar</Button>}
        />
      </div>
    );

  return (
    <div className="learning-page" ref={contentRef} tabIndex={-1}>
      <nav aria-label="Navegación de la ruta">
        <Link to="/learning-paths">← Volver a mis rutas</Link>
      </nav>
      <header className="learning-detail-header">
        <p className="page-eyebrow">Ruta de aprendizaje</p>
        <h1>{path.data.message ?? 'Pasos recomendados'}</h1>
        <p>
          Esta ruta se generó de forma determinista desde un análisis guardado. El avance es
          autodeclarado; no certifica habilidades ni garantiza empleo.
        </p>
      </header>

      <section className="learning-progress surface" aria-labelledby="learning-progress-title">
        <h2 id="learning-progress-title">Tu avance declarado</h2>
        {path.data.progress.total === 0 ? (
          <Alert variant="success">
            No se detectaron brechas en ese análisis. No tienes pasos pendientes en esta ruta.
          </Alert>
        ) : (
          <>
            <p>
              {path.data.progress.completed} de {path.data.progress.total} pasos completados
            </p>
            <progress
              value={path.data.progress.percentage ?? 0}
              max="100"
              aria-label={`Progreso autodeclarado: ${path.data.progress.percentage ?? 0}%`}
            >
              {path.data.progress.percentage ?? 0}%
            </progress>
          </>
        )}
      </section>

      {error && (
        <div ref={errorRef} tabIndex={-1}>
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {path.data.steps.length > 0 && (
        <section aria-labelledby="learning-steps-title">
          <h2 id="learning-steps-title">Siguientes pasos</h2>
          <ol className="learning-steps">
            {path.data.steps.map((step, index) => (
              <li key={step.id} className="learning-step surface">
                <div className="learning-step__heading">
                  <span className="learning-step__number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div>
                    <p className="learning-card__label">{statusLabels[step.status]}</p>
                    <h3>{step.title}</h3>
                  </div>
                </div>
                <div>
                  <h4>Por qué aparece</h4>
                  <p>{step.reason}</p>
                </div>
                <div>
                  <h4>Actividad</h4>
                  <p>{step.activity}</p>
                </div>
                <p className="learning-project-note">
                  {step.projectId ? (
                    <>
                      Este paso se vinculó con un proyecto existente al generar la ruta.{' '}
                      <Link to="/profile/projects">Revisar mis proyectos</Link>.
                    </>
                  ) : (
                    'El proyecto vinculado ya no está disponible o esta ruta no usó uno. La actividad guardada permanece disponible.'
                  )}
                </p>
                {safeExternalResource(step.resourceUrl) && (
                  <p>
                    <a
                      href={safeExternalResource(step.resourceUrl) ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir recurso de apoyo (sitio externo)
                    </a>
                  </p>
                )}
                <label className="field" htmlFor={`step-${step.id}-status`}>
                  <span className="field__label">Estado autodeclarado</span>
                  <select
                    id={`step-${step.id}-status`}
                    className="field__input learning-step__select"
                    value={step.status}
                    disabled={updating !== null}
                    onChange={(event) =>
                      void changeStatus(step, event.target.value as LearningStep['status'])
                    }
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En progreso</option>
                    <option value="completed">Completado</option>
                  </select>
                  {updating === step.id && <span role="status">Guardando estado…</span>}
                </label>
              </li>
            ))}
          </ol>
        </section>
      )}

      <details className="learning-snapshot surface-soft">
        <summary>Versiones de esta instantánea</summary>
        <dl>
          <div>
            <dt>Catálogo</dt>
            <dd>{path.data.versions.catalog}</dd>
          </div>
          <div>
            <dt>Contenido</dt>
            <dd>{path.data.versions.content}</dd>
          </div>
          <div>
            <dt>Generador</dt>
            <dd>{path.data.versions.generator}</dd>
          </div>
          <div>
            <dt>Revisión de proyectos</dt>
            <dd>{path.data.projectsRevision}</dd>
          </div>
        </dl>
        <p>Los cambios posteriores en proyectos o catálogo no reescriben esta ruta guardada.</p>
      </details>
    </div>
  );
}
