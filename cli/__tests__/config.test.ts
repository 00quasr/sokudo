import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Config } from '../lib/config';

describe('Config', () => {
  let originalApiKey: string | undefined;

  beforeEach(() => {
    // Save current state
    const config = Config.load();
    originalApiKey = config.apiKey;
  });

  afterEach(() => {
    // Restore original state
    if (originalApiKey) {
      Config.save({
        apiKey: originalApiKey,
        baseUrl: 'http://localhost:3000',
      });
    } else {
      Config.clear();
    }
  });

  it('should return default config', () => {
    const config = Config.load();
    expect(config.baseUrl).toBeDefined();
  });

  it('should save and load config', () => {
    const testConfig = {
      apiKey: 'test-api-key-12345',
      baseUrl: 'https://sokudo.example.com',
      userId: 999,
      email: 'testcli@example.com',
    };

    Config.save(testConfig);
    const loaded = Config.load();

    expect(loaded.apiKey).toBe(testConfig.apiKey);
    expect(loaded.baseUrl).toBe(testConfig.baseUrl);
    expect(loaded.userId).toBe(testConfig.userId);
    expect(loaded.email).toBe(testConfig.email);

    // Cleanup
    Config.clear();
  });

  it('should check if user is authenticated', () => {
    Config.clear();
    expect(Config.isAuthenticated()).toBe(false);

    Config.save({
      apiKey: 'test-key-auth',
      baseUrl: 'http://localhost:3000',
    });

    expect(Config.isAuthenticated()).toBe(true);

    // Cleanup
    Config.clear();
  });

  it('should clear authentication', () => {
    Config.save({
      apiKey: 'test-key-clear',
      baseUrl: 'http://localhost:3000',
      userId: 1,
      email: 'test@test.com',
    });

    Config.clear();
    const config = Config.load();

    expect(config.apiKey).toBeUndefined();
    expect(config.userId).toBeUndefined();
    expect(config.email).toBeUndefined();
  });

  it('should save and load offline sessions', () => {
    Config.clearOfflineSessions();

    const session = {
      challengeId: 1,
      stats: {
        wpm: 50,
        rawWpm: 55,
        accuracy: 95,
        keystrokes: 100,
        errors: 5,
        durationMs: 10000,
      },
      timestamp: Date.now(),
    };

    Config.saveOfflineSession(session);
    const sessions = Config.getOfflineSessions();

    expect(sessions.length).toBeGreaterThanOrEqual(1);
    const found = sessions.find(s => s.challengeId === 1 && s.stats.wpm === 50);
    expect(found).toBeDefined();

    // Cleanup
    Config.clearOfflineSessions();
  });

  it('should clear offline sessions', () => {
    Config.saveOfflineSession({
      challengeId: 999,
      stats: { wpm: 50, rawWpm: 55, accuracy: 95, keystrokes: 100, errors: 5, durationMs: 10000 },
      timestamp: Date.now(),
    });

    Config.clearOfflineSessions();
    const sessions = Config.getOfflineSessions();

    expect(sessions).toHaveLength(0);
  });
});
