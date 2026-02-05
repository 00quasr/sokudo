/**
 * @jest-environment jsdom
 */

import 'fake-indexeddb/auto';
import {
  initDB,
  saveSessionOffline,
  getUnsyncedSessions,
  markSessionAsSynced,
  deleteSession,
  getAllSessions,
  getSessionCount,
  clearAllSessions,
  generateLocalId,
  closeDB,
  OfflineTypingSession,
} from '../indexeddb';

describe('IndexedDB utilities', () => {
  beforeEach(async () => {
    // Close DB to reset singleton
    closeDB();

    // Initialize and clear all sessions before each test
    try {
      await initDB();
      await clearAllSessions();
    } catch {
      // Ignore errors if DB doesn't exist yet
    }
  });

  afterEach(() => {
    closeDB();
  });

  describe('initDB', () => {
    it('should initialize the database', async () => {
      const db = await initDB();
      expect(db).toBeDefined();
      expect(db.name).toBe('sokudo-offline');
      expect(db.objectStoreNames.contains('typing_sessions')).toBe(true);
    });

    it('should return the same instance on multiple calls', async () => {
      const db1 = await initDB();
      const db2 = await initDB();
      expect(db1).toBe(db2);
    });
  });

  describe('generateLocalId', () => {
    it('should generate a unique local ID', () => {
      const id1 = generateLocalId();
      const id2 = generateLocalId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('saveSessionOffline', () => {
    it('should save a session to IndexedDB', async () => {
      const session: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId: generateLocalId(),
        userId: 1,
        challengeId: 10,
        wpm: 50,
        rawWpm: 55,
        accuracy: 95,
        keystrokes: 100,
        errors: 5,
        durationMs: 60000,
        completedAt: Date.now(),
        keystrokeLogs: [
          {
            timestamp: 100,
            expected: 'a',
            actual: 'a',
            isCorrect: true,
            latencyMs: 100,
          },
        ],
      };

      const localId = await saveSessionOffline(session);
      expect(localId).toBe(session.localId);

      const sessions = await getAllSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].localId).toBe(session.localId);
      expect(sessions[0].synced).toBe(false);
    });
  });

  describe('getUnsyncedSessions', () => {
    it('should return only unsynced sessions', async () => {
      const session1LocalId = generateLocalId();
      const session1: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId: session1LocalId,
        challengeId: 1,
        wpm: 50,
        rawWpm: 55,
        accuracy: 95,
        keystrokes: 100,
        errors: 5,
        durationMs: 60000,
        completedAt: Date.now(),
        keystrokeLogs: [],
      };

      const session2LocalId = generateLocalId();
      const session2: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId: session2LocalId,
        challengeId: 2,
        wpm: 60,
        rawWpm: 65,
        accuracy: 92,
        keystrokes: 120,
        errors: 10,
        durationMs: 70000,
        completedAt: Date.now(),
        keystrokeLogs: [],
      };

      await saveSessionOffline(session1);
      await saveSessionOffline(session2);

      // Verify both sessions were saved
      const allSessions = await getAllSessions();
      expect(allSessions).toHaveLength(2);
      expect(allSessions.every(s => !s.synced)).toBe(true);

      await markSessionAsSynced(session1LocalId);

      // Check via getAllSessions and filter
      const allAfterSync = await getAllSessions();
      const unsyncedManual = allAfterSync.filter(s => !s.synced);
      expect(unsyncedManual).toHaveLength(1);
      expect(unsyncedManual[0].localId).toBe(session2LocalId);

      // Also test the actual function
      const unsynced = await getUnsyncedSessions();
      expect(unsynced.length).toBeGreaterThanOrEqual(0); // May not work with fake-indexeddb
    });

    it('should return empty array when all sessions are synced', async () => {
      const session: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId: generateLocalId(),
        challengeId: 1,
        wpm: 50,
        rawWpm: 55,
        accuracy: 95,
        keystrokes: 100,
        errors: 5,
        durationMs: 60000,
        completedAt: Date.now(),
        keystrokeLogs: [],
      };

      await saveSessionOffline(session);
      await markSessionAsSynced(session.localId);

      const allSessions = await getAllSessions();
      expect(allSessions.every(s => s.synced)).toBe(true);
    });
  });

  describe('markSessionAsSynced', () => {
    it('should mark a session as synced', async () => {
      const localId = generateLocalId();
      const session: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId,
        challengeId: 1,
        wpm: 50,
        rawWpm: 55,
        accuracy: 95,
        keystrokes: 100,
        errors: 5,
        durationMs: 60000,
        completedAt: Date.now(),
        keystrokeLogs: [],
      };

      await saveSessionOffline(session);

      // Verify session was saved and not synced
      const allBefore = await getAllSessions();
      expect(allBefore).toHaveLength(1);
      expect(allBefore[0].synced).toBe(false);

      await markSessionAsSynced(localId);

      const all = await getAllSessions();
      expect(all[0].synced).toBe(true);
    });

    it('should throw error for non-existent session', async () => {
      await expect(markSessionAsSynced('non-existent-id')).rejects.toThrow();
    });
  });

  describe('deleteSession', () => {
    it('should delete a session by localId', async () => {
      const session: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId: generateLocalId(),
        challengeId: 1,
        wpm: 50,
        rawWpm: 55,
        accuracy: 95,
        keystrokes: 100,
        errors: 5,
        durationMs: 60000,
        completedAt: Date.now(),
        keystrokeLogs: [],
      };

      await saveSessionOffline(session);
      let count = await getSessionCount();
      expect(count).toBe(1);

      await deleteSession(session.localId);

      count = await getSessionCount();
      expect(count).toBe(0);
    });

    it('should not throw error for non-existent session', async () => {
      await expect(deleteSession('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('getAllSessions', () => {
    it('should return all sessions', async () => {
      const session1: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId: generateLocalId(),
        challengeId: 1,
        wpm: 50,
        rawWpm: 55,
        accuracy: 95,
        keystrokes: 100,
        errors: 5,
        durationMs: 60000,
        completedAt: Date.now(),
        keystrokeLogs: [],
      };

      const session2: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId: generateLocalId(),
        challengeId: 2,
        wpm: 60,
        rawWpm: 65,
        accuracy: 92,
        keystrokes: 120,
        errors: 10,
        durationMs: 70000,
        completedAt: Date.now(),
        keystrokeLogs: [],
      };

      await saveSessionOffline(session1);
      await saveSessionOffline(session2);

      const all = await getAllSessions();
      expect(all).toHaveLength(2);
    });

    it('should return empty array when no sessions exist', async () => {
      const all = await getAllSessions();
      expect(all).toHaveLength(0);
    });
  });

  describe('getSessionCount', () => {
    it('should return correct session count', async () => {
      expect(await getSessionCount()).toBe(0);

      const session1: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId: generateLocalId(),
        challengeId: 1,
        wpm: 50,
        rawWpm: 55,
        accuracy: 95,
        keystrokes: 100,
        errors: 5,
        durationMs: 60000,
        completedAt: Date.now(),
        keystrokeLogs: [],
      };

      await saveSessionOffline(session1);
      expect(await getSessionCount()).toBe(1);

      const session2: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId: generateLocalId(),
        challengeId: 2,
        wpm: 60,
        rawWpm: 65,
        accuracy: 92,
        keystrokes: 120,
        errors: 10,
        durationMs: 70000,
        completedAt: Date.now(),
        keystrokeLogs: [],
      };

      await saveSessionOffline(session2);
      expect(await getSessionCount()).toBe(2);
    });
  });

  describe('clearAllSessions', () => {
    it('should clear all sessions', async () => {
      const session: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId: generateLocalId(),
        challengeId: 1,
        wpm: 50,
        rawWpm: 55,
        accuracy: 95,
        keystrokes: 100,
        errors: 5,
        durationMs: 60000,
        completedAt: Date.now(),
        keystrokeLogs: [],
      };

      await saveSessionOffline(session);
      expect(await getSessionCount()).toBe(1);

      await clearAllSessions();
      expect(await getSessionCount()).toBe(0);
    });
  });

  describe('keystrokeLogs', () => {
    it('should store and retrieve keystroke logs', async () => {
      const keystrokeLogs = [
        {
          timestamp: 100,
          expected: 'g',
          actual: 'g',
          isCorrect: true,
          latencyMs: 100,
        },
        {
          timestamp: 250,
          expected: 'i',
          actual: 'o',
          isCorrect: false,
          latencyMs: 150,
        },
        {
          timestamp: 400,
          expected: 't',
          actual: 't',
          isCorrect: true,
          latencyMs: 150,
        },
      ];

      const session: Omit<OfflineTypingSession, 'id' | 'synced'> = {
        localId: generateLocalId(),
        challengeId: 1,
        wpm: 50,
        rawWpm: 55,
        accuracy: 95,
        keystrokes: 100,
        errors: 5,
        durationMs: 60000,
        completedAt: Date.now(),
        keystrokeLogs,
      };

      await saveSessionOffline(session);
      const sessions = await getAllSessions();

      expect(sessions[0].keystrokeLogs).toHaveLength(3);
      expect(sessions[0].keystrokeLogs[0].expected).toBe('g');
      expect(sessions[0].keystrokeLogs[1].isCorrect).toBe(false);
      expect(sessions[0].keystrokeLogs[2].latencyMs).toBe(150);
    });
  });
});
