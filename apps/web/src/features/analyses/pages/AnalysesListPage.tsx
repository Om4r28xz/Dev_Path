import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from '../../../components/feedback/Alert.js';
import { Button } from '../../../components/ui/Button.js';
import { ApiError } from '../../../lib/http/client.js';
import { browserSession } from '../../../lib/session/session.js';
import { useSession } from '../../auth/SessionProvider.js';
import { loadHistory, deleteAnalysis } from '../history-api.js';
import {
  historyItems,
  removeHistoryItem,
  type AnalysisSummary,
  type HistoryData,
} from '../history.js';
import { AnalysisHistoryList } from '../components/AnalysisHistoryList.js';
import { DeleteAnalysisDialog } from '../components/DeleteAnalysisDialog.js';
import './history.css';

export function AnalysesListPage() {
  const { session } = useSession();
  return session ? <OwnedHistory key={session.user.id} owner={session.user.id} /> : null;
}
function OwnedHistory({ owner }: { owner: string }) {
  const client = useQueryClient();
  const key = ['analyses', owner];
  const history = useInfiniteQuery({
    queryKey: key,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => loadHistory(pageParam, signal),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const removal = useMutation({
    mutationFn: ({ id, signal }: { id: string; signal: AbortSignal }) => deleteAnalysis(id, signal),
  });
  const [selected, setSelected] = useState<AnalysisSummary | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [notice, setNotice] = useState('');
  const heading = useRef<HTMLHeadingElement>(null),
    error = useRef<HTMLDivElement>(null),
    message = useRef<HTMLParagraphElement>(null);
  const list = useRef<HTMLUListElement>(null),
    request = useRef<AbortController | null>(null);
  const deleteTrigger = useRef<HTMLElement | null>(null);
  const deleting = useRef(false),
    nextFocus = useRef<number | null>(null);
  const items = historyItems(history.data?.pages ?? []);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (history.isError) error.current?.focus();
  }, [history.isError, history.error]);
  useEffect(() => {
    if (notice) message.current?.focus();
  }, [notice]);
  useEffect(() => {
    if (nextFocus.current !== null && !history.isFetchingNextPage) {
      const index = nextFocus.current;
      nextFocus.current = null;
      if (!history.isError) {
        const next =
          list.current?.querySelectorAll<HTMLAnchorElement>('a[data-analysis-link]')[index];
        (next ?? heading.current)?.focus();
      }
    }
  }, [history.data, history.isFetchingNextPage, history.isError]);
  function cancel() {
    const trigger = deleteTrigger.current;
    setSelected(null);
    requestAnimationFrame(() => {
      if (trigger?.isConnected) trigger.focus();
      else heading.current?.focus();
    });
  }
  function ask(item: AnalysisSummary) {
    deleteTrigger.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setNotice('');
    setDeleteError('');
    setSelected(item);
  }
  async function confirm() {
    if (!selected || deleting.current || browserSession.snapshot().session?.user.id !== owner)
      return;
    const id = selected.id,
      controller = new AbortController();
    request.current = controller;
    deleting.current = true;
    setDeleteError('');
    const current = () =>
      !controller.signal.aborted && browserSession.snapshot().session?.user.id === owner;
    let gone = false;
    try {
      try {
        await removal.mutateAsync({ id, signal: controller.signal });
      } catch (cause) {
        if (cause instanceof ApiError && cause.status === 404) gone = true;
        else throw cause;
      }
      if (!current()) return;
      await Promise.all([
        client.cancelQueries({ queryKey: key }),
        client.cancelQueries({ queryKey: ['analysis', owner, id], exact: true }),
      ]);
      if (!current()) return;
      client.setQueryData<HistoryData>(key, (data) => removeHistoryItem(data, id));
      client.removeQueries({ queryKey: ['analysis', owner, id], exact: true });
      setSelected(null);
      setNotice(
        gone
          ? 'Ese análisis ya no está disponible. Actualizamos tu historial.'
          : 'Análisis eliminado.',
      );
      // The deletion is already committed. A refresh failure is a separate list
      // error and must never suggest that a successful DELETE did not happen.
      void client.invalidateQueries({ queryKey: key }).catch(() => undefined);
    } catch {
      if (current())
        setDeleteError(
          'No se pudo confirmar la eliminación. El análisis sigue en la lista; puedes reintentar o cancelar.',
        );
    } finally {
      deleting.current = false;
      request.current = null;
    }
  }
  const pageError = history.isFetchNextPageError;
  return (
    <div className="page-form">
      <h1 ref={heading} tabIndex={-1}>
        Historial de análisis
      </h1>
      <p>
        <Link to="/analysis/new">Crear un nuevo análisis</Link>
      </p>
      <p>
        Los porcentajes conservan la comparación original. Abre un detalle para consultar
        tecnologías y evidencias.
      </p>
      {notice && (
        <p ref={message} role="status" tabIndex={-1}>
          {notice}
        </p>
      )}
      {history.isPending && <p role="status">Cargando historial…</p>}
      {history.isFetching && !history.isPending && !history.isFetchingNextPage && (
        <p role="status">Actualizando historial…</p>
      )}
      {history.isError && (
        <div ref={error} tabIndex={-1}>
          <Alert variant="error">
            {pageError
              ? 'No se pudo cargar la siguiente página. Los análisis ya cargados siguen disponibles.'
              : 'No se pudo cargar o actualizar el historial. Puedes reintentar.'}
          </Alert>
          {!pageError && (
            <Button
              onClick={() => void history.refetch()}
              disabled={history.isFetching || removal.isPending}
            >
              Reintentar historial
            </Button>
          )}
        </div>
      )}
      {!history.isPending && !history.isError && items.length === 0 && (
        <section aria-labelledby="empty-history-title">
          <h2 id="empty-history-title">Todavía no tienes análisis guardados</h2>
          <p>Pega tu primera vacante y compárala con tus habilidades.</p>
        </section>
      )}
      {items.length > 0 && (
        <>
          <p role="status">Mostrando {items.length} análisis cargados.</p>
          <AnalysisHistoryList items={items} onDelete={ask} listRef={list} />
        </>
      )}
      {history.hasNextPage && (
        <Button
          disabled={history.isFetching || removal.isPending || (history.isError && !pageError)}
          onClick={() => {
            nextFocus.current = items.length;
            void history.fetchNextPage();
          }}
        >
          {history.isFetchingNextPage
            ? 'Cargando más análisis…'
            : pageError
              ? 'Reintentar más análisis'
              : 'Cargar más análisis'}
        </Button>
      )}
      {history.data && !history.isError && (
        <Button
          variant="secondary"
          disabled={history.isFetching || removal.isPending}
          onClick={() => void history.refetch()}
        >
          Actualizar historial
        </Button>
      )}
      {selected && (
        <DeleteAnalysisDialog
          item={selected}
          pending={removal.isPending}
          error={deleteError}
          onCancel={cancel}
          onConfirm={() => void confirm()}
        />
      )}
    </div>
  );
}
