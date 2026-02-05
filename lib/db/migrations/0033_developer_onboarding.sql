-- Migration: Add developer onboarding guide tables
-- This migration adds tables to track developer onboarding steps and user progress

-- Create developer_onboarding_steps table
CREATE TABLE "developer_onboarding_steps" (
  "id" serial PRIMARY KEY NOT NULL,
  "step_key" varchar(100) NOT NULL UNIQUE,
  "title" varchar(255) NOT NULL,
  "description" text NOT NULL,
  "content" text NOT NULL,
  "category" varchar(50) NOT NULL,
  "step_order" integer NOT NULL,
  "is_optional" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create user_onboarding_progress table
CREATE TABLE "user_onboarding_progress" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "step_id" integer NOT NULL REFERENCES "developer_onboarding_steps"("id"),
  "completed" boolean NOT NULL DEFAULT false,
  "skipped" boolean NOT NULL DEFAULT false,
  "completed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create unique index for user_onboarding_progress
CREATE UNIQUE INDEX "user_onboarding_progress_user_step_idx" ON "user_onboarding_progress" ("user_id", "step_id");
