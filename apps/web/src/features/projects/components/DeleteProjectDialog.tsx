import { useEffect, useRef } from 'react';
import { Alert } from '../../../components/feedback/Alert.js';
import { Button } from '../../../components/ui/Button.js';
import type { Project } from '../types.js';

export function DeleteProjectDialog({
  project,
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  project: Project;
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
      className="dialog-surface project-delete-dialog"
      ref={dialog}
      aria-labelledby="delete-project-title"
      aria-describedby="delete-project-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) cancel();
      }}
    >
      <h2 id="delete-project-title">¿Eliminar este proyecto?</h2>
      <p id="delete-project-description">
        Se eliminará «{project.title}» de tu perfil. Esta acción no cambia tus habilidades ni los
        análisis guardados.
      </p>
      {error && (
        <div ref={errorRef} tabIndex={-1}>
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      {pending && <p role="status">Eliminando proyecto…</p>}
      <div className="project-card__actions">
        <Button autoFocus variant="secondary" onClick={cancel} disabled={pending}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} isLoading={pending}>
          Confirmar eliminación
        </Button>
      </div>
    </dialog>
  );
}
