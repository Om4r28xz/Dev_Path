import { Link } from 'react-router';
import { Button } from '../../../components/ui/Button.js';
import type { AnalysisSummary } from '../history.js';
const dateFormat = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
export function AnalysisHistoryList({
  items,
  onDelete,
  listRef,
}: {
  items: readonly AnalysisSummary[];
  onDelete: (item: AnalysisSummary) => void;
  listRef?: React.Ref<HTMLUListElement>;
}) {
  return (
    <ul className="analysis-history" ref={listRef} aria-label="Análisis guardados">
      {items.map((item) => (
        <li key={item.id} className="analysis-history__item">
          <h2>
            <Link data-analysis-link to={'/analyses/' + encodeURIComponent(item.id)}>
              {item.source.title ?? 'Vacante sin título'}
            </Link>
          </h2>
          <p>
            <time dateTime={item.createdAt}>{dateFormat.format(new Date(item.createdAt))}</time>
          </p>
          <p>
            {item.compatibilityPercentage === null
              ? 'Sin tecnologías detectadas; no se calcula un porcentaje.'
              : `${item.compatibilityPercentage}% de compatibilidad tecnológica.`}
          </p>
          {item.skillsOutdated && (
            <p>
              Las habilidades de tu perfil cambiaron. Este análisis conserva la comparación
              original.
            </p>
          )}
          <p>
            <Link to={'/analyses/' + encodeURIComponent(item.id)}>
              Ver tecnologías y evidencias
            </Link>
          </p>
          <Button
            variant="danger"
            aria-label={'Eliminar análisis: ' + (item.source.title ?? 'Vacante sin título')}
            onClick={() => onDelete(item)}
          >
            Eliminar
          </Button>
        </li>
      ))}
    </ul>
  );
}
