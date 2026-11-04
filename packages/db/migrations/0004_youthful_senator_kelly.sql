CREATE TABLE "app"."project_skills" (
	"project_id" uuid NOT NULL,
	"skill_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."profiles" ADD COLUMN "projects_revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."project_skills" ADD CONSTRAINT "project_skills_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "app"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."project_skills" ADD CONSTRAINT "project_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "app"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_skills_project_skill_idx" ON "app"."project_skills" USING btree ("project_id","skill_id");--> statement-breakpoint
CREATE INDEX "projects_user_created_id_idx" ON "app"."projects" USING btree ("user_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);