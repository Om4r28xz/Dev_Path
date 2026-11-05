import {
  pgSchema,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============================================================================
// Schemas
// ============================================================================
export const authSchema = pgSchema('auth');
export const appSchema = pgSchema('app');

// ============================================================================
// auth.users
// ============================================================================
export const users = authSchema.table(
  'users',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [uniqueIndex('users_email_idx').on(t.email)],
);

// ============================================================================
// auth.session_families
// ============================================================================
export const sessionFamilies = authSchema.table('session_families', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .default(sql`now()`),
  revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
});

// ============================================================================
// auth.refresh_tokens
// ============================================================================
export const refreshTokens = authSchema.table(
  'refresh_tokens',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    familyId: uuid('family_id')
      .notNull()
      .references(() => sessionFamilies.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .default(sql`now()`),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true, mode: 'string' }),
  },
  (t) => [uniqueIndex('refresh_tokens_hash_idx').on(t.tokenHash)],
);

// ============================================================================
// auth.security_events
// ============================================================================
export const securityEvents = authSchema.table(
  'security_events',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index('security_events_user_created_idx').on(t.userId, t.createdAt)],
);

// ============================================================================
// app.profiles
// ============================================================================
export const profiles = appSchema.table(
  'profiles',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    fullName: text('full_name').notNull(),
    headline: text('headline'),
    location: text('location'),
    skillsRevision: integer('skills_revision').notNull().default(0),
    projectsRevision: integer('projects_revision').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index('profiles_user_id_idx').on(t.userId)],
);

// ============================================================================
// app.skills
// ============================================================================
export const skills = appSchema.table('skills', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .default(sql`now()`),
});

// ============================================================================
// app.user_skills
// ============================================================================
export const userSkills = appSchema.table(
  'user_skills',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    skillId: text('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
    proficiency: text('proficiency'),
    addedAt: timestamp('added_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex('user_skills_user_skill_idx').on(t.userId, t.skillId),
    index('user_skills_user_id_idx').on(t.userId),
  ],
);

export const cvFiles = appSchema.table('cv_files', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  storageKey: text('storage_key').notNull().unique(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .default(sql`now()`),
});

export const cvCleanup = appSchema.table('cv_cleanup', {
  storageKey: text('storage_key').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .default(sql`now()`),
});

export const projects = appSchema.table(
  'projects',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    url: text('url'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [index('projects_user_created_id_idx').on(t.userId, t.createdAt.desc(), t.id.desc())],
);

export const projectSkills = appSchema.table(
  'project_skills',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    skillId: text('skill_id')
      .notNull()
      .references(() => skills.id),
  },
  (t) => [uniqueIndex('project_skills_project_skill_idx').on(t.projectId, t.skillId)],
);

// ============================================================================
// app.analyses
// ============================================================================
export const analyses = appSchema.table(
  'analyses',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    idempotencyKey: uuid('idempotency_key').notNull(),
    requestHash: text('request_hash').notNull().default(''),
    candidateSkillIds: text('candidate_skill_ids')
      .array()
      .notNull()
      .default(sql`'{}'`),
    evidence: jsonb('evidence')
      .notNull()
      .default(sql`'[]'::jsonb`),
    warnings: text('warnings')
      .array()
      .notNull()
      .default(sql`'{}'`),
    jobTitle: text('job_title'),
    jobText: text('job_text').notNull(),
    requiredSkillIds: text('required_skill_ids')
      .array()
      .notNull()
      .default(sql`'{}'`),
    matchedSkillIds: text('matched_skill_ids')
      .array()
      .notNull()
      .default(sql`'{}'`),
    missingSkillIds: text('missing_skill_ids')
      .array()
      .notNull()
      .default(sql`'{}'`),
    compatibilityPercentage: integer('compatibility_percentage'),
    candidateSkillsRevision: integer('candidate_skills_revision').notNull().default(0),
    skillsOutdated: boolean('skills_outdated').notNull().default(false),
    catalogVersion: text('catalog_version').notNull(),
    extractorVersion: text('extractor_version').notNull(),
    scoringVersion: text('scoring_version').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex('analyses_user_idempotency_idx').on(t.userId, t.idempotencyKey),
    index('analyses_user_created_idx').on(t.userId, t.createdAt),
    index('analyses_user_created_id_idx').on(t.userId, t.createdAt.desc(), t.id.desc()),
  ],
);

// ============================================================================
// app.learning_paths
// ============================================================================
export const learningPaths = appSchema.table(
  'learning_paths',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    analysisId: uuid('analysis_id')
      .notNull()
      .references(() => analyses.id, { onDelete: 'cascade' }),
    idempotencyKey: uuid('idempotency_key').notNull(),
    requestHash: text('request_hash').notNull(),
    projectsRevision: integer('projects_revision').notNull().default(0),
    catalogVersion: text('catalog_version').notNull(),
    contentVersion: text('content_version').notNull(),
    generatorVersion: text('generator_version').notNull(),
    inputSnapshot: jsonb('input_snapshot')
      .notNull()
      .default(sql`'{}'::jsonb`),
    message: text('message'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    uniqueIndex('learning_paths_user_idempotency_idx').on(t.userId, t.idempotencyKey),
    index('learning_paths_user_created_id_idx').on(t.userId, t.createdAt.desc(), t.id.desc()),
    index('learning_paths_analysis_id_idx').on(t.analysisId),
  ],
);

// ============================================================================
// app.learning_path_steps
// ============================================================================
export const learningPathSteps = appSchema.table(
  'learning_path_steps',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    learningPathId: uuid('learning_path_id')
      .notNull()
      .references(() => learningPaths.id, { onDelete: 'cascade' }),
    stepOrder: integer('step_order').notNull(),
    title: text('title').notNull(),
    activity: text('activity').notNull(),
    reason: text('reason').notNull(),
    skillIds: text('skill_ids')
      .array()
      .notNull()
      .default(sql`'{}'`),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    resourceUrl: text('resource_url'),
    status: text('status').notNull().default('pending'),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
  },
  (t) => [
    uniqueIndex('learning_path_steps_path_order_idx').on(t.learningPathId, t.stepOrder),
    index('learning_path_steps_project_id_idx').on(t.projectId),
  ],
);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SessionFamily = typeof sessionFamilies.$inferSelect;
export type NewSessionFamily = typeof sessionFamilies.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
export type SecurityEvent = typeof securityEvents.$inferSelect;
export type NewSecurityEvent = typeof securityEvents.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
export type UserSkill = typeof userSkills.$inferSelect;
export type NewUserSkill = typeof userSkills.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectSkill = typeof projectSkills.$inferSelect;
export type Analysis = typeof analyses.$inferSelect;
export type NewAnalysis = typeof analyses.$inferInsert;
export type LearningPathRow = typeof learningPaths.$inferSelect;
export type NewLearningPathRow = typeof learningPaths.$inferInsert;
export type LearningPathStepRow = typeof learningPathSteps.$inferSelect;
export type NewLearningPathStepRow = typeof learningPathSteps.$inferInsert;
