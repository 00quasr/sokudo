ALTER TABLE "users" ADD COLUMN "username" varchar(39);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");