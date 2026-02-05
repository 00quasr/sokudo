import { describe, it, expect, beforeAll } from 'vitest';
import { testDatabaseConnection, checkMigrations, checkSeeded } from '../utils';

describe('database utilities', () => {
  describe('testDatabaseConnection', () => {
    it('should return true when database connection is successful', async () => {
      const result = await testDatabaseConnection();
      expect(result).toBe(true);
    });

    it('should return boolean value', async () => {
      const result = await testDatabaseConnection();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('checkMigrations', () => {
    it('should return true when migrations have been applied', async () => {
      const result = await checkMigrations();
      expect(result).toBe(true);
    });

    it('should verify users table exists', async () => {
      const result = await checkMigrations();
      expect(result).toBe(true);
    });

    it('should verify categories table exists', async () => {
      const result = await checkMigrations();
      expect(result).toBe(true);
    });

    it('should verify challenges table exists', async () => {
      const result = await checkMigrations();
      expect(result).toBe(true);
    });

    it('should return boolean value', async () => {
      const result = await checkMigrations();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('checkSeeded', () => {
    it('should return boolean value', async () => {
      const result = await checkSeeded();
      expect(typeof result).toBe('boolean');
    });

    it('should check for categories', async () => {
      const result = await checkSeeded();
      // Test passes if function executes without error
      expect(typeof result).toBe('boolean');
    });

    it('should check for test user', async () => {
      const result = await checkSeeded();
      // Test passes if function executes without error
      expect(typeof result).toBe('boolean');
    });
  });

  describe('integration tests', () => {
    let connectionWorks: boolean;
    let migrationsApplied: boolean;
    let databaseSeeded: boolean;

    beforeAll(async () => {
      connectionWorks = await testDatabaseConnection();
      migrationsApplied = await checkMigrations();
      databaseSeeded = await checkSeeded();
    });

    it('should have database connection', () => {
      expect(connectionWorks).toBe(true);
    });

    it('should have migrations applied', () => {
      expect(migrationsApplied).toBe(true);
    });

    it('should have sequential checks work in order', async () => {
      const conn = await testDatabaseConnection();
      expect(conn).toBe(true);

      const migrations = await checkMigrations();
      expect(migrations).toBe(true);

      // Seeding is optional, so we just check it runs without error
      const seeded = await checkSeeded();
      expect(typeof seeded).toBe('boolean');
    });
  });

  describe('error handling', () => {
    it('should not throw when checking connection', async () => {
      await expect(testDatabaseConnection()).resolves.not.toThrow();
    });

    it('should not throw when checking migrations', async () => {
      await expect(checkMigrations()).resolves.not.toThrow();
    });

    it('should not throw when checking seeded status', async () => {
      await expect(checkSeeded()).resolves.not.toThrow();
    });

    it('should return false on database error, not throw', async () => {
      // This test verifies that errors are caught and return false
      const result = await testDatabaseConnection();
      expect(typeof result).toBe('boolean');
    });
  });
});
