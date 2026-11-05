import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  generateLearningPathPlan,
  GENERATOR_VERSION,
  PrerequisiteCycleError,
  type LearningTemplatesDocument,
} from '../../src/modules/learning-paths/generator.js';

const casesDoc = JSON.parse(
  readFileSync(
    new URL('../../../../packages/catalog/fixtures/learning-path-cases.json', import.meta.url),
    'utf8',
  ),
) as {
  cases: Array<{
    id: string;
    input: {
      matchedSkillIds: string[];
      missingSkillIds: string[];
      projects: Array<{ id: string; title: string; skillIds: string[] }>;
    };
    expected: {
      orderedSkillIds: string[];
      projectIdsBySkill: Record<string, string | null>;
      progress: { completed: number; total: number; percentage: number | null };
      hasMessage: boolean;
    };
  }>;
};

const defaultTemplatesDoc = JSON.parse(
  readFileSync(
    new URL('../../../../packages/catalog/learning-templates.json', import.meta.url),
    'utf8',
  ),
) as LearningTemplatesDocument;

describe('LRN-02 deterministic learning path generator', () => {
  it('matches all expected reference cases from packages/catalog/fixtures/learning-path-cases.json', () => {
    for (const testCase of casesDoc.cases) {
      const plan = generateLearningPathPlan({
        catalogVersion: '1.0.0',
        matchedSkillIds: testCase.input.matchedSkillIds,
        missingSkillIds: testCase.input.missingSkillIds,
        projects: testCase.input.projects,
      });

      expect(plan.steps.map((s) => s.skillIds[0])).toEqual(testCase.expected.orderedSkillIds);
      const actualProjects: Record<string, string | null> = {};
      for (const step of plan.steps) {
        actualProjects[step.skillIds[0]!] = step.projectId;
      }
      expect(actualProjects).toEqual(testCase.expected.projectIdsBySkill);
      expect(plan.progress).toEqual(testCase.expected.progress);
      expect(Boolean(plan.message)).toBe(testCase.expected.hasMessage);
      expect(plan.versions).toEqual({
        catalog: '1.0.0',
        content: '1.0.0',
        generator: GENERATOR_VERSION,
      });
    }
  });

  it('produces identical structure and reasons regardless of input array order', () => {
    const planA = generateLearningPathPlan({
      catalogVersion: '1.0.0',
      matchedSkillIds: ['git'],
      missingSkillIds: ['react-native', 'nodejs'],
      projects: [],
    });
    const planB = generateLearningPathPlan({
      catalogVersion: '1.0.0',
      matchedSkillIds: ['git'],
      missingSkillIds: ['nodejs', 'react-native'],
      projects: [],
    });

    expect(planA).toEqual(planB);
    expect(planA.steps.map((s) => s.skillIds[0])).toEqual([
      'javascript',
      'nodejs',
      'react',
      'react-native',
    ]);
    // JavaScript was expanded as uncovered prerequisite
    expect(planA.steps[0]!.reason).toContain('prerequisito no cubierto');
    // React was expanded as uncovered prerequisite for React Native
    expect(planA.steps[2]!.reason).toContain(
      'prerequisito no cubierto antes de practicar React Native',
    );
    // Node.js and React Native were direct gaps
    expect(planA.steps[1]!.reason).toContain('habilidades faltantes del análisis guardado');
    expect(planA.steps[3]!.reason).toContain('habilidades faltantes del análisis guardado');
  });

  it('rejects templates with direct or indirect prerequisite cycles', () => {
    const cyclicDoc: LearningTemplatesDocument = {
      ...defaultTemplatesDoc,
      templates: defaultTemplatesDoc.templates.map((tpl) => {
        if (tpl.skillId === 'javascript') {
          return { ...tpl, prerequisiteSkillIds: ['react'] };
        }
        return tpl;
      }),
    };

    expect(() =>
      generateLearningPathPlan(
        {
          catalogVersion: '1.0.0',
          matchedSkillIds: [],
          missingSkillIds: ['react'],
          projects: [],
        },
        cyclicDoc,
      ),
    ).toThrow(PrerequisiteCycleError);
  });
});
