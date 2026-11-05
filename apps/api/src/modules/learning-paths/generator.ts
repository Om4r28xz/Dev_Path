import { readFileSync } from 'node:fs';
import { z } from 'zod';

export const GENERATOR_VERSION = 'rules-1';

const catalogDocSchema = z.object({
  version: z.string().min(1).max(40),
  technologies: z.array(
    z.object({
      id: z.string().min(1).max(64),
      name: z.string().min(1),
    }),
  ),
});

const learningTemplateSchema = z.object({
  skillId: z.string().min(1).max(64),
  title: z.string().min(1).max(120),
  objective: z.string().min(1),
  prerequisiteSkillIds: z.array(z.string().min(1).max(64)),
  compatibleProjectSkillIds: z.array(z.string().min(1).max(64)).min(1),
  standaloneActivity: z.string().min(1).max(4000),
  projectExtensionActivity: z.string().min(1).max(4000),
  suggestedEvidence: z.string().min(1).max(1000),
  resourceUrl: z
    .string()
    .max(2048)
    .regex(/^https?:\/\//u)
    .nullable(),
});

const learningTemplatesDocSchema = z.object({
  version: z.string().min(1).max(40),
  catalogVersion: z.string().min(1).max(40),
  zeroGapsMessage: z.string().min(1).max(500),
  templates: z.array(learningTemplateSchema).min(1),
});

export type CatalogDocument = z.infer<typeof catalogDocSchema>;
export type LearningTemplate = z.infer<typeof learningTemplateSchema>;
export type LearningTemplatesDocument = z.infer<typeof learningTemplatesDocSchema>;

export class PrerequisiteCycleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrerequisiteCycleError';
  }
}

export interface ProjectSummaryForPath {
  readonly id: string;
  readonly title: string;
  readonly skillIds: readonly string[];
}

export interface LearningPathGenerationInput {
  readonly catalogVersion: string;
  readonly matchedSkillIds: readonly string[];
  readonly missingSkillIds: readonly string[];
  readonly projects: readonly ProjectSummaryForPath[];
}

export interface GeneratedLearningStep {
  readonly stepOrder: number;
  readonly title: string;
  readonly activity: string;
  readonly reason: string;
  readonly skillIds: readonly string[];
  readonly projectId: string | null;
  readonly resourceUrl: string | null;
}

export interface GeneratedLearningPathPlan {
  readonly versions: {
    readonly catalog: string;
    readonly content: string;
    readonly generator: string;
  };
  readonly steps: readonly GeneratedLearningStep[];
  readonly progress: {
    readonly completed: number;
    readonly total: number;
    readonly percentage: number | null;
  };
  readonly message: string | null;
}

const defaultCatalog: CatalogDocument = catalogDocSchema.parse(
  JSON.parse(
    readFileSync(
      new URL('../../../../../packages/catalog/technologies.json', import.meta.url),
      'utf8',
    ),
  ),
);

const defaultTemplates: LearningTemplatesDocument = learningTemplatesDocSchema.parse(
  JSON.parse(
    readFileSync(
      new URL('../../../../../packages/catalog/learning-templates.json', import.meta.url),
      'utf8',
    ),
  ),
);

export function validateTemplatesAndGraph(
  templatesDoc: LearningTemplatesDocument,
  catalogDoc: CatalogDocument = defaultCatalog,
): {
  readonly templateBySkill: ReadonlyMap<string, LearningTemplate>;
  readonly skillNameById: ReadonlyMap<string, string>;
} {
  const parsedCatalog = catalogDocSchema.parse(catalogDoc);
  const parsedTemplates = learningTemplatesDocSchema.parse(templatesDoc);
  const skillNameById = new Map(parsedCatalog.technologies.map((tech) => [tech.id, tech.name]));
  const templateBySkill = new Map<string, LearningTemplate>();

  for (const tpl of parsedTemplates.templates) {
    if (!skillNameById.has(tpl.skillId)) {
      throw new Error(`Unknown template skillId: ${tpl.skillId}`);
    }
    if (templateBySkill.has(tpl.skillId)) {
      throw new Error(`Duplicate template skillId: ${tpl.skillId}`);
    }
    for (const prereq of tpl.prerequisiteSkillIds) {
      if (!skillNameById.has(prereq)) {
        throw new Error(`Unknown prerequisite ${prereq} in template ${tpl.skillId}`);
      }
    }
    for (const compat of tpl.compatibleProjectSkillIds) {
      if (!skillNameById.has(compat)) {
        throw new Error(`Unknown compatibleProjectSkillId ${compat} in template ${tpl.skillId}`);
      }
    }
    templateBySkill.set(tpl.skillId, tpl);
  }

  // DFS cycle detection across all templates
  const visitState = new Map<string, 'visiting' | 'visited'>();
  const visit = (skillId: string, trail: readonly string[]): void => {
    const state = visitState.get(skillId);
    if (state === 'visiting') {
      throw new PrerequisiteCycleError(
        `Prerequisite cycle detected: ${[...trail, skillId].join(' -> ')}`,
      );
    }
    if (state === 'visited') return;
    visitState.set(skillId, 'visiting');
    const tpl = templateBySkill.get(skillId);
    if (!tpl) {
      throw new Error(`Missing learning template for skillId: ${skillId}`);
    }
    for (const prereq of tpl.prerequisiteSkillIds) {
      visit(prereq, [...trail, skillId]);
    }
    visitState.set(skillId, 'visited');
  };

  for (const skillId of templateBySkill.keys()) {
    visit(skillId, []);
  }

  return { templateBySkill, skillNameById };
}

// Validate default catalog and templates at module load
validateTemplatesAndGraph(defaultTemplates, defaultCatalog);

export function generateLearningPathPlan(
  input: LearningPathGenerationInput,
  templatesDoc: LearningTemplatesDocument = defaultTemplates,
  catalogDoc: CatalogDocument = defaultCatalog,
): GeneratedLearningPathPlan {
  const { templateBySkill, skillNameById } = validateTemplatesAndGraph(templatesDoc, catalogDoc);

  const matchedSet = new Set(input.matchedSkillIds);
  const missingSorted = [...new Set(input.missingSkillIds)].sort();
  const missingSet = new Set(missingSorted);

  if (missingSorted.length === 0) {
    return {
      versions: {
        catalog: input.catalogVersion,
        content: templatesDoc.version,
        generator: GENERATOR_VERSION,
      },
      steps: [],
      progress: {
        completed: 0,
        total: 0,
        percentage: null,
      },
      message: templatesDoc.zeroGapsMessage,
    };
  }

  const needed = new Set<string>();
  const dependentsByPrereq = new Map<string, Set<string>>();

  const collectSkill = (skillId: string): void => {
    const tpl = templateBySkill.get(skillId);
    if (!tpl) {
      throw new Error(`Missing learning template for skillId: ${skillId}`);
    }
    for (const prereq of tpl.prerequisiteSkillIds) {
      if (!matchedSet.has(prereq)) {
        let deps = dependentsByPrereq.get(prereq);
        if (!deps) {
          deps = new Set<string>();
          dependentsByPrereq.set(prereq, deps);
        }
        deps.add(skillId);
        if (!needed.has(prereq)) {
          collectSkill(prereq);
        }
      }
    }
    needed.add(skillId);
  };

  for (const skillId of missingSorted) {
    collectSkill(skillId);
  }

  // Compute topological depth (root prerequisites = 0) and sort by (depth ASC, skillId ASC)
  const depthBySkill = new Map<string, number>();
  const computeDepth = (skillId: string): number => {
    const cached = depthBySkill.get(skillId);
    if (cached !== undefined) return cached;
    const tpl = templateBySkill.get(skillId);
    if (!tpl) throw new Error(`Missing learning template for skillId: ${skillId}`);
    let depth = 0;
    for (const prereq of tpl.prerequisiteSkillIds) {
      if (needed.has(prereq)) {
        depth = Math.max(depth, computeDepth(prereq) + 1);
      }
    }
    depthBySkill.set(skillId, depth);
    return depth;
  };

  for (const skillId of needed) {
    computeDepth(skillId);
  }

  const orderedSkillIds = [...needed].sort((a, b) => {
    const depthDiff = (depthBySkill.get(a) ?? 0) - (depthBySkill.get(b) ?? 0);
    return depthDiff !== 0 ? depthDiff : a.localeCompare(b);
  });

  const steps: GeneratedLearningStep[] = orderedSkillIds.map((skillId, index) => {
    const tpl = templateBySkill.get(skillId)!;
    const skillName = skillNameById.get(skillId) ?? skillId;
    const dependentIds = [...(dependentsByPrereq.get(skillId) ?? [])].sort();
    const dependentNames = dependentIds.map((id) => skillNameById.get(id) ?? id);

    let reason: string;
    if (missingSet.has(skillId) && dependentNames.length > 0) {
      reason = `${skillName} está entre las habilidades faltantes del análisis guardado y además es prerequisito para practicar ${dependentNames.join(', ')}.`;
    } else if (missingSet.has(skillId)) {
      reason = `${skillName} está entre las habilidades faltantes del análisis guardado.`;
    } else {
      reason = `${skillName} se incluye como prerequisito no cubierto antes de practicar ${dependentNames.join(', ')}.`;
    }

    const compatibleProject = input.projects.find((proj) =>
      proj.skillIds.some((id) => tpl.compatibleProjectSkillIds.includes(id)),
    );

    const activity = compatibleProject
      ? `${tpl.projectExtensionActivity.replaceAll('{projectTitle}', compatibleProject.title)} Evidencia sugerida: ${tpl.suggestedEvidence}`
      : tpl.standaloneActivity;

    return {
      stepOrder: index,
      title: tpl.title,
      activity,
      reason,
      skillIds: [skillId],
      projectId: compatibleProject ? compatibleProject.id : null,
      resourceUrl: tpl.resourceUrl,
    };
  });

  return {
    versions: {
      catalog: input.catalogVersion,
      content: templatesDoc.version,
      generator: GENERATOR_VERSION,
    },
    steps,
    progress: {
      completed: 0,
      total: steps.length,
      percentage: 0,
    },
    message: null,
  };
}
