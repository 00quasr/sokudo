CREATE TABLE "challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"content" text NOT NULL,
	"difficulty" varchar(20) DEFAULT 'beginner' NOT NULL,
	"syntax_type" varchar(50) DEFAULT 'plain' NOT NULL,
	"hint" text,
	"avg_wpm" integer DEFAULT 0 NOT NULL,
	"times_completed" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;