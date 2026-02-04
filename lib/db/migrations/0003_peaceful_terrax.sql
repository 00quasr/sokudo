CREATE TABLE "typing_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"challenge_id" integer NOT NULL,
	"wpm" integer NOT NULL,
	"raw_wpm" integer NOT NULL,
	"accuracy" integer NOT NULL,
	"keystrokes" integer NOT NULL,
	"errors" integer NOT NULL,
	"duration_ms" integer NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "typing_sessions" ADD CONSTRAINT "typing_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "typing_sessions" ADD CONSTRAINT "typing_sessions_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;