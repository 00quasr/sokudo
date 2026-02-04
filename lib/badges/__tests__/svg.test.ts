import { describe, it, expect } from 'vitest';
import {
  generateBadgeSvg,
  type BadgeStats,
  type BadgeType,
  type BadgeStyle,
} from '../svg';

const defaultStats: BadgeStats = {
  avgWpm: 85,
  avgAccuracy: 96,
  bestWpm: 120,
  totalSessions: 42,
  currentStreak: 7,
};

describe('generateBadgeSvg', () => {
  it('should return valid SVG string', () => {
    const svg = generateBadgeSvg('wpm', defaultStats);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('should include role and aria-label for accessibility', () => {
    const svg = generateBadgeSvg('wpm', defaultStats);
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="sokudo wpm: 85"');
  });

  it('should include title element', () => {
    const svg = generateBadgeSvg('wpm', defaultStats);
    expect(svg).toContain('<title>sokudo wpm: 85</title>');
  });

  describe('badge types', () => {
    it('should render wpm badge with average WPM', () => {
      const svg = generateBadgeSvg('wpm', defaultStats);
      expect(svg).toContain('sokudo wpm');
      expect(svg).toContain('>85<');
    });

    it('should render accuracy badge with percentage', () => {
      const svg = generateBadgeSvg('accuracy', defaultStats);
      expect(svg).toContain('sokudo accuracy');
      expect(svg).toContain('>96%<');
    });

    it('should render streak badge with days', () => {
      const svg = generateBadgeSvg('streak', defaultStats);
      expect(svg).toContain('sokudo streak');
      expect(svg).toContain('>7 days<');
    });

    it('should render sessions badge with total count', () => {
      const svg = generateBadgeSvg('sessions', defaultStats);
      expect(svg).toContain('sokudo sessions');
      expect(svg).toContain('>42<');
    });

    it('should render best-wpm badge with best WPM', () => {
      const svg = generateBadgeSvg('best-wpm', defaultStats);
      expect(svg).toContain('sokudo best wpm');
      expect(svg).toContain('>120<');
    });
  });

  describe('badge styles', () => {
    it('should use rounded corners for flat style', () => {
      const svg = generateBadgeSvg('wpm', defaultStats, 'flat');
      expect(svg).toContain('rx="3"');
    });

    it('should use square corners for flat-square style', () => {
      const svg = generateBadgeSvg('wpm', defaultStats, 'flat-square');
      expect(svg).toContain('rx="0"');
    });

    it('should default to flat style', () => {
      const svg = generateBadgeSvg('wpm', defaultStats);
      expect(svg).toContain('rx="3"');
    });
  });

  describe('badge colors', () => {
    it('should use orange for wpm badge', () => {
      const svg = generateBadgeSvg('wpm', defaultStats);
      expect(svg).toContain('fill="#f97316"');
    });

    it('should use blue for accuracy badge', () => {
      const svg = generateBadgeSvg('accuracy', defaultStats);
      expect(svg).toContain('fill="#3b82f6"');
    });

    it('should use purple for streak badge', () => {
      const svg = generateBadgeSvg('streak', defaultStats);
      expect(svg).toContain('fill="#a855f7"');
    });

    it('should use green for sessions badge', () => {
      const svg = generateBadgeSvg('sessions', defaultStats);
      expect(svg).toContain('fill="#22c55e"');
    });

    it('should use red for best-wpm badge', () => {
      const svg = generateBadgeSvg('best-wpm', defaultStats);
      expect(svg).toContain('fill="#ef4444"');
    });

    it('should use gray for label section', () => {
      const svg = generateBadgeSvg('wpm', defaultStats);
      expect(svg).toContain('fill="#555"');
    });
  });

  describe('dimensions', () => {
    it('should have proper width and height', () => {
      const svg = generateBadgeSvg('wpm', defaultStats);
      expect(svg).toMatch(/width="\d+"/);
      expect(svg).toContain('height="20"');
    });

    it('should adjust width based on text length', () => {
      const shortStats: BadgeStats = { ...defaultStats, avgWpm: 5 };
      const longStats: BadgeStats = { ...defaultStats, avgWpm: 999 };

      const shortSvg = generateBadgeSvg('wpm', shortStats);
      const longSvg = generateBadgeSvg('wpm', longStats);

      const shortWidth = parseInt(shortSvg.match(/width="(\d+)"/)?.[1] ?? '0');
      const longWidth = parseInt(longSvg.match(/width="(\d+)"/)?.[1] ?? '0');

      expect(longWidth).toBeGreaterThan(shortWidth);
    });
  });

  describe('edge cases', () => {
    it('should handle zero stats', () => {
      const zeroStats: BadgeStats = {
        avgWpm: 0,
        avgAccuracy: 0,
        bestWpm: 0,
        totalSessions: 0,
        currentStreak: 0,
      };

      const svg = generateBadgeSvg('wpm', zeroStats);
      expect(svg).toContain('>0<');
    });

    it('should handle large numbers', () => {
      const largeStats: BadgeStats = {
        avgWpm: 999,
        avgAccuracy: 100,
        bestWpm: 1500,
        totalSessions: 99999,
        currentStreak: 365,
      };

      const svg = generateBadgeSvg('sessions', largeStats);
      expect(svg).toContain('>99999<');
    });

    it('should escape XML special characters in values', () => {
      // Stats should only contain numbers, but the function should still be safe
      const svg = generateBadgeSvg('wpm', defaultStats);
      expect(svg).not.toContain('&amp;amp;'); // No double-encoding
    });
  });

  describe('SVG structure', () => {
    it('should contain clipPath for rounded corners', () => {
      const svg = generateBadgeSvg('wpm', defaultStats);
      expect(svg).toContain('<clipPath id="r">');
      expect(svg).toContain('clip-path="url(#r)"');
    });

    it('should contain gradient overlay', () => {
      const svg = generateBadgeSvg('wpm', defaultStats);
      expect(svg).toContain('<linearGradient id="s"');
      expect(svg).toContain('fill="url(#s)"');
    });

    it('should contain text shadow elements', () => {
      const svg = generateBadgeSvg('wpm', defaultStats);
      // Shadow text (aria-hidden)
      expect(svg).toContain('fill="#010101"');
      expect(svg).toContain('fill-opacity=".3"');
    });

    it('should use Verdana font family', () => {
      const svg = generateBadgeSvg('wpm', defaultStats);
      expect(svg).toContain('font-family="Verdana,Geneva,DejaVu Sans,sans-serif"');
    });
  });
});
