import { describe, it, expect } from 'vitest';
import { generateReferralCode } from '../generate-code';

describe('generateReferralCode', () => {
  it('should generate a code of length 8', () => {
    const code = generateReferralCode();
    expect(code).toHaveLength(8);
  });

  it('should only contain unambiguous characters', () => {
    const validChars = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;
    for (let i = 0; i < 100; i++) {
      const code = generateReferralCode();
      expect(code).toMatch(validChars);
    }
  });

  it('should not contain ambiguous characters (I, O, 0, 1)', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateReferralCode();
      expect(code).not.toMatch(/[IO01]/);
    }
  });

  it('should generate unique codes across multiple calls', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      codes.add(generateReferralCode());
    }
    // With 8 chars from 32-char alphabet, collision in 1000 should be extremely unlikely
    expect(codes.size).toBe(1000);
  });

  it('should generate uppercase codes', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateReferralCode();
      expect(code).toBe(code.toUpperCase());
    }
  });
});
