import { Button } from '../../../components/ui/Button.js';
import type { Project } from '../types.js';

export function ProjectCard({
  project,
  skillNames,
  onEdit,
  onDelete,
}: {
  project: Project;
  skillNames: ReadonlyMap<string, string>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="project-card surface" aria-labelledby={'project-' + project.id}>
      <div className="project-card__header">
        <div>
          <h2 id={'project-' + project.id}>{project.title}</h2>
          <p className="project-card__label">Información autodeclarada</p>
        </div>
        {project.url && (
          <a href={project.url} target="_blank" rel="noreferrer" className="project-card__link">
            Visitar proyecto <span className="visually-hidden">(abre en una pestaña nueva)</span>
          </a>
        )}
      </div>
      <p className="project-card__description">{project.description}</p>
      {project.skillIds.length > 0 ? (
        <ul className="project-skills" aria-label={'Tecnologías de ' + project.title}>
          {project.skillIds.map((id) => (
            <li key={id}>{skillNames.get(id) ?? id}</li>
          ))}
        </ul>
      ) : (
        <p className="project-card__meta">Sin tecnologías asociadas.</p>
      )}
      <div className="project-card__actions">
        <Button variant="secondary" onClick={onEdit}>
          Editar
        </Button>
        <Button variant="danger" onClick={onDelete}>
          Eliminar
        </Button>
      </div>
    </article>
  );
}
