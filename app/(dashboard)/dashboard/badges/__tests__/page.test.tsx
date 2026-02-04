/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock SWR
const mockSWRData: Record<string, unknown> = {};
vi.mock('swr', () => ({
  default: vi.fn((key: string) => ({ data: mockSWRData[key] })),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  usePathname: vi.fn(() => '/dashboard/badges'),
}));

import BadgesPage from '../page';

describe('BadgesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockSWRData).forEach((key) => delete mockSWRData[key]);
  });

  it('should show loading state when user not loaded', () => {
    render(<BadgesPage />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('should show username prompt when user has no username', () => {
    mockSWRData['/api/user'] = {
      id: 1,
      email: 'test@test.com',
      username: null,
    };

    render(<BadgesPage />);
    expect(screen.getByText(/Set a username/)).toBeTruthy();
    expect(screen.getByText('General settings')).toBeTruthy();
  });

  it('should render page title', () => {
    mockSWRData['/api/user'] = {
      id: 1,
      email: 'test@test.com',
      username: 'testuser',
    };

    render(<BadgesPage />);
    expect(screen.getByText('README Badges')).toBeTruthy();
  });

  it('should render description text', () => {
    mockSWRData['/api/user'] = {
      id: 1,
      email: 'test@test.com',
      username: 'testuser',
    };

    render(<BadgesPage />);
    expect(
      screen.getByText(/Add dynamic typing stats badges/)
    ).toBeTruthy();
  });

  it('should render badge style selector', () => {
    mockSWRData['/api/user'] = {
      id: 1,
      email: 'test@test.com',
      username: 'testuser',
    };

    render(<BadgesPage />);
    expect(screen.getByText('Badge Style')).toBeTruthy();
    expect(screen.getByText('Flat')).toBeTruthy();
    expect(screen.getByText('Flat Square')).toBeTruthy();
  });

  it('should render all badge type sections', () => {
    mockSWRData['/api/user'] = {
      id: 1,
      email: 'test@test.com',
      username: 'testuser',
    };

    render(<BadgesPage />);
    expect(screen.getByText('Average WPM')).toBeTruthy();
    expect(screen.getByText('Best WPM')).toBeTruthy();
    expect(screen.getByText('Accuracy')).toBeTruthy();
    expect(screen.getByText('Streak')).toBeTruthy();
    expect(screen.getByText('Sessions')).toBeTruthy();
  });

  it('should render All Badges section', () => {
    mockSWRData['/api/user'] = {
      id: 1,
      email: 'test@test.com',
      username: 'testuser',
    };

    render(<BadgesPage />);
    expect(screen.getByText('All Badges')).toBeTruthy();
  });

  it('should render markdown snippets with username', () => {
    mockSWRData['/api/user'] = {
      id: 1,
      email: 'test@test.com',
      username: 'testuser',
    };

    render(<BadgesPage />);
    const markdownElements = screen.getAllByText(/Markdown/);
    expect(markdownElements.length).toBeGreaterThan(0);

    // Check that rendered markdown contains the username
    const preElements = document.querySelectorAll('pre');
    const hasUsername = Array.from(preElements).some((el) =>
      el.textContent?.includes('testuser')
    );
    expect(hasUsername).toBe(true);
  });

  it('should render HTML snippets', () => {
    mockSWRData['/api/user'] = {
      id: 1,
      email: 'test@test.com',
      username: 'testuser',
    };

    render(<BadgesPage />);
    const htmlElements = screen.getAllByText(/HTML/);
    expect(htmlElements.length).toBeGreaterThan(0);
  });

  it('should render badge images', () => {
    mockSWRData['/api/user'] = {
      id: 1,
      email: 'test@test.com',
      username: 'testuser',
    };

    render(<BadgesPage />);
    const images = document.querySelectorAll('img');
    // 5 in the "All Badges" section + 5 individual previews = 10
    expect(images.length).toBe(10);
  });

  it('should include badge URLs with correct parameters', () => {
    mockSWRData['/api/user'] = {
      id: 1,
      email: 'test@test.com',
      username: 'testuser',
    };

    render(<BadgesPage />);
    const images = document.querySelectorAll('img');
    const srcs = Array.from(images).map((img) => img.getAttribute('src'));

    expect(srcs.some((src) => src?.includes('type=wpm'))).toBe(true);
    expect(srcs.some((src) => src?.includes('type=accuracy'))).toBe(true);
    expect(srcs.some((src) => src?.includes('type=streak'))).toBe(true);
    expect(srcs.some((src) => src?.includes('type=sessions'))).toBe(true);
    expect(srcs.some((src) => src?.includes('type=best-wpm'))).toBe(true);
  });

  it('should render copy buttons', () => {
    mockSWRData['/api/user'] = {
      id: 1,
      email: 'test@test.com',
      username: 'testuser',
    };

    render(<BadgesPage />);
    const copyButtons = screen.getAllByText('Copy');
    // All Badges (1 markdown) + 5 types * 2 (markdown + HTML) = 11
    expect(copyButtons.length).toBe(11);
  });
});
