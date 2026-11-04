import React from 'react';
import { Alert } from '../../../components/feedback/Alert.js';
import type { Analysis } from '../types.js';
export const AnalysisResult: React.FC<{
  analysis: Analysis;
  skillNames?: Readonly<Record<string, string>>;
}> = ({ analysis, skillNames = {} }) => {
  const list = (ids: readonly string[], variant: 'matched' | 'missing' | 'neutral') =>
    ids.length ? (
      <ul className={`analysis-skill-list analysis-skill-list--${variant}`}>
        {ids.map((id) => (
          <li key={id}>{skillNames[id] ?? id}</li>
        ))}
      </ul>
    ) : (
      <p>Ninguna.</p>
    );
  return (
    <section className="analysis-result" aria-labelledby="analysis-result-title">
      <header className="analysis-result__header">
        <div>
          <p className="analysis-page__eyebrow">Resultado guardado</p>
          <h2 id="analysis-result-title">Resultado del análisis</h2>
          {analysis.source.title && (
            <p className="analysis-result__title">{analysis.source.title}</p>
          )}
        </div>
        {analysis.compatibilityPercentage === null ? (
          <div
            className="analysis-score analysis-score--empty"
            aria-label="Porcentaje no calculable"
          >
            <span className="analysis-score__value">—</span>
            <span className="analysis-score__label">Sin porcentaje</span>
          </div>
        ) : (
          <div
            className="analysis-score"
            aria-label={`${analysis.compatibilityPercentage}% de compatibilidad tecnológica`}
          >
            <strong className="analysis-score__value">{analysis.compatibilityPercentage}%</strong>
            <span className="analysis-score__label">Compatibilidad tecnológica</span>
          </div>
        )}
      </header>
      <div className="analysis-result__summary surface-soft">
        {analysis.compatibilityPercentage === null ? (
          <Alert variant="info">
            No se detectaron tecnologías del catálogo. No se calcula un porcentaje.
          </Alert>
        ) : (
          <p>
            Coinciden {analysis.matchedSkillIds.length} de {analysis.requiredSkillIds.length}{' '}
            tecnologías detectadas. El porcentaje es la cobertura de tecnologías conocidas; no es
            una probabilidad de contratación.
          </p>
        )}
      </div>
      {analysis.skillsOutdated && (
        <Alert variant="warning">
          Tus habilidades cambiaron desde este análisis. El resultado conserva la comparación
          original.
        </Alert>
      )}
      <div className="analysis-breakdown">
        <section className="analysis-breakdown__card" aria-labelledby="analysis-matched-title">
          <h3 id="analysis-matched-title">Habilidades coincidentes</h3>
          <p className="analysis-breakdown__hint">Ya forman parte de tu perfil.</p>
          {list(analysis.matchedSkillIds, 'matched')}
        </section>
        <section className="analysis-breakdown__card" aria-labelledby="analysis-missing-title">
          <h3 id="analysis-missing-title">Habilidades faltantes</h3>
          <p className="analysis-breakdown__hint">Aparecen en la vacante, pero no en tu perfil.</p>
          {list(analysis.missingSkillIds, 'missing')}
        </section>
        <section className="analysis-breakdown__card" aria-labelledby="analysis-detected-title">
          <h3 id="analysis-detected-title">Tecnologías detectadas</h3>
          <p className="analysis-breakdown__hint">Base utilizada para calcular la comparación.</p>
          {list(analysis.requiredSkillIds, 'neutral')}
        </section>
      </div>
      <section className="analysis-evidence surface" aria-labelledby="analysis-evidence-title">
        <div className="analysis-evidence__header">
          <h3 id="analysis-evidence-title">Evidencias del texto</h3>
          <span className="badge badge--neutral">Menciones literales</span>
        </div>
        {analysis.evidence === undefined ? (
          <p>No hay fragmentos disponibles para este análisis.</p>
        ) : analysis.evidence.length === 0 ? (
          <p>No hay menciones que mostrar: no se detectaron tecnologías.</p>
        ) : (
          <>
            <p>Menciones del texto original que justifican la detección de tecnologías.</p>
            <ul className="analysis-evidence__groups">
              {analysis.evidence.map((group) => (
                <li key={group.skillId}>
                  <h4>{skillNames[group.skillId] ?? group.skillId}</h4>
                  <ul className="analysis-evidence__quotes">
                    {group.matches.map((match) => (
                      <li key={match.start + ':' + match.end}>
                        <q>{match.text}</q>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </section>
  );
};
