import crypto from 'crypto';

const REFERRAL_CODE_LENGTH = 8;
const REFERRAL_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion

/**
 * Generates a cryptographically random referral code.
 * Uses an unambiguous character set (no I/O/0/1).
 */
export function generateReferralCode(): string {
  const bytes = crypto.randomBytes(REFERRAL_CODE_LENGTH);
  let code = '';
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += REFERRAL_CODE_CHARS[bytes[i] % REFERRAL_CODE_CHARS.length];
  }
  return code;
}
