import React, { useState } from 'react';
import { TextField } from '../../../components/forms/TextField.js';
import { Button } from '../../../components/ui/Button.js';
import { Alert } from '../../../components/feedback/Alert.js';

export const NewAnalysisPage: React.FC = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [jobText, setJobText] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // Not yet connected to API — M1 visual preview only
  };

  return (
    <div className="page-form">
      <h1>Nuevo análisis</h1>
      <Alert variant="info">
        La autenticación aún no está implementada. Esta pantalla es un avance visual de M1.
      </Alert>
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          id="job_title"
          label="Título del puesto"
          type="text"
          autoComplete="off"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
        />
        <div className="field">
          <label className="field__label" htmlFor="job_text">
            Texto de la vacante
            <span aria-hidden="true" className="field__required">
              {' '}
              *
            </span>
          </label>
          <textarea
            id="job_text"
            className="field__input"
            required
            maxLength={20000}
            rows={10}
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
          />
          <span className="field__hint">{jobText.length} / 20 000 caracteres</span>
        </div>
        <Button type="submit" variant="primary">
          Analizar
        </Button>
      </form>
    </div>
  );
};
