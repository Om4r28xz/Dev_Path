import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from '../../components/feedback/Alert.js';
import { Button } from '../../components/ui/Button.js';
import { ApiError } from '../../lib/http/client.js';
import { deleteCv, downloadCv, loadCv, uploadCv } from './api.js';
import './cv.css';

const MAX_BYTES = 5 * 1024 * 1024;

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 413) return 'El PDF supera el límite de 5 MiB.';
    if (error.status === 415) return 'El archivo debe ser un PDF válido.';
    return error.message;
  }
  return 'No se pudo completar la operación. Puedes reintentar.';
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

export function CvPanel({ userId }: { userId: string }) {
  const key = ['cv', userId];
  const client = useQueryClient();
  const cv = useQuery({ queryKey: key, queryFn: ({ signal }) => loadCv(signal), retry: false });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cleanupNotice, setCleanupNotice] = useState('');
  const errorRef = useRef<HTMLDivElement>(null);
  const uploading = useRef(false);
  const deleting = useRef(false);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const upload = useMutation({
    mutationFn: uploadCv,
    onSuccess: async (result) => {
      client.setQueryData(key, result.metadata ?? null);
      setFile(null);
      setNotice(cv.data ? 'CV sustituido correctamente.' : 'CV guardado correctamente.');
      setCleanupNotice(
        result.cleanupPending
          ? 'Tu nuevo CV está disponible. La copia anterior sigue en limpieza interna.'
          : '',
      );
      await client.invalidateQueries({ queryKey: key });
    },
    onError: (cause) => setError(errorMessage(cause)),
    onSettled: () => {
      uploading.current = false;
    },
  });
  const download = useMutation({
    mutationFn: downloadCv,
    onSuccess: () => setNotice('Descarga iniciada.'),
    onError: (cause) => setError(errorMessage(cause)),
  });
  const remove = useMutation({
    mutationFn: deleteCv,
    onSuccess: async (result) => {
      client.setQueryData(key, null);
      setNotice('CV eliminado.');
      setCleanupNotice(
        result.cleanupPending ? 'El CV ya no está disponible; la limpieza interna continúa.' : '',
      );
      await client.invalidateQueries({ queryKey: key });
    },
    onError: (cause) => setError(errorMessage(cause)),
    onSettled: () => {
      deleting.current = false;
    },
  });

  function select(selected: File | undefined) {
    setNotice('');
    setCleanupNotice('');
    if (!selected) {
      setFile(null);
      return;
    }
    if (!/\.pdf$/iu.test(selected.name) || selected.type !== 'application/pdf') {
      setFile(null);
      setError('Selecciona un archivo PDF.');
      return;
    }
    if (selected.size > MAX_BYTES) {
      setFile(null);
      setError('El PDF supera el límite de 5 MiB.');
      return;
    }
    setError('');
    setFile(selected);
  }

  return (
    <section className="profile-card surface cv-panel" aria-labelledby="cv-title">
      <div className="cv-panel__header">
        <div>
          <h2 id="cv-title">CV privado</h2>
          <p>Guarda un PDF de hasta 5 MiB para descargarlo desde tu cuenta.</p>
        </div>
        <span className="badge badge--neutral">Privado</span>
      </div>
      <Alert variant="info">
        DevPath no analiza ni extrae habilidades de este archivo automáticamente.
      </Alert>
      {notice && <Alert variant="success">{notice}</Alert>}
      {cleanupNotice && <Alert variant="warning">{cleanupNotice}</Alert>}
      {error && (
        <div ref={errorRef} tabIndex={-1}>
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      {cv.isPending && <p role="status">Cargando información del CV…</p>}
      {cv.isError && (
        <div className="cv-panel__actions">
          <Alert variant="error">{errorMessage(cv.error)}</Alert>
          <Button variant="secondary" onClick={() => void cv.refetch()}>
            Reintentar CV
          </Button>
        </div>
      )}
      {cv.isSuccess && cv.data && (
        <dl className="cv-metadata">
          <div>
            <dt>Archivo</dt>
            <dd>{cv.data.originalName}</dd>
          </div>
          <div>
            <dt>Tamaño</dt>
            <dd>{formatBytes(cv.data.sizeBytes)}</dd>
          </div>
          <div>
            <dt>Guardado</dt>
            <dd>{new Date(cv.data.createdAt).toLocaleDateString()}</dd>
          </div>
        </dl>
      )}
      {cv.isSuccess && !cv.data && (
        <p className="cv-panel__empty">Todavía no has guardado un CV.</p>
      )}
      <form
        className="cv-upload"
        onSubmit={(event) => {
          event.preventDefault();
          if (!file || uploading.current) return;
          uploading.current = true;
          setError('');
          setNotice('');
          upload.mutate(file);
        }}
      >
        <label className="field" htmlFor="cv-file">
          <span className="field__label">Seleccionar PDF</span>
          <input
            id="cv-file"
            className="field__input"
            type="file"
            accept="application/pdf,.pdf"
            disabled={upload.isPending}
            onChange={(event) => select(event.target.files?.[0])}
          />
          <span className="field__hint">PDF privado, máximo 5 MiB.</span>
        </label>
        {file && (
          <p>
            Listo para subir: <strong>{file.name}</strong>
          </p>
        )}
        <div className="cv-panel__actions">
          <Button type="submit" isLoading={upload.isPending} disabled={!file}>
            {cv.data ? 'Sustituir CV' : 'Subir CV'}
          </Button>
          {cv.data && (
            <>
              <Button
                variant="secondary"
                disabled={download.isPending}
                onClick={() => {
                  setError('');
                  setNotice('');
                  download.mutate();
                }}
              >
                Descargar CV
              </Button>
              <Button
                variant="danger"
                disabled={remove.isPending}
                onClick={() => {
                  if (deleting.current || !window.confirm('¿Eliminar tu CV privado?')) return;
                  deleting.current = true;
                  setError('');
                  setNotice('');
                  remove.mutate();
                }}
              >
                Eliminar CV
              </Button>
            </>
          )}
        </div>
      </form>
    </section>
  );
}
