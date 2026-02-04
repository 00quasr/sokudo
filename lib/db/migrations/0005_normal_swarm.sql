CREATE TABLE "daily_practice" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" date NOT NULL,
	"practice_time_ms" integer DEFAULT 0 NOT NULL,
	"sessions_completed" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_practice" ADD CONSTRAINT "daily_practice_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_practice_user_date_idx" ON "daily_practice" USING btree ("user_id","date");