CREATE TYPE "public"."gemini_model" AS ENUM('gemini-3-flash-preview', 'gemini-3-pro-preview');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('PLANNING', 'READY', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."sandbox_status" AS ENUM('READY', 'RUNNING', 'STOPPED');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('PENDING', 'RUNNING', 'REVIEW', 'DONE', 'FAILED', 'SKIPPED');--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "project_status" DEFAULT 'PLANNING' NOT NULL,
	"repo_url" text,
	"repo_name" text,
	"tech_stack" text DEFAULT 'tanstack-start' NOT NULL,
	"theme" text DEFAULT 'slate' NOT NULL,
	"vibe_input" text,
	"spec_content" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sandboxes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"daytona_id" text NOT NULL,
	"status" "sandbox_status" DEFAULT 'READY' NOT NULL,
	"task_id" uuid,
	"snapshot_id" text,
	"public_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sandboxes_daytona_id_unique" UNIQUE("daytona_id"),
	CONSTRAINT "sandboxes_task_id_unique" UNIQUE("task_id")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"phase" integer DEFAULT 1 NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"status" "task_status" DEFAULT 'PENDING' NOT NULL,
	"gemini_model" "gemini_model" DEFAULT 'gemini-3-pro-preview' NOT NULL,
	"dependencies" text[] DEFAULT '{}' NOT NULL,
	"pr_url" text,
	"pr_number" integer,
	"logs" jsonb,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sandboxes" ADD CONSTRAINT "sandboxes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sandboxes_project_idx" ON "sandboxes" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "sandboxes_status_idx" ON "sandboxes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_project_idx" ON "tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_project_phase_order_idx" ON "tasks" USING btree ("project_id","phase","order");