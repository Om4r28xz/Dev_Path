import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { loadCatalog } from '../../src/modules/analysis/catalog.js';
import { extractSkills } from '../../src/modules/analysis/extractor.js';

const catalog = loadCatalog();
const corpus = JSON.parse(
  readFileSync(
    new URL('../../../../packages/catalog/fixtures/extraction-corpus.json', import.meta.url),
    'utf8',
  ),
) as { cases: Array<{ id: string; jobText: string; requiredSkillIds: string[] }> };

describe('extractSkills', () => {
  it.each(corpus.cases)('matches the labeled corpus: $id', ({ jobText, requiredSkillIds }) => {
    const result = extractSkills(jobText, catalog);
    expect(result.map((item) => item.skillId)).toEqual(requiredSkillIds);
    for (const item of result) {
      expect(item.matches.length).toBeGreaterThan(0);
      expect(item.matches.length).toBeLessThanOrEqual(20);
      for (const match of item.matches) {
        expect(jobText.slice(match.start, match.end)).toBe(match.text);
        expect(match.text.length).toBeLessThanOrEqual(100);
      }
    }
    expect(extractSkills(jobText, catalog)).toEqual(result);
  });

  it('does not match inside Unicode words or confuse significant signs', () => {
    expect(
      extractSkills('préJava Javañ 𐐀Java C C++ C#', catalog).map((item) => item.skillId),
    ).toEqual(['cplusplus', 'csharp']);
  });

  it('normalizes Unicode variants while preserving original evidence offsets', () => {
    const text = 'Vacante: ＪＳ, Ｃ＋＋ y Ｃ＃.';
    const result = extractSkills(text, catalog);
    expect(result.map((item) => item.skillId)).toEqual(['cplusplus', 'csharp', 'javascript']);
    for (const item of result) {
      for (const match of item.matches) {
        expect(text.slice(match.start, match.end)).toBe(match.text);
      }
    }
  });

  it('limits a suffix negation to the skill it qualifies', () => {
    expect(
      extractSkills('SQL and Git is not required.', catalog).map((item) => item.skillId),
    ).toEqual(['sql']);
  });

  it('caps evidence for a maximum-length input', () => {
    const text = 'Java '.repeat(4_000).slice(0, 20_000);
    const start = performance.now();
    const result = extractSkills(text, catalog);
    const elapsedMs = performance.now() - start;
    expect(result).toHaveLength(1);
    expect(result[0]!.matches).toHaveLength(20);
    expect(elapsedMs).toBeLessThan(5_000);
  });

  it('finds React by alias "React.js"', () => {
    const results = extractSkills('We use React.js for the frontend.', catalog);
    const react = results.find((r) => r.skillId === 'react');

    expect(react).toBeDefined();
    expect(react!.matches.length).toBeGreaterThan(0);
    expect(react!.matches[0]!.text).toBe('React.js');
  });

  it('finds Node.js by alias "NodeJS"', () => {
    const results = extractSkills('Backend is built with NodeJS.', catalog);
    const node = results.find((r) => r.skillId === 'nodejs');

    expect(node).toBeDefined();
    expect(node!.matches[0]!.text).toBe('NodeJS');
  });

  it('finds JavaScript by alias "JS" (word boundary)', () => {
    const results = extractSkills('Proficiency in JS is required.', catalog);
    const js = results.find((r) => r.skillId === 'javascript');

    expect(js).toBeDefined();
    expect(js!.matches.some((m) => m.text === 'JS')).toBe(true);
  });

  it('returns empty for unrecognized text', () => {
    const results = extractSkills('Experience with COBOL and FORTRAN.', catalog);

    expect(results).toHaveLength(0);
  });

  it('returns correct start/end offsets', () => {
    const text = 'Experience with Docker and Git.';
    const results = extractSkills(text, catalog);

    const docker = results.find((r) => r.skillId === 'docker');
    expect(docker).toBeDefined();
    const dockerMatch = docker!.matches[0]!;
    expect(dockerMatch.start).toBe(text.indexOf('Docker'));
    expect(dockerMatch.end).toBe(text.indexOf('Docker') + 'Docker'.length);
    expect(text.slice(dockerMatch.start, dockerMatch.end)).toBe('Docker');

    const git = results.find((r) => r.skillId === 'git');
    expect(git).toBeDefined();
    const gitMatch = git!.matches[0]!;
    expect(gitMatch.start).toBe(text.indexOf('Git'));
    expect(gitMatch.end).toBe(text.indexOf('Git') + 'Git'.length);
  });
});
