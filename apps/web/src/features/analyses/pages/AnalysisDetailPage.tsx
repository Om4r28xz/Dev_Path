import React from 'react';
import { useParams } from 'react-router';
import { Alert } from '../../../components/feedback/Alert.js';

export const AnalysisDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="page-form">
      <h1>Detalle del análisis</h1>
      <p className="eyebrow">ID: {id}</p>
      <Alert variant="info">
        El detalle del análisis estará disponible una vez que la API de análisis esté conectada.
      </Alert>
    </div>
  );
};
