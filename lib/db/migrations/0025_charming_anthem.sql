CREATE TABLE "friend_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenger_id" integer NOT NULL,
	"challenged_id" integer NOT NULL,
	"challenge_id" integer NOT NULL,
	"race_id" integer,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"message" varchar(255),
	"expires_at" timestamp NOT NULL,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "friend_challenges" ADD CONSTRAINT "friend_challenges_challenger_id_users_id_fk" FOREIGN KEY ("challenger_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_challenges" ADD CONSTRAINT "friend_challenges_challenged_id_users_id_fk" FOREIGN KEY ("challenged_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_challenges" ADD CONSTRAINT "friend_challenges_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_challenges" ADD CONSTRAINT "friend_challenges_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE no action ON UPDATE no action;