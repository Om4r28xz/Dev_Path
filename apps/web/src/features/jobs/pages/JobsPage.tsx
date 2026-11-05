import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Alert } from '../../../components/feedback/Alert.js';
import { Button } from '../../../components/ui/Button.js';
import { ApiError } from '../../../lib/http/client.js';
import { useSession } from '../../auth/SessionProvider.js';
import { AnalysisResult } from '../../analyses/components/AnalysisResult.js';
import type { Analysis } from '../../analyses/types.js';
import { useAnalysisSkillNames } from '../../analyses/use-skill-names.js';
import '../../analyses/pages/history.css';
import {
  analyzeProviderJob,
  getJobDetails,
  JobsResponseError,
  searchJobs,
  type Job,
  type JobsMode,
} from '../api/index.js';
import './jobs.css';

export function describeProviderError(
  error: unknown,
  context: 'search' | 'nextPage' | 'details' | 'analyze',
): string {
  if (error instanceof JobsResponseError) {
    return 'La respuesta del proveedor de vacantes no tuvo un formato válido.';
  }
  if (error instanceof ApiError) {
    if (error.status === 429 || error.code === 'RATE_LIMITED') {
      return 'Se alcanzó el límite de cuota o consultas del proveedor (HTTP 429). Espera antes de volver a intentar o usa el análisis manual.';
    }
    if (error.status === 504 || error.code === 'DEPENDENCY_TIMEOUT') {
      return 'El proveedor de vacantes tardó demasiado en responder (timeout de 5 s). Puedes reintentar o usar el análisis manual.';
    }
    if (error.status === 503 || error.code === 'DEPENDENCY_UNAVAILABLE') {
      return context === 'analyze'
        ? 'No fue posible guardar el análisis de esta vacante porque el proveedor o el permiso de retención live no están habilitados. Puedes analizar el texto manualmente.'
        : 'El proveedor de vacantes no está disponible en este momento. Puedes continuar con el análisis manual.';
    }
    if (error.status === 404 || error.code === 'NOT_FOUND') {
      return 'La vacante seleccionada ya no está disponible.';
    }
    if (error.status === 400 || error.code === 'VALIDATION_ERROR') {
      return 'Los parámetros de búsqueda o paginación no son válidos. Inicia una nueva búsqueda.';
    }
  }
  if (context === 'nextPage') {
    return 'No se pudo cargar la siguiente página. Las vacantes ya cargadas siguen disponibles.';
  }
  return 'No se pudo conectar con el servicio de vacantes. Puedes reintentar de forma segura.';
}

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return '5e9220ea-e5b7-42bb-8a88-adf08763837f';
}

export function JobsPage() {
  const { session } = useSession();
  return session ? <OwnedJobsWorkspace key={session.user.id} owner={session.user.id} /> : null;
}

function OwnedJobsWorkspace({ owner }: { owner: string }) {
  const queryClient = useQueryClient();
  const skillNames = useAnalysisSkillNames(owner);

  const [queryInput, setQueryInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    q?: string | undefined;
    location?: string | undefined;
  }>({});

  const [activeQuery, setActiveQuery] = useState<{ q: string; location?: string } | null>(null);
  const [items, setItems] = useState<Job[]>([]);
  const [mode, setMode] = useState<JobsMode>('fixture');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [searchPending, setSearchPending] = useState(false);
  const [nextPagePending, setNextPagePending] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [nextPageError, setNextPageError] = useState('');

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailsPending, setDetailsPending] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const [analysisResult, setAnalysisResult] = useState<Analysis | null>(null);
  const [analyzePending, setAnalyzePending] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');

  const searchAbort = useRef<AbortController | null>(null);
  const detailsAbort = useRef<AbortController | null>(null);
  const analyzeAbort = useRef<AbortController | null>(null);
  const idempotencyByJob = useRef<Map<string, string>>(new Map());
  const errorRegion = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      searchAbort.current?.abort();
      detailsAbort.current?.abort();
      analyzeAbort.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (searchError || nextPageError || detailsError || analyzeError) {
      errorRegion.current?.focus();
    }
  }, [searchError, nextPageError, detailsError, analyzeError]);

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (searchPending || nextPagePending) return;

    const trimmedQ = queryInput.trim();
    const trimmedLocation = locationInput.trim();
    const nextFieldErrors: { q?: string; location?: string } = {};

    if (!trimmedQ || trimmedQ.length > 80) {
      nextFieldErrors.q = 'Ingresa un puesto o tecnología entre 1 y 80 caracteres.';
    }
    if (trimmedLocation.length > 120) {
      nextFieldErrors.location = 'La ubicación no puede superar 120 caracteres.';
    }
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    searchAbort.current?.abort();
    const controller = new AbortController();
    searchAbort.current = controller;

    setSearchPending(true);
    setSearchError('');
    setNextPageError('');
    setDetailsError('');
    setAnalyzeError('');
    setAnalysisResult(null);
    // Discard any previous cursor when query or location changes
    setNextCursor(null);

    try {
      const response = await searchJobs(
        { q: trimmedQ, location: trimmedLocation || undefined },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setActiveQuery({ q: trimmedQ, ...(trimmedLocation ? { location: trimmedLocation } : {}) });
      setItems(response.items);
      setMode(response.mode);
      setNextCursor(response.nextCursor ?? null);
      setHasSearched(true);
      const firstJob = response.items[0] ?? null;
      setSelectedJob(firstJob);
    } catch (error) {
      if (!controller.signal.aborted) {
        setSearchError(describeProviderError(error, 'search'));
        setHasSearched(true);
      }
    } finally {
      if (searchAbort.current === controller) {
        searchAbort.current = null;
        setSearchPending(false);
      }
    }
  }

  async function handleLoadMore() {
    if (!activeQuery || !nextCursor || searchPending || nextPagePending) return;

    searchAbort.current?.abort();
    const controller = new AbortController();
    searchAbort.current = controller;

    setNextPagePending(true);
    setNextPageError('');

    try {
      const response = await searchJobs(
        {
          q: activeQuery.q,
          location: activeQuery.location,
          cursor: nextCursor,
        },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.providerId));
        const appended = response.items.filter((item) => !seen.has(item.providerId));
        return [...prev, ...appended];
      });
      setMode(response.mode);
      setNextCursor(response.nextCursor ?? null);
    } catch (error) {
      if (!controller.signal.aborted) {
        setNextPageError(describeProviderError(error, 'nextPage'));
      }
    } finally {
      if (searchAbort.current === controller) {
        searchAbort.current = null;
        setNextPagePending(false);
      }
    }
  }

  async function handleSelectJob(job: Job) {
    setSelectedJob(job);
    setDetailsError('');
    setAnalyzeError('');
    setAnalysisResult(null);

    detailsAbort.current?.abort();
    const controller = new AbortController();
    detailsAbort.current = controller;
    setDetailsPending(true);

    try {
      const response = await getJobDetails(job.providerId, controller.signal);
      if (controller.signal.aborted) return;
      setSelectedJob(response.job);
      setMode(response.mode);
    } catch (error) {
      if (!controller.signal.aborted) {
        setDetailsError(describeProviderError(error, 'details'));
      }
    } finally {
      if (detailsAbort.current === controller) {
        detailsAbort.current = null;
        setDetailsPending(false);
      }
    }
  }

  async function handleAnalyzeSelected() {
    if (!selectedJob || analyzePending) return;

    analyzeAbort.current?.abort();
    const controller = new AbortController();
    analyzeAbort.current = controller;
    setAnalyzePending(true);
    setAnalyzeError('');

    let key = idempotencyByJob.current.get(selectedJob.providerId);
    if (!key) {
      key = createIdempotencyKey();
      idempotencyByJob.current.set(selectedJob.providerId, key);
    }

    try {
      const analysis = await analyzeProviderJob(selectedJob.providerId, key, controller.signal);
      if (controller.signal.aborted) return;
      queryClient.setQueryData(['analysis', owner, analysis.id], analysis);
      void queryClient.invalidateQueries({ queryKey: ['analyses', owner] }).catch(() => undefined);
      setAnalysisResult(analysis);
    } catch (error) {
      if (!controller.signal.aborted) {
        setAnalyzeError(describeProviderError(error, 'analyze'));
      }
    } finally {
      if (analyzeAbort.current === controller) {
        analyzeAbort.current = null;
        setAnalyzePending(false);
      }
    }
  }

  return (
    <div className="analysis-page analysis-page--wide jobs-page">
      <header className="jobs-header">
        <div>
          <p className="analysis-page__eyebrow">Exploración de vacantes (M3)</p>
          <h1>Buscar vacantes y comparar habilidades</h1>
          <p className="analysis-page__lead">
            Consulta vacantes normalizadas a través del servidor y compáralas con{' '}
            <Link to="/profile">tus habilidades</Link>. El porcentaje refleja coincidencia
            tecnológica; no predice contratación. También puedes usar el{' '}
            <Link to="/analysis/new">análisis manual de texto</Link>.
          </p>
        </div>
        <span
          className={`jobs-provenance jobs-provenance--${mode}`}
          role="status"
          aria-live="polite"
        >
          {mode === 'live'
            ? 'Modo en vivo (JSearch API)'
            : 'Modo demostración (fixtures sintéticos)'}
        </span>
      </header>

      {mode === 'fixture' && (
        <Alert variant="info">
          <strong>Datos sintéticos de demostración:</strong> las ofertas mostradas en modo{' '}
          <code>fixture</code> son ejemplos locales para validar el flujo sin consumir cuota ni
          presentar vacantes como ofertas actuales.
        </Alert>
      )}

      <form
        className="jobs-search-form surface"
        onSubmit={(event) => void handleSearchSubmit(event)}
        noValidate
        aria-label="Formulario de búsqueda de vacantes"
      >
        <div className="field">
          <label className="field__label" htmlFor="jobs-query-input">
            Puesto o tecnología
          </label>
          <input
            id="jobs-query-input"
            className="field__input"
            type="text"
            maxLength={80}
            placeholder="Ej. React, Frontend junior, Node.js"
            value={queryInput}
            disabled={searchPending}
            aria-invalid={Boolean(fieldErrors.q)}
            aria-describedby={fieldErrors.q ? 'jobs-query-error' : 'jobs-query-hint'}
            onChange={(event) => {
              setQueryInput(event.target.value);
              if (fieldErrors.q) setFieldErrors((prev) => ({ ...prev, q: undefined }));
            }}
          />
          <span id="jobs-query-hint" className="field__hint">
            La búsqueda se ejecuta al enviar el formulario, nunca por cada tecla.
          </span>
          {fieldErrors.q && (
            <span id="jobs-query-error" className="field__error" role="alert">
              {fieldErrors.q}
            </span>
          )}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="jobs-location-input">
            Ubicación o modalidad (opcional)
          </label>
          <input
            id="jobs-location-input"
            className="field__input"
            type="text"
            maxLength={120}
            placeholder="Ej. Remoto, Ciudad de México"
            value={locationInput}
            disabled={searchPending}
            aria-invalid={Boolean(fieldErrors.location)}
            aria-describedby={fieldErrors.location ? 'jobs-location-error' : undefined}
            onChange={(event) => {
              setLocationInput(event.target.value);
              if (fieldErrors.location)
                setFieldErrors((prev) => ({ ...prev, location: undefined }));
            }}
          />
          {fieldErrors.location && (
            <span id="jobs-location-error" className="field__error" role="alert">
              {fieldErrors.location}
            </span>
          )}
        </div>

        <div className="jobs-search-form__actions">
          <Button type="submit" isLoading={searchPending}>
            Buscar vacantes
          </Button>
          <Link to="/analysis/new" className="field__hint">
            ¿Prefieres pegar una vacante manualmente?
          </Link>
        </div>
      </form>

      {(searchError || nextPageError || detailsError || analyzeError) && (
        <div ref={errorRegion} tabIndex={-1}>
          <Alert variant="error">
            {searchError || nextPageError || detailsError || analyzeError}
          </Alert>
        </div>
      )}

      {!hasSearched && !searchPending && (
        <section className="state-panel surface-soft" aria-labelledby="jobs-initial-title">
          <h2 id="jobs-initial-title">Inicia una búsqueda controlada</h2>
          <p>
            Escribe una tecnología o rol (por ejemplo, <strong>React</strong> o{' '}
            <strong>sintético</strong>) y presiona <strong>Buscar vacantes</strong>.
          </p>
        </section>
      )}

      {hasSearched && !searchPending && !searchError && items.length === 0 && (
        <section className="state-panel surface-soft" aria-labelledby="jobs-empty-title">
          <h2 id="jobs-empty-title">Sin vacantes para esta consulta</h2>
          <p>
            No encontramos resultados que coincidan con los filtros indicados. Prueba con otro
            término o usa el <Link to="/analysis/new">análisis manual</Link>.
          </p>
        </section>
      )}

      {items.length > 0 && (
        <div className="jobs-workspace">
          <section className="jobs-list-panel" aria-labelledby="jobs-results-heading">
            <h2 id="jobs-results-heading">Resultados ({items.length})</h2>
            <ul className="jobs-list">
              {items.map((job) => {
                const isSelected = selectedJob?.providerId === job.providerId;
                return (
                  <li
                    key={job.providerId}
                    className={`jobs-card${isSelected ? ' jobs-card--selected' : ''}`}
                  >
                    <h3 className="jobs-card__title">{job.title}</h3>
                    <p className="jobs-card__meta">
                      {job.company ?? 'Empresa no especificada'} ·{' '}
                      {job.location ?? 'Ubicación no especificada'}
                    </p>
                    <div className="jobs-card__actions">
                      <Button
                        type="button"
                        variant={isSelected ? 'primary' : 'secondary'}
                        onClick={() => void handleSelectJob(job)}
                      >
                        {isSelected ? 'Vacante seleccionada' : 'Ver detalle'}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>

            {nextCursor !== null && (
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  isLoading={nextPagePending}
                  disabled={searchPending || nextPagePending}
                  onClick={() => void handleLoadMore()}
                >
                  {nextPagePending ? 'Cargando más vacantes…' : 'Cargar más vacantes'}
                </Button>
              </div>
            )}
          </section>

          <section className="jobs-detail-panel" aria-labelledby="jobs-detail-heading">
            <h2 id="jobs-detail-heading">Detalle de la vacante</h2>
            {selectedJob ? (
              <article className="jobs-detail-card surface" aria-busy={detailsPending}>
                <header className="jobs-detail__header">
                  <h3>{selectedJob.title}</h3>
                  <p className="jobs-card__meta">
                    <strong>Empresa:</strong> {selectedJob.company ?? 'No especificada'} ·{' '}
                    <strong>Ubicación:</strong> {selectedJob.location ?? 'No especificada'}
                  </p>
                </header>

                {detailsPending && <p role="status">Actualizando detalle de la vacante…</p>}

                <p className="jobs-detail__description">{selectedJob.description}</p>

                <div className="jobs-attribution">
                  <span>
                    Fuente:{' '}
                    {mode === 'live'
                      ? 'JSearch (OpenWeb Ninja / RapidAPI)'
                      : 'Fixture sintético DevPath (estructura JSearch)'}
                  </span>
                  {selectedJob.applyUrl && (
                    <a href={selectedJob.applyUrl} target="_blank" rel="noopener noreferrer">
                      Abrir enlace externo de la oferta
                    </a>
                  )}
                </div>

                <div className="jobs-detail__actions">
                  <Button
                    type="button"
                    isLoading={analyzePending}
                    disabled={detailsPending || analyzePending}
                    onClick={() => void handleAnalyzeSelected()}
                  >
                    Analizar compatibilidad con mi perfil
                  </Button>
                  {analysisResult && (
                    <Link to={`/analyses/${encodeURIComponent(analysisResult.id)}`}>
                      Ver análisis guardado en el historial
                    </Link>
                  )}
                </div>
              </article>
            ) : (
              <div className="surface-soft">
                <p>Selecciona una vacante de la lista para revisar su descripción y analizarla.</p>
              </div>
            )}

            {analysisResult && <AnalysisResult analysis={analysisResult} skillNames={skillNames} />}
          </section>
        </div>
      )}
    </div>
  );
}
