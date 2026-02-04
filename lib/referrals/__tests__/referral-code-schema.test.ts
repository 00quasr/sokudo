import { describe, it, expect } from 'vitest';
import { users } from '@/lib/db/schema';

describe('users.referralCode schema', () => {
  it('should have referralCode column on users table', () => {
    const columnNames = Object.keys(users);
    expect(columnNames).toContain('referralCode');
  });

  it('should allow null referralCode (not required)', () => {
    // referralCode is nullable - generated on demand, not required at signup
    expect(users.referralCode.notNull).toBe(false);
  });

  it('should have a max length of 12', () => {
    const config = users.referralCode.config as { length?: number };
    expect(config.length).toBe(12);
  });
});
