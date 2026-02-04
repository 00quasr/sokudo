CREATE TABLE "earned_team_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"achievement_id" integer NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(50) NOT NULL,
	"criteria" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_achievements_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "team_custom_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"created_by" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"difficulty" varchar(20) DEFAULT 'beginner' NOT NULL,
	"syntax_type" varchar(50) DEFAULT 'plain' NOT NULL,
	"hint" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "earned_team_achievements" ADD CONSTRAINT "earned_team_achievements_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "earned_team_achievements" ADD CONSTRAINT "earned_team_achievements_achievement_id_team_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."team_achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_custom_challenges" ADD CONSTRAINT "team_custom_challenges_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_custom_challenges" ADD CONSTRAINT "team_custom_challenges_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "earned_team_achievements_team_achievement_idx" ON "earned_team_achievements" USING btree ("team_id","achievement_id");