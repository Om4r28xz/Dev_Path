import { sampleWithEvidence } from './test-fixtures.js';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AnalysisResult } from './components/AnalysisResult.js';
import type { Analysis } from './types.js';
const sample: Analysis = {
  id: '00000000-0000-4000-8000-000000000001',
  source: { type: 'text', title: 'Junior' },
  candidateSkillsRevision: 1,
  requiredSkillIds: ['git', 'javascript', 'react'],
  matchedSkillIds: ['javascript', 'react'],
  missingSkillIds: ['git'],
  compatibilityPercentage: 67,
  versions: { catalog: '1.0.0', extractor: '1.0.0', scoring: '1.0.0' },
  warnings: [],
  skillsOutdated: false,
  createdAt: '2026-11-01T00:00:00Z',
};
const render = (analysis: Analysis) =>
  renderToStaticMarkup(
    createElement(AnalysisResult, {
      analysis,
      skillNames: { git: 'Git', javascript: 'JavaScript', react: 'React' },
    }),
  );
describe('ANL-02 result presentation under public contract1.1.0', () => {
  it('explains67% and presents required/matched/missing technologies', () => {
    const html = render(sample);
    expect(html).toContain('67%');
    expect(html).toContain('Coinciden 2 de 3');
    expect(html).toContain('Habilidades faltantes');
    expect(html).toContain('Git');
    expect(html).toContain('no es una probabilidad de contratación');
  });
  it('keeps a real0% distinct from no technologies/null', () => {
    expect(
      render({
        ...sample,
        compatibilityPercentage: 0,
        matchedSkillIds: [],
        missingSkillIds: sample.requiredSkillIds,
      }),
    ).toContain('0%');
    const empty = render({
      ...sample,
      compatibilityPercentage: null,
      requiredSkillIds: [],
      matchedSkillIds: [],
      missingSkillIds: [],
    });
    expect(empty).toContain('No se detectaron tecnologías');
    expect(empty).not.toContain('0%');
  });
  it('escapes untrusted strings and warns on changed skills without inventing evidence', () => {
    const html = render({
      ...sample,
      source: { type: 'text', title: '<script>alert(1)</script>' },
      skillsOutdated: true,
    });
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).toContain('conserva la comparación original');
    expect(html).toContain('No hay fragmentos disponibles para este análisis.');
  });

  it('groups saved literal evidence with technologies without showing source text', () => {
    const html = render(sampleWithEvidence);
    expect(html).toContain('<q>JavaScript</q>');
    expect(html).toContain('<q>Git</q>');
    expect(html).toContain('analysis-evidence-title');
    expect(html).not.toContain('No hay fragmentos disponibles');
  });
  it('renders malicious fragments as inert text with no executable tags', () => {
    const text = '<img src=x onerror=alert(1)><script>alert(1)</script>';
    const html = render({
      ...sampleWithEvidence,
      evidence: [{ skillId: 'git', matches: [{ text, start: 0, end: text.length }] }],
    });
    expect(html).toContain('&lt;img');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<script>');
  });
  it('explains an empty evidence array together with null, without implying0%', () => {
    const html = render({
      ...sample,
      requiredSkillIds: [],
      matchedSkillIds: [],
      missingSkillIds: [],
      compatibilityPercentage: null,
      evidence: [],
    });
    expect(html).toContain('No hay menciones que mostrar');
    expect(html).not.toContain('0%');
  });
});
