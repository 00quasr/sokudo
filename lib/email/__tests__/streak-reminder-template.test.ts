import { describe, it, expect } from 'vitest';
import { generateStreakReminderEmail } from '../templates/streak-reminder';
import type { StreakReminderData } from '@/lib/reports/types';

describe('generateStreakReminderEmail', () => {
  const baseData: StreakReminderData = {
    userId: 1,
    userEmail: 'test@example.com',
    userName: 'John Doe',
    currentStreak: 5,
    longestStreak: 10,
    lastPracticeDate: '2024-01-06',
  };

  describe('subject line', () => {
    it('should include current streak count', () => {
      const { subject } = generateStreakReminderEmail(baseData);
      expect(subject).toBe('Your 5-day streak is at risk!');
    });

    it('should reflect different streak values', () => {
      const data: StreakReminderData = { ...baseData, currentStreak: 30 };
      const { subject } = generateStreakReminderEmail(data);
      expect(subject).toBe('Your 30-day streak is at risk!');
    });

    it('should handle a 1-day streak', () => {
      const data: StreakReminderData = { ...baseData, currentStreak: 1 };
      const { subject } = generateStreakReminderEmail(data);
      expect(subject).toBe('Your 1-day streak is at risk!');
    });
  });

  describe('HTML content', () => {
    it('should include user name in greeting', () => {
      const { html } = generateStreakReminderEmail(baseData);
      expect(html).toContain('Hey John Doe');
    });

    it('should show "there" when user name is null', () => {
      const data: StreakReminderData = { ...baseData, userName: null };
      const { html } = generateStreakReminderEmail(data);
      expect(html).toContain('Hey there');
    });

    it('should display current streak number', () => {
      const { html } = generateStreakReminderEmail(baseData);
      expect(html).toContain('Current Streak');
      expect(html).toMatch(/font-size:\s*48px[^>]*>\s*5\s*</);
    });

    it('should include Practice Now CTA', () => {
      const { html } = generateStreakReminderEmail(baseData);
      expect(html).toContain('Practice Now');
    });

    it('should include email preferences link', () => {
      const { html } = generateStreakReminderEmail(baseData);
      expect(html).toContain('Manage email preferences');
    });

    it('should mention streak reminders in footer', () => {
      const { html } = generateStreakReminderEmail(baseData);
      expect(html).toContain('streak reminders enabled');
    });

    it('should include Sokudo Streak Alert header', () => {
      const { html } = generateStreakReminderEmail(baseData);
      expect(html).toContain('Sokudo');
      expect(html).toContain('Streak Alert');
    });
  });

  describe('motivational messaging', () => {
    it('should use short-streak message for streaks under 7 days', () => {
      const data: StreakReminderData = { ...baseData, currentStreak: 3 };
      const { html } = generateStreakReminderEmail(data);
      expect(html).toContain('Keep the momentum going');
    });

    it('should use impressive message for streaks of 7+ days', () => {
      const data: StreakReminderData = { ...baseData, currentStreak: 14 };
      const { html } = generateStreakReminderEmail(data);
      expect(html).toContain('impressive');
    });

    it('should encourage beating longest streak when current < longest', () => {
      const data: StreakReminderData = {
        ...baseData,
        currentStreak: 5,
        longestStreak: 10,
      };
      const { html } = generateStreakReminderEmail(data);
      expect(html).toContain('10 days');
      expect(html).toContain('you can beat it');
    });

    it('should celebrate when current streak equals longest streak', () => {
      const data: StreakReminderData = {
        ...baseData,
        currentStreak: 10,
        longestStreak: 10,
      };
      const { html } = generateStreakReminderEmail(data);
      expect(html).toContain('longest streak ever');
    });
  });

  describe('HTML structure', () => {
    it('should be valid HTML with doctype', () => {
      const { html } = generateStreakReminderEmail(baseData);
      expect(html).toMatch(/^<!DOCTYPE html>/);
    });

    it('should include dark mode background color', () => {
      const { html } = generateStreakReminderEmail(baseData);
      expect(html).toContain('#0a0a0b');
    });

    it('should use monospace fonts for streak display', () => {
      const { html } = generateStreakReminderEmail(baseData);
      expect(html).toContain('SF Mono');
      expect(html).toContain('Monaco');
    });
  });
});
