CREATE TABLE "keystroke_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"timestamp" integer NOT NULL,
	"expected" varchar(10) NOT NULL,
	"actual" varchar(10) NOT NULL,
	"is_correct" boolean NOT NULL,
	"latency_ms" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "keystroke_logs" ADD CONSTRAINT "keystroke_logs_session_id_typing_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."typing_sessions"("id") ON DELETE no action ON UPDATE no action;