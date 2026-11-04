import { useEffect, useRef } from 'react';
import { Alert } from '../../../components/feedback/Alert.js';
import { Button } from '../../../components/ui/Button.js';
import type { AnalysisSummary } from '../history.js';
export function DeleteAnalysisDialog({
  item,
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  item: AnalysisSummary;
  pending: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  function cancel() {
    dialog.current?.close();
    onCancel();
  }
  return (
    <dialog
      className="dialog-surface analysis-delete-dialog"
      ref={dialog}
      aria-labelledby="delete-analysis-title"
      aria-describedby="delete-analysis-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) cancel();
      }}
    >
      <h2 id="delete-analysis-title">¿Eliminar este análisis?</h2>
      <p id="delete-analysis-description">
        Se eliminará «{item.source.title ?? 'Vacante sin título'}» de tu historial. Esta acción no
        se puede deshacer y no cambia tus habilidades.
      </p>
      {error && (
        <div ref={errorRef} tabIndex={-1}>
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      {pending && <p role="status">Eliminando análisis…</p>}
      <div className="analysis-history__actions">
        <Button autoFocus variant="secondary" onClick={cancel} disabled={pending}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={pending}>
          Confirmar eliminación
        </Button>
      </div>
    </dialog>
  );
}
