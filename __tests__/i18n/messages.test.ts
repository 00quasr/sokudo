import { describe, it, expect } from 'vitest';
import enMessages from '@/messages/en.json';
import jaMessages from '@/messages/ja.json';

describe('i18n messages', () => {
  describe('English messages', () => {
    it('should have all required sections', () => {
      expect(enMessages.common).toBeDefined();
      expect(enMessages.nav).toBeDefined();
      expect(enMessages.auth).toBeDefined();
      expect(enMessages.home).toBeDefined();
      expect(enMessages.practice).toBeDefined();
      expect(enMessages.dashboard).toBeDefined();
      expect(enMessages.settings).toBeDefined();
      expect(enMessages.pricing).toBeDefined();
      expect(enMessages.metadata).toBeDefined();
    });

    it('should have common translations', () => {
      expect(enMessages.common.loading).toBe('Loading...');
      expect(enMessages.common.error).toBe('Error');
      expect(enMessages.common.success).toBe('Success');
    });

    it('should have navigation translations', () => {
      expect(enMessages.nav.dashboard).toBe('Dashboard');
      expect(enMessages.nav.practice).toBe('Practice');
      expect(enMessages.nav.settings).toBe('Settings');
    });

    it('should have auth translations', () => {
      expect(enMessages.auth.signIn).toBe('Sign In');
      expect(enMessages.auth.signUp).toBe('Sign Up');
      expect(enMessages.auth.email).toBe('Email');
    });
  });

  describe('Japanese messages', () => {
    it('should have all required sections', () => {
      expect(jaMessages.common).toBeDefined();
      expect(jaMessages.nav).toBeDefined();
      expect(jaMessages.auth).toBeDefined();
      expect(jaMessages.home).toBeDefined();
      expect(jaMessages.practice).toBeDefined();
      expect(jaMessages.dashboard).toBeDefined();
      expect(jaMessages.settings).toBeDefined();
      expect(jaMessages.pricing).toBeDefined();
      expect(jaMessages.metadata).toBeDefined();
    });

    it('should have common translations in Japanese', () => {
      expect(jaMessages.common.loading).toBe('読み込み中...');
      expect(jaMessages.common.error).toBe('エラー');
      expect(jaMessages.common.success).toBe('成功');
    });

    it('should have navigation translations in Japanese', () => {
      expect(jaMessages.nav.dashboard).toBe('ダッシュボード');
      expect(jaMessages.nav.practice).toBe('練習');
      expect(jaMessages.nav.settings).toBe('設定');
    });
  });

  describe('Message structure consistency', () => {
    it('should have the same structure in all locales', () => {
      const enKeys = Object.keys(enMessages);
      const jaKeys = Object.keys(jaMessages);

      expect(enKeys.sort()).toEqual(jaKeys.sort());
    });

    it('should have matching keys in common section', () => {
      const enCommonKeys = Object.keys(enMessages.common);
      const jaCommonKeys = Object.keys(jaMessages.common);

      expect(enCommonKeys.sort()).toEqual(jaCommonKeys.sort());
    });

    it('should have matching keys in nav section', () => {
      const enNavKeys = Object.keys(enMessages.nav);
      const jaNavKeys = Object.keys(jaMessages.nav);

      expect(enNavKeys.sort()).toEqual(jaNavKeys.sort());
    });

    it('should have matching keys in auth section', () => {
      const enAuthKeys = Object.keys(enMessages.auth);
      const jaAuthKeys = Object.keys(jaMessages.auth);

      expect(enAuthKeys.sort()).toEqual(jaAuthKeys.sort());
    });
  });
});
