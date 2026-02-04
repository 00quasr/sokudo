CREATE TABLE "key_accuracy" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"key" varchar(10) NOT NULL,
	"total_presses" integer DEFAULT 0 NOT NULL,
	"correct_presses" integer DEFAULT 0 NOT NULL,
	"avg_latency_ms" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "key_accuracy" ADD CONSTRAINT "key_accuracy_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "key_accuracy_user_key_idx" ON "key_accuracy" USING btree ("user_id","key");