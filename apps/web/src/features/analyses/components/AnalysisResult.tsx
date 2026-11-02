import React from 'react';
import { Alert } from '../../../components/feedback/Alert.js';
import type { Analysis } from '../types.js';
export const AnalysisResult: React.FC<{
  analysis: Analysis;
  skillNames?: Readonly<Record<string, string>>;
}> = ({ analysis, skillNames = {} }) => {
  const list = (ids: readonly string[]) =>
    ids.length ? (
      <ul>
        {ids.map((id) => (
          <li key={id}>{skillNames[id] ?? id}</li>
        ))}
      </ul>
    ) : (
      <p>Ninguna.</p>
    );
  return (
    <section aria-labelledby="analysis-result-title">
      <h2 id="analysis-result-title">Resultado del análisis</h2>
      {analysis.source.title && <h3>{analysis.source.title}</h3>}
      {analysis.compatibilityPercentage === null ? (
        <Alert variant="info">
          No se detectaron tecnologías del catálogo. No se calcula un porcentaje.
        </Alert>
      ) : (
        <>
          <p>
            <strong>{analysis.compatibilityPercentage}%</strong> de compatibilidad tecnológica.
          </p>
          <p>
            Coinciden {analysis.matchedSkillIds.length} de {analysis.requiredSkillIds.length}{' '}
            tecnologías detectadas. El porcentaje es la cobertura de tecnologías conocidas; no es
            una probabilidad de contratación.
          </p>
        </>
      )}
      {analysis.skillsOutdated && (
        <Alert variant="warning">
          Tus habilidades cambiaron desde este análisis. El resultado conserva la comparación
          original.
        </Alert>
      )}
      <section aria-labelledby="analysis-evidence-title">
        <h3 id="analysis-evidence-title">Evidencias</h3>
        {analysis.evidence === undefined ? (
          <p>No hay fragmentos disponibles para este análisis.</p>
        ) : analysis.evidence.length === 0 ? (
          <p>No hay menciones que mostrar: no se detectaron tecnologías.</p>
        ) : (
          <>
            <p>Menciones del texto original que justifican la detección de tecnologías.</p>
            <ul>
              {analysis.evidence.map((group) => (
                <li key={group.skillId}>
                  <h4>{skillNames[group.skillId] ?? group.skillId}</h4>
                  <ul>
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
      <h3>Tecnologías detectadas</h3>
      {list(analysis.requiredSkillIds)}
      <h3>Habilidades coincidentes</h3>
      {list(analysis.matchedSkillIds)}
      <h3>Habilidades faltantes</h3>
      {list(analysis.missingSkillIds)}
    </section>
  );
};
