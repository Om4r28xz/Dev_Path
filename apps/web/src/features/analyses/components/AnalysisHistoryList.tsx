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
          <div className="analysis-history__main">
            <div className="analysis-history__heading">
              <div>
                <h3>
                  <Link data-analysis-link to={'/analyses/' + encodeURIComponent(item.id)}>
                    {item.source.title ?? 'Vacante sin título'}
                  </Link>
                </h3>
                <p className="analysis-history__date">
                  <time dateTime={item.createdAt}>
                    {dateFormat.format(new Date(item.createdAt))}
                  </time>
                </p>
              </div>
              <div
                className={`analysis-history__score${
                  item.compatibilityPercentage === null ? ' analysis-history__score--empty' : ''
                }`}
                aria-label={
                  item.compatibilityPercentage === null
                    ? 'Sin tecnologías detectadas; no se calcula un porcentaje.'
                    : `${item.compatibilityPercentage}% de compatibilidad tecnológica.`
                }
              >
                <strong>
                  {item.compatibilityPercentage === null ? '—' : `${item.compatibilityPercentage}%`}
                </strong>
                <span>
                  {item.compatibilityPercentage === null
                    ? 'Sin porcentaje'
                    : 'Compatibilidad tecnológica'}
                </span>
              </div>
            </div>
            {item.compatibilityPercentage === null && (
              <p>Sin tecnologías detectadas; no se calcula un porcentaje.</p>
            )}
            {item.skillsOutdated && (
              <p className="analysis-history__notice">
                Las habilidades de tu perfil cambiaron. Este análisis conserva la comparación
                original.
              </p>
            )}
          </div>
          <div className="analysis-history__actions">
            <Link
              className="analysis-secondary-link"
              to={'/analyses/' + encodeURIComponent(item.id)}
            >
              Ver tecnologías y evidencias
            </Link>
            <Button
              variant="danger"
              aria-label={'Eliminar análisis: ' + (item.source.title ?? 'Vacante sin título')}
              onClick={() => onDelete(item)}
            >
              Eliminar
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
