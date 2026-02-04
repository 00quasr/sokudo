'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { challengeCollections, collectionChallenges, customChallenges } from '@/lib/db/schema';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { eq, and, sql } from 'drizzle-orm';

const createCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  isPublic: z.string().optional(),
});

export const createCollection = validatedActionWithUser(
  createCollectionSchema,
  async (data, _, user) => {
    const { name, description, isPublic } = data;

    const [collection] = await db
      .insert(challengeCollections)
      .values({
        userId: user.id,
        name,
        description: description || null,
        isPublic: isPublic === 'on',
      })
      .returning();

    return { success: 'Collection created successfully.', collectionId: collection.id };
  }
);

const updateCollectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  isPublic: z.string().optional(),
});

export const updateCollection = validatedActionWithUser(
  updateCollectionSchema,
  async (data, _, user) => {
    const collectionId = parseInt(data.id, 10);

    const [existing] = await db
      .select()
      .from(challengeCollections)
      .where(
        and(
          eq(challengeCollections.id, collectionId),
          eq(challengeCollections.userId, user.id)
        )
      );

    if (!existing) {
      return { error: 'Collection not found.' };
    }

    await db
      .update(challengeCollections)
      .set({
        name: data.name,
        description: data.description || null,
        isPublic: data.isPublic === 'on',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(challengeCollections.id, collectionId),
          eq(challengeCollections.userId, user.id)
        )
      );

    return { success: 'Collection updated successfully.' };
  }
);

const deleteCollectionSchema = z.object({
  id: z.string().min(1),
});

export const deleteCollection = validatedActionWithUser(
  deleteCollectionSchema,
  async (data, _, user) => {
    const collectionId = parseInt(data.id, 10);

    const [existing] = await db
      .select()
      .from(challengeCollections)
      .where(
        and(
          eq(challengeCollections.id, collectionId),
          eq(challengeCollections.userId, user.id)
        )
      );

    if (!existing) {
      return { error: 'Collection not found.' };
    }

    await db
      .delete(challengeCollections)
      .where(
        and(
          eq(challengeCollections.id, collectionId),
          eq(challengeCollections.userId, user.id)
        )
      );

    return { success: 'Collection deleted successfully.' };
  }
);

const addChallengeToCollectionSchema = z.object({
  collectionId: z.string().min(1),
  challengeId: z.string().min(1),
});

export const addChallengeToCollection = validatedActionWithUser(
  addChallengeToCollectionSchema,
  async (data, _, user) => {
    const collectionId = parseInt(data.collectionId, 10);
    const challengeId = parseInt(data.challengeId, 10);

    // Verify collection ownership
    const [collection] = await db
      .select()
      .from(challengeCollections)
      .where(
        and(
          eq(challengeCollections.id, collectionId),
          eq(challengeCollections.userId, user.id)
        )
      );

    if (!collection) {
      return { error: 'Collection not found.' };
    }

    // Verify challenge exists and is either owned by user or public
    const [challenge] = await db
      .select()
      .from(customChallenges)
      .where(
        and(
          eq(customChallenges.id, challengeId),
          // User must own the challenge or it must be public
        )
      );

    if (!challenge || (!challenge.isPublic && challenge.userId !== user.id)) {
      return { error: 'Challenge not found or not accessible.' };
    }

    // Check if already in collection
    const [existing] = await db
      .select()
      .from(collectionChallenges)
      .where(
        and(
          eq(collectionChallenges.collectionId, collectionId),
          eq(collectionChallenges.challengeId, challengeId)
        )
      );

    if (existing) {
      return { error: 'Challenge is already in this collection.' };
    }

    // Get next display order
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(collectionChallenges)
      .where(eq(collectionChallenges.collectionId, collectionId));

    await db
      .insert(collectionChallenges)
      .values({
        collectionId,
        challengeId,
        displayOrder: countResult?.count ?? 0,
      });

    return { success: 'Challenge added to collection.' };
  }
);

const removeChallengeFromCollectionSchema = z.object({
  collectionId: z.string().min(1),
  challengeId: z.string().min(1),
});

export const removeChallengeFromCollection = validatedActionWithUser(
  removeChallengeFromCollectionSchema,
  async (data, _, user) => {
    const collectionId = parseInt(data.collectionId, 10);
    const challengeId = parseInt(data.challengeId, 10);

    // Verify collection ownership
    const [collection] = await db
      .select()
      .from(challengeCollections)
      .where(
        and(
          eq(challengeCollections.id, collectionId),
          eq(challengeCollections.userId, user.id)
        )
      );

    if (!collection) {
      return { error: 'Collection not found.' };
    }

    await db
      .delete(collectionChallenges)
      .where(
        and(
          eq(collectionChallenges.collectionId, collectionId),
          eq(collectionChallenges.challengeId, challengeId)
        )
      );

    return { success: 'Challenge removed from collection.' };
  }
);
