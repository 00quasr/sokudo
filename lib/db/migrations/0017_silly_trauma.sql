CREATE TABLE "team_onboarding_course_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"step_id" integer NOT NULL,
	"session_id" integer,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_onboarding_course_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"challenge_id" integer NOT NULL,
	"step_order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_onboarding_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"created_by" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "team_onboarding_course_progress" ADD CONSTRAINT "team_onboarding_course_progress_course_id_team_onboarding_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."team_onboarding_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_onboarding_course_progress" ADD CONSTRAINT "team_onboarding_course_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_onboarding_course_progress" ADD CONSTRAINT "team_onboarding_course_progress_step_id_team_onboarding_course_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."team_onboarding_course_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_onboarding_course_progress" ADD CONSTRAINT "team_onboarding_course_progress_session_id_typing_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."typing_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_onboarding_course_steps" ADD CONSTRAINT "team_onboarding_course_steps_course_id_team_onboarding_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."team_onboarding_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_onboarding_course_steps" ADD CONSTRAINT "team_onboarding_course_steps_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_onboarding_courses" ADD CONSTRAINT "team_onboarding_courses_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_onboarding_courses" ADD CONSTRAINT "team_onboarding_courses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_progress_user_step_idx" ON "team_onboarding_course_progress" USING btree ("user_id","step_id");