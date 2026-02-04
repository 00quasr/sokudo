'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { customChallenges } from '@/lib/db/schema';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { eq, and } from 'drizzle-orm';
import {
  challengeContentSchema,
  validateChallengeContent,
} from '@/lib/validations/challenge-content';
import {
  parseShellText,
  MAX_IMPORT_CHALLENGES,
} from '@/lib/import/parse-shell-text';

const createChallengeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
  content: challengeContentSchema,
  isPublic: z.string().optional(),
});

export const createCustomChallenge = validatedActionWithUser(
  createChallengeSchema,
  async (data, _, user) => {
    const { name, content, isPublic } = data;

    const validation = validateChallengeContent(content);
    if (!validation.valid) {
      return { error: validation.errors[0] };
    }

    const [challenge] = await db
      .insert(customChallenges)
      .values({
        userId: user.id,
        name,
        content,
        isPublic: isPublic === 'on',
      })
      .returning();

    const warnings = validation.warnings.length > 0
      ? ` Warning: ${validation.warnings[0]}`
      : '';

    return { success: `Challenge created successfully.${warnings}`, challengeId: challenge.id };
  }
);

const updateChallengeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
  content: challengeContentSchema,
  isPublic: z.string().optional(),
});

export const updateCustomChallenge = validatedActionWithUser(
  updateChallengeSchema,
  async (data, _, user) => {
    const { id, name, content, isPublic } = data;
    const challengeId = parseInt(id, 10);

    const validation = validateChallengeContent(content);
    if (!validation.valid) {
      return { error: validation.errors[0] };
    }

    const [existing] = await db
      .select()
      .from(customChallenges)
      .where(
        and(
          eq(customChallenges.id, challengeId),
          eq(customChallenges.userId, user.id)
        )
      );

    if (!existing) {
      return { error: 'Challenge not found.' };
    }

    await db
      .update(customChallenges)
      .set({
        name,
        content,
        isPublic: isPublic === 'on',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(customChallenges.id, challengeId),
          eq(customChallenges.userId, user.id)
        )
      );

    const warnings = validation.warnings.length > 0
      ? ` Warning: ${validation.warnings[0]}`
      : '';

    return { success: `Challenge updated successfully.${warnings}` };
  }
);

const deleteChallengeSchema = z.object({
  id: z.string().min(1),
});

export const deleteCustomChallenge = validatedActionWithUser(
  deleteChallengeSchema,
  async (data, _, user) => {
    const challengeId = parseInt(data.id, 10);

    const [existing] = await db
      .select()
      .from(customChallenges)
      .where(
        and(
          eq(customChallenges.id, challengeId),
          eq(customChallenges.userId, user.id)
        )
      );

    if (!existing) {
      return { error: 'Challenge not found.' };
    }

    await db
      .delete(customChallenges)
      .where(
        and(
          eq(customChallenges.id, challengeId),
          eq(customChallenges.userId, user.id)
        )
      );

    return { success: 'Challenge deleted successfully.' };
  }
);

const forkChallengeSchema = z.object({
  challengeId: z.string().min(1, 'Challenge ID is required'),
});

export const forkChallenge = validatedActionWithUser(
  forkChallengeSchema,
  async (data, _, user) => {
    const sourceId = parseInt(data.challengeId, 10);
    if (isNaN(sourceId)) {
      return { error: 'Invalid challenge ID.' };
    }

    // Fetch the source challenge (must be public)
    const [source] = await db
      .select()
      .from(customChallenges)
      .where(
        and(
          eq(customChallenges.id, sourceId),
          eq(customChallenges.isPublic, true)
        )
      );

    if (!source) {
      return { error: 'Challenge not found or is not public.' };
    }

    const [forked] = await db
      .insert(customChallenges)
      .values({
        userId: user.id,
        name: source.name,
        content: source.content,
        isPublic: false,
        forkedFromId: source.id,
      })
      .returning();

    return { success: 'Challenge forked successfully.', challengeId: forked.id };
  }
);

const importChallengesSchema = z.object({
  text: z.string().min(1, 'Paste some text to import.').max(50000, 'Input text is too large.'),
  mode: z.enum(['lines', 'block']).default('lines'),
});

export const importChallengesFromText = validatedActionWithUser(
  importChallengesSchema,
  async (data, _, user) => {
    const { text, mode } = data;
    const parsed = parseShellText(text, mode);

    if (parsed.challenges.length === 0) {
      return { error: 'No valid challenges found in the pasted text. Lines that are too short, comments, or duplicates are skipped.' };
    }

    if (parsed.challenges.length > MAX_IMPORT_CHALLENGES) {
      return { error: `Too many challenges. Maximum ${MAX_IMPORT_CHALLENGES} per import.` };
    }

    const created: number[] = [];
    const errors: string[] = [];

    for (const challenge of parsed.challenges) {
      const validation = validateChallengeContent(challenge.content);
      if (!validation.valid) {
        errors.push(`"${challenge.name}": ${validation.errors[0]}`);
        continue;
      }

      const [inserted] = await db
        .insert(customChallenges)
        .values({
          userId: user.id,
          name: challenge.name,
          content: challenge.content,
          isPublic: false,
        })
        .returning({ id: customChallenges.id });

      created.push(inserted.id);
    }

    if (created.length === 0) {
      return { error: `All challenges failed validation: ${errors[0]}` };
    }

    const parts: string[] = [`Imported ${created.length} challenge${created.length !== 1 ? 's' : ''}.`];
    if (parsed.skippedLines > 0) {
      parts.push(`${parsed.skippedLines} line${parsed.skippedLines !== 1 ? 's' : ''} skipped.`);
    }
    if (errors.length > 0) {
      parts.push(`${errors.length} failed validation.`);
    }

    return { success: parts.join(' '), importedCount: created.length };
  }
);
