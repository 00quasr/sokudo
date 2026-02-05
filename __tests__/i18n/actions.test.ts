import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setLocale, getLocale } from '@/lib/i18n/actions';
import { cookies } from 'next/headers';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn()
}));

describe('i18n actions', () => {
  let mockCookieStore: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockCookieStore = {
      get: vi.fn(),
      set: vi.fn()
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);
  });

  describe('setLocale', () => {
    it('should set locale cookie for valid locale', async () => {
      await setLocale('en');

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'NEXT_LOCALE',
        'en',
        expect.objectContaining({
          httpOnly: false,
          secure: true,
          sameSite: 'lax',
          maxAge: 31536000
        })
      );
    });

    it('should set Japanese locale', async () => {
      await setLocale('ja');

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'NEXT_LOCALE',
        'ja',
        expect.any(Object)
      );
    });

    it('should throw error for invalid locale', async () => {
      await expect(setLocale('invalid' as any)).rejects.toThrow('Invalid locale');
    });
  });

  describe('getLocale', () => {
    it('should return locale from cookie', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'ja' });

      const locale = await getLocale();

      expect(locale).toBe('ja');
      expect(mockCookieStore.get).toHaveBeenCalledWith('NEXT_LOCALE');
    });

    it('should return default locale when cookie is not set', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const locale = await getLocale();

      expect(locale).toBe('en');
    });

    it('should return default locale for invalid cookie value', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'invalid' });

      const locale = await getLocale();

      expect(locale).toBe('en');
    });
  });
});
