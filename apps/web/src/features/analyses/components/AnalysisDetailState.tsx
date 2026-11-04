import { Link } from 'react-router';
import { Alert } from '../../../components/feedback/Alert.js';
import { Button } from '../../../components/ui/Button.js';
type Props =
  | { kind: 'loading' }
  | { kind: 'not-found' }
  | { kind: 'error'; retry: () => void; retrying: boolean };
export function AnalysisDetailState(props: Props) {
  if (props.kind === 'loading')
    return (
      <section className="state-panel analysis-detail-state" aria-labelledby="detail-loading-title">
        <p className="analysis-page__eyebrow">Resultado guardado</p>
        <h1 id="detail-loading-title">Detalle del análisis</h1>
        <p role="status">Cargando análisis y evidencias…</p>
      </section>
    );
  if (props.kind === 'not-found')
    return (
      <section className="state-panel analysis-detail-state" aria-labelledby="detail-missing-title">
        <h1 id="detail-missing-title">Análisis no encontrado</h1>
        <Alert variant="warning">
          No encontramos ese análisis en tu cuenta. Puede haberse eliminado o no estar disponible.
        </Alert>
        <p>
          <Link to="/analysis/new">Crear un nuevo análisis</Link> o{' '}
          <Link to="/profile">volver a mi perfil</Link>.{' '}
          <Link to="/analyses">Volver al historial</Link>.
        </p>
      </section>
    );
  return (
    <section className="state-panel analysis-detail-state" aria-labelledby="detail-error-title">
      <h1 id="detail-error-title">Detalle del análisis</h1>
      <Alert variant="error">
        No se pudo cargar el análisis. Puedes reintentar sin crear otro resultado.
      </Alert>
      <Button onClick={props.retry} isLoading={props.retrying}>
        Reintentar
      </Button>
      <p>
        <Link to="/profile">Volver a mi perfil</Link> o{' '}
        <Link to="/analyses">Volver al historial</Link>
      </p>
    </section>
  );
}
