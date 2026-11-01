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
export type Analysis = typeof analyses.$inferSelect;
export type NewAnalysis = typeof analyses.$inferInsert;
