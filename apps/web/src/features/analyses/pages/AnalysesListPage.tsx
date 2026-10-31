import React from 'react';
import { Alert } from '../../../components/feedback/Alert.js';

export const AnalysesListPage: React.FC = () => {
  return (
    <div className="page-form">
      <h1>Historial de análisis</h1>
      <Alert variant="info">
        El historial de análisis estará disponible una vez que la API de análisis esté conectada.
      </Alert>
    </div>
  );
};
