import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { StatePanel } from '../../../components/feedback/StatePanel.js';
import { Button } from '../../../components/ui/Button.js';
import { ApiError } from '../../../lib/http/client.js';
import { useSession } from '../../auth/SessionProvider.js';
import { loadLearningPaths } from '../api.js';
import type { LearningPath } from '../types.js';
import './learning-paths.css';

function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : 'No se pudieron consultar tus rutas. Reintenta cuando tengas conexión.';
}

function progressText(path: LearningPath) {
  if (path.progress.total === 0) return 'Sin pasos pendientes';
  return `${path.progress.completed} de ${path.progress.total} pasos completados`;
}

export function LearningPathsPage() {
  const { session } = useSession();
  return session ? <OwnedLearningPaths key={session.user.id} owner={session.user.id} /> : null;
}

function OwnedLearningPaths({ owner }: { owner: string }) {
  const paths = useInfiniteQuery({
    queryKey: ['learning-paths', owner],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => loadLearningPaths(pageParam, signal),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    retry: false,
  });
  const items = paths.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="learning-page">
      <header className="learning-header">
        <p className="page-eyebrow">Aprendizaje</p>
        <h1>Mis rutas</h1>
        <p>
          Organiza pasos explicables desde tus análisis. El avance es autodeclarado y no representa
          una probabilidad de conseguir empleo.
        </p>
      </header>
      {paths.isPending && (
        <StatePanel kind="loading" title="Cargando tus rutas">
          <p>Consultando rutas guardadas y su progreso real.</p>
        </StatePanel>
      )}
      {paths.isError && (
        <StatePanel
          kind="error"
          title="No se pudieron cargar las rutas"
          action={<Button onClick={() => void paths.refetch()}>Reintentar</Button>}
        >
          <p>{errorMessage(paths.error)}</p>
        </StatePanel>
      )}
      {paths.isSuccess && items.length === 0 && (
        <StatePanel kind="empty" title="Aún no tienes rutas">
          <p>
            Abre un <Link to="/analyses">análisis guardado</Link> para generar una ruta desde sus
            habilidades faltantes. No mostramos planes de ejemplo como si fueran tuyos.
          </p>
        </StatePanel>
      )}
      {items.length > 0 && (
        <ol className="learning-list">
          {items.map((path) => (
            <li key={path.id} className="learning-card surface">
              <div>
                <p className="learning-card__label">Ruta desde análisis</p>
                <h2>{path.message ?? path.steps[0]?.title ?? 'Ruta de aprendizaje'}</h2>
              </div>
              <p>{progressText(path)}</p>
              {path.progress.percentage !== null && (
                <progress
                  value={path.progress.percentage}
                  max="100"
                  aria-label={`Progreso autodeclarado: ${path.progress.percentage}%`}
                >
                  {path.progress.percentage}%
                </progress>
              )}
              <p className="learning-meta">
                Actualizada el {new Date(path.updatedAt).toLocaleDateString('es-MX')}
              </p>
              <Link className="learning-card__link" to={`/learning-paths/${path.id}`}>
                Ver pasos y registrar avance
              </Link>
            </li>
          ))}
        </ol>
      )}
      {paths.hasNextPage && (
        <Button
          variant="secondary"
          isLoading={paths.isFetchingNextPage}
          onClick={() => void paths.fetchNextPage()}
        >
          Cargar más rutas
        </Button>
      )}
    </div>
  );
}
