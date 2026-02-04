CREATE TABLE "challenge_collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"collection_id" integer NOT NULL,
	"challenge_id" integer NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "challenge_collections" ADD CONSTRAINT "challenge_collections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_challenges" ADD CONSTRAINT "collection_challenges_collection_id_challenge_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."challenge_collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_challenges" ADD CONSTRAINT "collection_challenges_challenge_id_custom_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."custom_challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "collection_challenges_collection_challenge_idx" ON "collection_challenges" USING btree ("collection_id","challenge_id");