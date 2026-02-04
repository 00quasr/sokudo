CREATE TABLE "races" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" varchar(20) DEFAULT 'waiting' NOT NULL,
	"challenge_id" integer NOT NULL,
	"started_at" timestamp,
	"max_players" integer DEFAULT 4 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "races" ADD CONSTRAINT "races_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;