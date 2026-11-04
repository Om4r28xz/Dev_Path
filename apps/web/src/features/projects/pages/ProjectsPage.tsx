import { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from '../../../components/feedback/Alert.js';
import { StatePanel } from '../../../components/feedback/StatePanel.js';
import { Button } from '../../../components/ui/Button.js';
import { ApiError } from '../../../lib/http/client.js';
import { browserSession } from '../../../lib/session/session.js';
import { useSession } from '../../auth/SessionProvider.js';
import { searchSkills } from '../../skills/api.js';
import { createProject, deleteProject, loadProjects, updateProject } from '../api.js';
import { DeleteProjectDialog } from '../components/DeleteProjectDialog.js';
import { ProjectCard } from '../components/ProjectCard.js';
import {
  emptyProjectDraft,
  projectDraft,
  validateProjectDraft,
  type Project,
  type ProjectDraft,
} from '../types.js';
import './projects.css';

function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'No se pudo conectar. El formulario conserva tus cambios para que puedas reintentar.';
}

export function ProjectsPage() {
  const { session } = useSession();
  return session ? <ProjectsEditor key={session.user.id} userId={session.user.id} /> : null;
}

function ProjectsEditor({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const projectsKey = ['projects', userId];
  const [draft, setDraft] = useState<ProjectDraft>(emptyProjectDraft);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [notice, setNotice] = useState('');
  const errorRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const saving = useRef(false);

  const projects = useInfiniteQuery({
    queryKey: projectsKey,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => loadProjects(pageParam, signal),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    retry: false,
  });
  const catalog = useInfiniteQuery({
    queryKey: ['catalog', userId, 'projects'],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => searchSkills('', pageParam, signal),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    retry: false,
  });
  const entries = catalog.data?.pages.flatMap((page) => page.items) ?? [];
  const skillNames = useMemo(
    () => new Map(entries.map((skill) => [skill.id, skill.name])),
    [entries],
  );
  const items = projects.data?.pages.flatMap((page) => page.items) ?? [];

  useEffect(() => {
    if (requestError) errorRef.current?.focus();
  }, [requestError]);

  async function refresh() {
    if (browserSession.snapshot().session?.user.id !== userId) return;
    await queryClient.invalidateQueries({ queryKey: projectsKey });
  }

  const save = useMutation({
    mutationFn: ({ id, value }: { id: string | null; value: ProjectDraft }) =>
      id ? updateProject(id, value) : createProject(value),
    onSuccess: async (_saved, variables) => {
      setDraft(emptyProjectDraft());
      setEditing(null);
      setErrors({});
      setRequestError('');
      setNotice(variables.id ? 'Proyecto actualizado.' : 'Proyecto añadido.');
      await refresh();
    },
    onError: (error) => setRequestError(errorMessage(error)),
    onSettled: () => {
      saving.current = false;
    },
  });
  const remove = useMutation({
    mutationFn: deleteProject,
    onSuccess: async () => {
      setDeleting(null);
      setDeleteError('');
      setNotice('Proyecto eliminado.');
      await refresh();
    },
    onError: (error) => setDeleteError(errorMessage(error)),
  });

  function beginEdit(project: Project) {
    setEditing(project);
    setDraft(projectDraft(project));
    setErrors({});
    setRequestError('');
    setNotice('');
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>('input')?.focus());
  }

  return (
    <div className="projects-page">
      <header className="projects-header">
        <p className="page-eyebrow">Perfil</p>
        <h1>Mis proyectos</h1>
        <p>
          Presenta trabajos personales, académicos o colaborativos y las tecnologías que utilizaste.
          Esta información es autodeclarada; DevPath no verifica repositorios ni enlaces externos.
        </p>
      </header>

      {notice && <Alert variant="success">{notice}</Alert>}

      <section className="project-form-panel surface" aria-labelledby="project-form-title">
        <div className="project-form-panel__header">
          <div>
            <h2 id="project-form-title">{editing ? 'Editar proyecto' : 'Añadir proyecto'}</h2>
            <p>
              Describe tu aportación con claridad. El enlace es opcional y nunca se consulta desde
              el servidor.
            </p>
          </div>
          {editing && (
            <Button
              variant="secondary"
              disabled={save.isPending}
              onClick={() => {
                setEditing(null);
                setDraft(emptyProjectDraft());
                setErrors({});
                setRequestError('');
              }}
            >
              Cancelar edición
            </Button>
          )}
        </div>
        {requestError && (
          <div ref={errorRef} tabIndex={-1}>
            <Alert variant="error">{requestError}</Alert>
          </div>
        )}
        <form
          ref={formRef}
          className="project-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (saving.current) return;
            const validation = validateProjectDraft(draft);
            setErrors(validation);
            setNotice('');
            setRequestError('');
            if (Object.keys(validation).length > 0) return;
            saving.current = true;
            save.mutate({ id: editing?.id ?? null, value: draft });
          }}
        >
          <label className="field" htmlFor="project-title">
            <span className="field__label">Título</span>
            <input
              id="project-title"
              className="field__input"
              required
              maxLength={120}
              value={draft.title}
              disabled={save.isPending}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'project-title-error' : undefined}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
            {errors.title && (
              <span id="project-title-error" className="field__error">
                {errors.title}
              </span>
            )}
          </label>
          <div className="field">
            <label className="field__label" htmlFor="project-description">
              Descripción y aportación
            </label>
            <textarea
              id="project-description"
              className="field__input project-form__description"
              required
              maxLength={5000}
              value={draft.description}
              disabled={save.isPending}
              aria-invalid={!!errors.description}
              aria-describedby={`project-description-hint${errors.description ? ' project-description-error' : ''}`}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
            <span id="project-description-hint" className="field__hint">
              Explica qué construiste o qué responsabilidad tuviste.
            </span>
            {errors.description && (
              <span id="project-description-error" className="field__error">
                {errors.description}
              </span>
            )}
          </div>
          <div className="field">
            <label className="field__label" htmlFor="project-url">
              Enlace externo (opcional)
            </label>
            <input
              id="project-url"
              className="field__input"
              type="url"
              maxLength={2048}
              placeholder="https://example.org/proyecto"
              value={draft.url}
              disabled={save.isPending}
              aria-invalid={!!errors.url}
              aria-describedby={`project-url-hint${errors.url ? ' project-url-error' : ''}`}
              onChange={(event) => setDraft({ ...draft, url: event.target.value })}
            />
            <span id="project-url-hint" className="field__hint">
              Al abrirlo, saldrás de DevPath en una pestaña nueva.
            </span>
            {errors.url && (
              <span id="project-url-error" className="field__error">
                {errors.url}
              </span>
            )}
          </div>

          <fieldset className="project-technologies" disabled={save.isPending || catalog.isError}>
            <legend>Tecnologías utilizadas</legend>
            <p className="field__hint">
              Selecciona únicamente tecnologías que utilizaste en este proyecto.
            </p>
            {catalog.isPending && <p role="status">Cargando catálogo…</p>}
            {catalog.isError && (
              <div className="projects-retry">
                <Alert variant="error">
                  No se pudo cargar el catálogo. Reintenta antes de guardar.
                </Alert>
                <Button variant="secondary" onClick={() => void catalog.refetch()}>
                  Reintentar catálogo
                </Button>
              </div>
            )}
            <ul className="project-technologies__grid">
              {entries.map((skill) => (
                <li key={skill.id}>
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={draft.skillIds.includes(skill.id)}
                      disabled={
                        save.isPending ||
                        (!draft.skillIds.includes(skill.id) && draft.skillIds.length >= 100)
                      }
                      onChange={() =>
                        setDraft({
                          ...draft,
                          skillIds: draft.skillIds.includes(skill.id)
                            ? draft.skillIds.filter((id) => id !== skill.id)
                            : [...draft.skillIds, skill.id],
                        })
                      }
                    />
                    <span>{skill.name}</span>
                  </label>
                </li>
              ))}
            </ul>
            {catalog.hasNextPage && (
              <Button
                variant="secondary"
                disabled={catalog.isFetchingNextPage}
                onClick={() => void catalog.fetchNextPage()}
              >
                {catalog.isFetchingNextPage ? 'Cargando más…' : 'Más tecnologías'}
              </Button>
            )}
            {errors.skillIds && <p className="field__error">{errors.skillIds}</p>}
          </fieldset>
          <div className="form-actions">
            <Button type="submit" isLoading={save.isPending} disabled={catalog.isError}>
              {editing ? 'Guardar cambios' : 'Añadir proyecto'}
            </Button>
          </div>
        </form>
      </section>

      <section className="projects-list-section" aria-labelledby="projects-list-title">
        <div className="projects-list-section__header">
          <div>
            <h2 id="projects-list-title">Portafolio declarado</h2>
            <p>
              {items.length} {items.length === 1 ? 'proyecto visible' : 'proyectos visibles'}
            </p>
          </div>
        </div>
        {projects.isPending && (
          <StatePanel kind="loading" title="Cargando proyectos">
            <p>Consultando tu portafolio privado.</p>
          </StatePanel>
        )}
        {projects.isError && (
          <StatePanel
            kind="error"
            title="No se pudieron cargar los proyectos"
            action={
              <Button variant="secondary" onClick={() => void projects.refetch()}>
                Reintentar proyectos
              </Button>
            }
          >
            <p>{errorMessage(projects.error)}</p>
          </StatePanel>
        )}
        {projects.isSuccess && items.length === 0 && (
          <StatePanel kind="empty" title="Aún no has añadido proyectos">
            <p>Usa el formulario para presentar un trabajo y las tecnologías que utilizaste.</p>
          </StatePanel>
        )}
        {items.length > 0 && (
          <ul className="projects-list">
            {items.map((project) => (
              <li key={project.id}>
                <ProjectCard
                  project={project}
                  skillNames={skillNames}
                  onEdit={() => beginEdit(project)}
                  onDelete={() => {
                    setDeleting(project);
                    setDeleteError('');
                  }}
                />
              </li>
            ))}
          </ul>
        )}
        {projects.hasNextPage && (
          <div className="projects-more">
            <Button
              variant="secondary"
              disabled={projects.isFetchingNextPage}
              onClick={() => void projects.fetchNextPage()}
            >
              {projects.isFetchingNextPage ? 'Cargando más…' : 'Cargar más proyectos'}
            </Button>
          </div>
        )}
      </section>
      {deleting && (
        <DeleteProjectDialog
          project={deleting}
          pending={remove.isPending}
          error={deleteError}
          onCancel={() => {
            setDeleting(null);
            setDeleteError('');
          }}
          onConfirm={() => {
            if (!remove.isPending) remove.mutate(deleting.id);
          }}
        />
      )}
    </div>
  );
}
