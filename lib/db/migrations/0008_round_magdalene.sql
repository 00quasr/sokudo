CREATE TABLE "char_error_patterns" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expected_char" varchar(10) NOT NULL,
	"actual_char" varchar(10) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "char_error_patterns" ADD CONSTRAINT "char_error_patterns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "char_error_patterns_user_expected_actual_idx" ON "char_error_patterns" USING btree ("user_id","expected_char","actual_char");