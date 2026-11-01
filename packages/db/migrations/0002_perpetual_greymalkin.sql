ALTER TABLE "app"."analyses" ADD COLUMN "request_hash" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."analyses" ADD COLUMN "candidate_skill_ids" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."analyses" ADD COLUMN "evidence" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."analyses" ADD COLUMN "warnings" text[] DEFAULT '{}' NOT NULL;