import { describe, expect, it } from 'vitest';

import { loadCatalog } from '../../src/modules/analysis/catalog.js';
import { extractSkills } from '../../src/modules/analysis/extractor.js';

const catalog = loadCatalog();

describe('extractSkills', () => {
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
