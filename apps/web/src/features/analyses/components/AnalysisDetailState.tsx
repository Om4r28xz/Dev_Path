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
      <>
        <h1>Detalle del análisis</h1>
        <p role="status">Cargando análisis…</p>
      </>
    );
  if (props.kind === 'not-found')
    return (
      <>
        <h1>Análisis no encontrado</h1>
        <Alert variant="warning">
          No encontramos ese análisis en tu cuenta. Puede haberse eliminado o no estar disponible.
        </Alert>
        <p>
          <Link to="/analysis/new">Crear un nuevo análisis</Link> o{' '}
          <Link to="/profile">volver a mi perfil</Link>.
        </p>
      </>
    );
  return (
    <>
      <h1>Detalle del análisis</h1>
      <Alert variant="error">
        No se pudo cargar el análisis. Puedes reintentar sin crear otro resultado.
      </Alert>
      <Button onClick={props.retry} isLoading={props.retrying}>
        Reintentar
      </Button>
      <p>
        <Link to="/profile">Volver a mi perfil</Link>
      </p>
    </>
  );
}
