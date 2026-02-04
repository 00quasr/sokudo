-- Migration: Change races from single challenge to full category
-- This migration:
-- 1. Adds category_id to races table
-- 2. Removes challenge_id from races table (breaking change)
-- 3. Adds current_challenge_index to race_participants

-- Add category_id column to races
ALTER TABLE "races" ADD COLUMN "category_id" integer NOT NULL REFERENCES "categories"("id");

-- Drop the old challenge_id constraint and column
ALTER TABLE "races" DROP CONSTRAINT "races_challenge_id_challenges_id_fk";
ALTER TABLE "races" DROP COLUMN "challenge_id";

-- Add current_challenge_index to race_participants to track progress through category
ALTER TABLE "race_participants" ADD COLUMN "current_challenge_index" integer NOT NULL DEFAULT 0;
