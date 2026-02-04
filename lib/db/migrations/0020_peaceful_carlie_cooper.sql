ALTER TABLE "user_profiles" ADD COLUMN "avatar_url" varchar(500);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "bio" varchar(500);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "preferred_category_ids" jsonb DEFAULT '[]'::jsonb;