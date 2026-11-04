import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '../../../lib/http/client.js';
import { useSession } from '../../auth/SessionProvider.js';
import { loadAnalysis } from '../api.js';
import { AnalysisResult } from '../components/AnalysisResult.js';
import { AnalysisDetailState } from '../components/AnalysisDetailState.js';
import { useAnalysisSkillNames } from '../use-skill-names.js';
import './history.css';

export function AnalysisDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { session } = useSession();
  return session ? (
    <OwnedAnalysisDetail key={session.user.id + ':' + id} owner={session.user.id} id={id} />
  ) : null;
}
function OwnedAnalysisDetail({ owner, id }: { owner: string; id: string }) {
  const validId = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/iu.test(id);
  const analysis = useQuery({
    queryKey: ['analysis', owner, id],
    queryFn: ({ signal }) => loadAnalysis(id, signal),
    enabled: validId,
    retry: false,
    refetchOnMount: 'always',
    staleTime: 0,
  });
  const names = useAnalysisSkillNames(owner);
  const resultRegion = useRef<HTMLDivElement>(null);
  const errorRegion = useRef<HTMLDivElement>(null);
  const focused = useRef(false);
  const missing =
    !validId || (analysis.error instanceof ApiError && [400, 404].includes(analysis.error.status));
  useEffect(() => {
    if (missing || analysis.isError) {
      focused.current = false;
      errorRegion.current?.focus();
    }
  }, [missing, analysis.isError, analysis.error]);
  useEffect(() => {
    if (analysis.data && !analysis.isError && !focused.current) {
      resultRegion.current?.focus();
      focused.current = true;
    }
  }, [analysis.data, analysis.isError]);
  if (missing)
    return (
      <div className="analysis-page analysis-page--form" ref={errorRegion} tabIndex={-1}>
        <AnalysisDetailState kind="not-found" />
      </div>
    );
  if (analysis.isPending)
    return (
      <div className="analysis-page analysis-page--form">
        <AnalysisDetailState kind="loading" />
      </div>
    );
  if (analysis.isError)
    return (
      <div className="analysis-page analysis-page--form" ref={errorRegion} tabIndex={-1}>
        <AnalysisDetailState
          kind="error"
          retry={() => void analysis.refetch()}
          retrying={analysis.isFetching}
        />
      </div>
    );
  return (
    <div className="analysis-page" ref={resultRegion} tabIndex={-1} aria-busy={analysis.isFetching}>
      <nav className="analysis-breadcrumb" aria-label="Navegación del análisis">
        <Link to="/analyses">← Volver al historial</Link>
      </nav>
      {analysis.isFetching && <p role="status">Actualizando análisis…</p>}
      <AnalysisResult analysis={analysis.data} skillNames={names} />
      <div className="analysis-next-actions surface-soft">
        <h2>Siguiente paso</h2>
        <p>
          Puedes <Link to="/analysis/new">analizar otra vacante</Link> o{' '}
          <Link to="/profile">revisar tus habilidades</Link> antes de una nueva comparación.
        </p>
      </div>
    </div>
  );
}
