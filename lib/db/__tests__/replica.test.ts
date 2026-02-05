import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readQuery, writeQuery, transaction } from '../replica';
import { getReadDb, getWriteDb } from '../drizzle';

// Mock the drizzle module
vi.mock('../drizzle', () => {
  const mockDb = {
    select: vi.fn(() => mockDb),
    from: vi.fn(() => mockDb),
    where: vi.fn(() => mockDb),
    insert: vi.fn(() => mockDb),
    update: vi.fn(() => mockDb),
    delete: vi.fn(() => mockDb),
    values: vi.fn(() => mockDb),
    execute: vi.fn(() => Promise.resolve([])),
    transaction: vi.fn((fn) => fn(mockDb)),
  };

  const mockReadDb = { ...mockDb };
  const mockWriteDb = { ...mockDb };

  return {
    db: mockDb,
    getReadDb: vi.fn(() => mockReadDb),
    getWriteDb: vi.fn(() => mockWriteDb),
  };
});

describe('Database Replica Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('readQuery', () => {
    it('should use read database for read operations', async () => {
      const mockQueryFn = vi.fn(async (db) => {
        return db.select();
      });

      await readQuery(mockQueryFn);

      expect(getReadDb).toHaveBeenCalled();
      expect(mockQueryFn).toHaveBeenCalled();
    });

    it('should return query results', async () => {
      const expectedResult = [{ id: 1, name: 'Test' }];
      const mockQueryFn = vi.fn(async () => expectedResult);

      const result = await readQuery(mockQueryFn);

      expect(result).toEqual(expectedResult);
    });

    it('should handle query errors', async () => {
      const mockError = new Error('Database error');
      const mockQueryFn = vi.fn(async () => {
        throw mockError;
      });

      await expect(readQuery(mockQueryFn)).rejects.toThrow('Database error');
    });
  });

  describe('writeQuery', () => {
    it('should use write database for write operations', async () => {
      const mockQueryFn = vi.fn(async (db) => {
        return db.insert();
      });

      await writeQuery(mockQueryFn);

      expect(getWriteDb).toHaveBeenCalled();
      expect(mockQueryFn).toHaveBeenCalled();
    });

    it('should return query results', async () => {
      const expectedResult = { id: 1 };
      const mockQueryFn = vi.fn(async () => expectedResult);

      const result = await writeQuery(mockQueryFn);

      expect(result).toEqual(expectedResult);
    });

    it('should handle write errors', async () => {
      const mockError = new Error('Write failed');
      const mockQueryFn = vi.fn(async () => {
        throw mockError;
      });

      await expect(writeQuery(mockQueryFn)).rejects.toThrow('Write failed');
    });
  });

  describe('transaction', () => {
    it('should use write database for transactions', async () => {
      const mockTransactionFn = vi.fn(async (tx) => {
        await tx.insert();
        return { success: true };
      });

      await transaction(mockTransactionFn);

      expect(getWriteDb).toHaveBeenCalled();
      const writeDb = getWriteDb();
      expect(writeDb.transaction).toHaveBeenCalled();
    });

    it('should return transaction results', async () => {
      const expectedResult = { id: 1, success: true };
      const mockTransactionFn = vi.fn(async () => expectedResult);

      const result = await transaction(mockTransactionFn);

      expect(result).toEqual(expectedResult);
    });

    it('should handle transaction errors', async () => {
      const mockError = new Error('Transaction failed');
      const mockTransactionFn = vi.fn(async () => {
        throw mockError;
      });

      await expect(transaction(mockTransactionFn)).rejects.toThrow(
        'Transaction failed'
      );
    });

    it('should pass transaction context to callback', async () => {
      const mockTransactionFn = vi.fn(async (tx) => {
        expect(tx).toBeDefined();
        expect(tx.insert).toBeDefined();
        return { success: true };
      });

      await transaction(mockTransactionFn);

      expect(mockTransactionFn).toHaveBeenCalled();
    });
  });
});
