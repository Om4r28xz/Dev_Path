CREATE TABLE "app"."learning_path_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learning_path_id" uuid NOT NULL,
	"step_order" integer NOT NULL,
	"title" text NOT NULL,
	"activity" text NOT NULL,
	"reason" text NOT NULL,
	"skill_ids" text[] DEFAULT '{}' NOT NULL,
	"project_id" uuid,
	"resource_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "app"."learning_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"analysis_id" uuid NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"request_hash" text NOT NULL,
	"projects_revision" integer DEFAULT 0 NOT NULL,
	"catalog_version" text NOT NULL,
	"content_version" text NOT NULL,
	"generator_version" text NOT NULL,
	"input_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."learning_path_steps" ADD CONSTRAINT "learning_path_steps_learning_path_id_learning_paths_id_fk" FOREIGN KEY ("learning_path_id") REFERENCES "app"."learning_paths"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."learning_path_steps" ADD CONSTRAINT "learning_path_steps_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "app"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."learning_paths" ADD CONSTRAINT "learning_paths_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."learning_paths" ADD CONSTRAINT "learning_paths_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "app"."analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "learning_path_steps_path_order_idx" ON "app"."learning_path_steps" USING btree ("learning_path_id","step_order");--> statement-breakpoint
CREATE INDEX "learning_path_steps_project_id_idx" ON "app"."learning_path_steps" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "learning_paths_user_idempotency_idx" ON "app"."learning_paths" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "learning_paths_user_created_id_idx" ON "app"."learning_paths" USING btree ("user_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "learning_paths_analysis_id_idx" ON "app"."learning_paths" USING btree ("analysis_id");