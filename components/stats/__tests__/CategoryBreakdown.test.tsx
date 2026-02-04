/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CategoryBreakdownSection } from '../CategoryBreakdown';
import type { CategoryBreakdown } from '@/lib/db/queries';

const mockFullBreakdown: CategoryBreakdown = {
  best: {
    byWpm: { categoryId: 1, categoryName: 'Git Basics', avgWpm: 70, sessions: 15 },
    byAccuracy: { categoryId: 1, categoryName: 'Git Basics', avgAccuracy: 95, sessions: 15 },
  },
  worst: {
    byWpm: { categoryId: 2, categoryName: 'Docker', avgWpm: 55, sessions: 10 },
    byAccuracy: { categoryId: 2, categoryName: 'Docker', avgAccuracy: 90, sessions: 10 },
  },
};

const mockSingleCategoryBreakdown: CategoryBreakdown = {
  best: {
    byWpm: { categoryId: 1, categoryName: 'Git Basics', avgWpm: 70, sessions: 15 },
    byAccuracy: { categoryId: 1, categoryName: 'Git Basics', avgAccuracy: 95, sessions: 15 },
  },
  worst: { byWpm: null, byAccuracy: null },
};

const mockEmptyBreakdown: CategoryBreakdown = {
  best: { byWpm: null, byAccuracy: null },
  worst: { byWpm: null, byAccuracy: null },
};

describe('CategoryBreakdownSection', () => {
  describe('rendering', () => {
    it('should render best categories section', () => {
      render(<CategoryBreakdownSection data={mockFullBreakdown} />);
      expect(screen.getByText('Best Categories')).toBeTruthy();
    });

    it('should render needs improvement section when worst data exists', () => {
      render(<CategoryBreakdownSection data={mockFullBreakdown} />);
      expect(screen.getByText('Needs Improvement')).toBeTruthy();
    });

    it('should not render when no data', () => {
      const { container } = render(<CategoryBreakdownSection data={mockEmptyBreakdown} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('best categories', () => {
    it('should display fastest category by WPM', () => {
      render(<CategoryBreakdownSection data={mockFullBreakdown} />);
      expect(screen.getByText('Fastest (WPM)')).toBeTruthy();
      expect(screen.getByText('70 WPM')).toBeTruthy();
    });

    it('should display most accurate category', () => {
      render(<CategoryBreakdownSection data={mockFullBreakdown} />);
      expect(screen.getByText('Most Accurate')).toBeTruthy();
    });

    it('should display session count for best WPM category', () => {
      render(<CategoryBreakdownSection data={mockFullBreakdown} />);
      const sessionElements = screen.getAllByText('15 sessions');
      expect(sessionElements.length).toBeGreaterThan(0);
    });
  });

  describe('worst categories', () => {
    it('should display slowest category by WPM', () => {
      render(<CategoryBreakdownSection data={mockFullBreakdown} />);
      expect(screen.getByText('Slowest (WPM)')).toBeTruthy();
      expect(screen.getByText('55 WPM')).toBeTruthy();
    });

    it('should display least accurate category', () => {
      render(<CategoryBreakdownSection data={mockFullBreakdown} />);
      expect(screen.getByText('Least Accurate')).toBeTruthy();
    });

    it('should display session count for worst category', () => {
      render(<CategoryBreakdownSection data={mockFullBreakdown} />);
      const sessionElements = screen.getAllByText('10 sessions');
      expect(sessionElements.length).toBeGreaterThan(0);
    });
  });

  describe('single category', () => {
    it('should not show needs improvement with only one category', () => {
      render(<CategoryBreakdownSection data={mockSingleCategoryBreakdown} />);
      expect(screen.getByText('Best Categories')).toBeTruthy();
      expect(screen.queryByText('Needs Improvement')).toBeNull();
    });

    it('should still show best categories with single category', () => {
      render(<CategoryBreakdownSection data={mockSingleCategoryBreakdown} />);
      expect(screen.getByText('Fastest (WPM)')).toBeTruthy();
      expect(screen.getByText('Most Accurate')).toBeTruthy();
    });
  });

  describe('session count formatting', () => {
    it('should use singular form for 1 session', () => {
      const singleSessionData: CategoryBreakdown = {
        best: {
          byWpm: { categoryId: 1, categoryName: 'Git Basics', avgWpm: 70, sessions: 1 },
          byAccuracy: { categoryId: 1, categoryName: 'Git Basics', avgAccuracy: 95, sessions: 1 },
        },
        worst: { byWpm: null, byAccuracy: null },
      };
      render(<CategoryBreakdownSection data={singleSessionData} />);
      const sessionElements = screen.getAllByText('1 session');
      expect(sessionElements.length).toBeGreaterThan(0);
    });

    it('should use plural form for multiple sessions', () => {
      render(<CategoryBreakdownSection data={mockFullBreakdown} />);
      const sessionElements = screen.getAllByText(/\d+ sessions/);
      expect(sessionElements.length).toBeGreaterThan(0);
    });
  });
});
