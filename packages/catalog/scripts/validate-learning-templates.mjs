import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const catalog = JSON.parse(
  await readFile(new URL('../technologies.json', import.meta.url), 'utf8'),
);
const templatesDoc = JSON.parse(
  await readFile(new URL('../learning-templates.json', import.meta.url), 'utf8'),
);
const casesDoc = JSON.parse(
  await readFile(new URL('../fixtures/learning-path-cases.json', import.meta.url), 'utf8'),
);

assert.equal(templatesDoc.version, '1.0.0', 'Learning templates version must be 1.0.0');
assert.equal(
  templatesDoc.catalogVersion,
  catalog.version,
  'Learning templates catalogVersion must match technologies.json version',
);
assert.ok(
  typeof templatesDoc.zeroGapsMessage === 'string' &&
    templatesDoc.zeroGapsMessage.trim().length >= 20 &&
    templatesDoc.zeroGapsMessage.length <= 500,
  'zeroGapsMessage must be a non-empty string up to 500 chars',
);

const knownSkillIds = new Set(catalog.technologies.map((tech) => tech.id));
assert.ok(Array.isArray(templatesDoc.templates), 'templates must be an array');
assert.equal(
  templatesDoc.templates.length,
  knownSkillIds.size,
  'Every catalog technology must have a learning template',
);

const forbiddenPattern =
  /\b(garantiza(?:mos)?\s+(?:empleo|contrataci[oó]n|trabajo)|100%\s*contratad|certifica(?:mos)?\s+dominio|dominio\s+garantizado|asegura\s+tu\s+contrataci[oó]n)\b/i;

export function assertAcyclicPrerequisites(templateMap) {
  const state = new Map(); // 0 = visiting, 1 = visited
  const visit = (skillId, trail = []) => {
    const current = state.get(skillId);
    if (current === 0) {
      throw new Error(`Prerequisite cycle detected: ${[...trail, skillId].join(' -> ')}`);
    }
    if (current === 1) return;
    state.set(skillId, 0);
    const tpl = templateMap.get(skillId);
    assert.ok(tpl, `Missing template for skillId: ${skillId}`);
    for (const prereq of tpl.prerequisiteSkillIds) {
      visit(prereq, [...trail, skillId]);
    }
    state.set(skillId, 1);
  };
  for (const skillId of templateMap.keys()) {
    visit(skillId);
  }
}

const bySkillId = new Map();
for (const tpl of templatesDoc.templates) {
  assert.ok(knownSkillIds.has(tpl.skillId), `Unknown template skillId: ${tpl.skillId}`);
  assert.ok(!bySkillId.has(tpl.skillId), `Duplicate template for skillId: ${tpl.skillId}`);
  assert.ok(
    typeof tpl.title === 'string' && tpl.title.trim().length >= 5 && tpl.title.length <= 120,
    `Invalid title for ${tpl.skillId}`,
  );
  assert.ok(
    typeof tpl.objective === 'string' && tpl.objective.trim().length >= 20,
    `Invalid objective for ${tpl.skillId}`,
  );
  assert.ok(
    Array.isArray(tpl.prerequisiteSkillIds),
    `prerequisiteSkillIds must be an array for ${tpl.skillId}`,
  );
  assert.deepEqual(
    tpl.prerequisiteSkillIds,
    [...new Set(tpl.prerequisiteSkillIds)],
    `Duplicate prerequisiteSkillIds in ${tpl.skillId}`,
  );
  for (const prereq of tpl.prerequisiteSkillIds) {
    assert.ok(knownSkillIds.has(prereq), `Unknown prerequisite ${prereq} in ${tpl.skillId}`);
    assert.notEqual(prereq, tpl.skillId, `Self-prerequisite in ${tpl.skillId}`);
  }
  assert.ok(
    Array.isArray(tpl.compatibleProjectSkillIds) && tpl.compatibleProjectSkillIds.length > 0,
    `compatibleProjectSkillIds must be a non-empty array for ${tpl.skillId}`,
  );
  for (const compat of tpl.compatibleProjectSkillIds) {
    assert.ok(
      knownSkillIds.has(compat),
      `Unknown compatibleProjectSkillId ${compat} in ${tpl.skillId}`,
    );
  }
  assert.ok(
    typeof tpl.standaloneActivity === 'string' &&
      tpl.standaloneActivity.trim().length >= 30 &&
      tpl.standaloneActivity.length <= 4000,
    `Invalid standaloneActivity for ${tpl.skillId}`,
  );
  assert.ok(
    typeof tpl.projectExtensionActivity === 'string' &&
      tpl.projectExtensionActivity.includes('{projectTitle}') &&
      tpl.projectExtensionActivity.length <= 4000,
    `projectExtensionActivity for ${tpl.skillId} must include {projectTitle}`,
  );
  assert.ok(
    typeof tpl.suggestedEvidence === 'string' && tpl.suggestedEvidence.trim().length >= 15,
    `Invalid suggestedEvidence for ${tpl.skillId}`,
  );
  if (tpl.resourceUrl !== null) {
    assert.match(tpl.resourceUrl, /^https:\/\/\S+$/, `Invalid resourceUrl for ${tpl.skillId}`);
    assert.ok(tpl.resourceUrl.length <= 2048, `resourceUrl too long for ${tpl.skillId}`);
  }
  for (const textField of [
    tpl.title,
    tpl.objective,
    tpl.standaloneActivity,
    tpl.projectExtensionActivity,
    tpl.suggestedEvidence,
  ]) {
    assert.ok(
      !forbiddenPattern.test(textField),
      `Forbidden hiring/mastery claim in ${tpl.skillId}`,
    );
  }
  bySkillId.set(tpl.skillId, tpl);
}

assertAcyclicPrerequisites(bySkillId);

// Verify that cyclic prerequisite graphs are rejected
assert.throws(
  () =>
    assertAcyclicPrerequisites(
      new Map([
        ['javascript', { prerequisiteSkillIds: ['react'] }],
        ['react', { prerequisiteSkillIds: ['javascript'] }],
      ]),
    ),
  /Prerequisite cycle detected/,
);

// Deterministic expansion & topological ordering verification against expected fixture cases
function planCase(input) {
  const matched = new Set(input.matchedSkillIds);
  const missing = [...new Set(input.missingSkillIds)].sort();
  if (missing.length === 0) {
    return {
      orderedSkillIds: [],
      projectIdsBySkill: {},
      progress: { completed: 0, total: 0, percentage: null },
      hasMessage: Boolean(templatesDoc.zeroGapsMessage),
    };
  }
  const needed = new Set();
  const collect = (skillId) => {
    if (needed.has(skillId)) return;
    const tpl = bySkillId.get(skillId);
    for (const prereq of tpl.prerequisiteSkillIds) {
      if (!matched.has(prereq)) {
        collect(prereq);
      }
    }
    needed.add(skillId);
  };
  for (const skillId of missing) {
    collect(skillId);
  }

  // Kahn's topological sort with deterministic alphabetical tie-breaking by skillId
  const inDegree = new Map();
  const dependents = new Map();
  for (const skillId of needed) {
    inDegree.set(skillId, 0);
    dependents.set(skillId, []);
  }
  for (const skillId of needed) {
    const tpl = bySkillId.get(skillId);
    for (const prereq of tpl.prerequisiteSkillIds) {
      if (needed.has(prereq)) {
        inDegree.set(skillId, inDegree.get(skillId) + 1);
        dependents.get(prereq).push(skillId);
      }
    }
  }
  const orderedSkillIds = [];
  while (orderedSkillIds.length < needed.size) {
    const ready = [...inDegree.entries()]
      .filter(([id, deg]) => deg === 0 && !orderedSkillIds.includes(id))
      .map(([id]) => id)
      .sort();
    assert.ok(ready.length > 0, 'Topological sort stalled');
    const next = ready[0];
    orderedSkillIds.push(next);
    for (const dep of dependents.get(next)) {
      inDegree.set(dep, inDegree.get(dep) - 1);
    }
  }

  const projectIdsBySkill = {};
  for (const skillId of orderedSkillIds) {
    const tpl = bySkillId.get(skillId);
    const compatible = input.projects.find((proj) =>
      proj.skillIds.some((id) => tpl.compatibleProjectSkillIds.includes(id)),
    );
    projectIdsBySkill[skillId] = compatible ? compatible.id : null;
  }

  return {
    orderedSkillIds,
    projectIdsBySkill,
    progress: {
      completed: 0,
      total: orderedSkillIds.length,
      percentage: 0,
    },
    hasMessage: false,
  };
}

assert.equal(casesDoc.schemaVersion, '1.0.0');
assert.equal(casesDoc.catalogVersion, catalog.version);
assert.equal(casesDoc.templateVersion, templatesDoc.version);
for (const testCase of casesDoc.cases) {
  const actual = planCase(testCase.input);
  assert.deepEqual(actual, testCase.expected, `Failed learning path case ${testCase.id}`);
}

console.log(
  `Validated learning templates ${templatesDoc.version}: ${bySkillId.size} templates, acyclic prerequisites, and ${casesDoc.cases.length} reference cases.`,
);
