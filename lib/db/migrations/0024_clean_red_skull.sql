CREATE TABLE "race_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"race_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"wpm" integer,
	"accuracy" integer,
	"finished_at" timestamp,
	"rank" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "race_participants" ADD CONSTRAINT "race_participants_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_participants" ADD CONSTRAINT "race_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "race_participants_race_user_idx" ON "race_participants" USING btree ("race_id","user_id");