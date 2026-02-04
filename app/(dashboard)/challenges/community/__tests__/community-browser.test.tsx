/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommunityBrowser } from '../community-browser';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockInitialData = {
  challenges: [
    {
      id: 1,
      name: 'Git Rebase Workflow',
      content: 'git checkout main && git pull origin main && git rebase main feature-branch',
      timesCompleted: 12,
      createdAt: '2025-01-15T00:00:00.000Z',
      authorName: 'Jane Dev',
      authorEmail: 'jane@dev.com',
    },
    {
      id: 2,
      name: 'Docker Build',
      content: 'docker build -t myapp:latest .',
      timesCompleted: 0,
      createdAt: '2025-02-01T00:00:00.000Z',
      authorName: null,
      authorEmail: 'anon@test.com',
    },
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 2,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

const emptyData = {
  challenges: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

describe('CommunityBrowser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    global.scrollTo = vi.fn();
  });

  it('should render challenge list from initial data', () => {
    render(<CommunityBrowser initialData={mockInitialData} />);

    expect(screen.getByText('Git Rebase Workflow')).toBeDefined();
    expect(screen.getByText('Docker Build')).toBeDefined();
    expect(screen.getByText('2 challenges found')).toBeDefined();
  });

  it('should display author name when available', () => {
    render(<CommunityBrowser initialData={mockInitialData} />);

    expect(screen.getByText('Jane Dev')).toBeDefined();
  });

  it('should display email username when author name is null', () => {
    render(<CommunityBrowser initialData={mockInitialData} />);

    expect(screen.getByText('anon')).toBeDefined();
  });

  it('should show times completed for challenges with completions', () => {
    render(<CommunityBrowser initialData={mockInitialData} />);

    expect(screen.getByText('Practiced 12 times')).toBeDefined();
  });

  it('should show empty state when no challenges', () => {
    render(<CommunityBrowser initialData={emptyData} />);

    expect(screen.getByText('No community challenges found')).toBeDefined();
  });

  it('should show search-specific empty state message', async () => {
    render(<CommunityBrowser initialData={mockInitialData} />);

    // Simulate search with no results
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(emptyData),
    });

    const searchInput = screen.getByPlaceholderText('Search challenges...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('No community challenges found')).toBeDefined();
      expect(screen.getByText('Clear Search')).toBeDefined();
    });
  });

  it('should have links to individual challenge pages', () => {
    render(<CommunityBrowser initialData={mockInitialData} />);

    const links = screen.getAllByRole('link');
    const challengeLinks = links.filter(
      (link) => link.getAttribute('href')?.startsWith('/challenges/community/')
    );
    expect(challengeLinks).toHaveLength(2);
    expect(challengeLinks[0].getAttribute('href')).toBe('/challenges/community/1');
    expect(challengeLinks[1].getAttribute('href')).toBe('/challenges/community/2');
  });

  it('should display char count for challenges', () => {
    render(<CommunityBrowser initialData={mockInitialData} />);

    const content1 = 'git checkout main && git pull origin main && git rebase main feature-branch';
    expect(screen.getByText(`${content1.length} chars`)).toBeDefined();
  });

  it('should have sort buttons', () => {
    render(<CommunityBrowser initialData={mockInitialData} />);

    expect(screen.getByText('Newest')).toBeDefined();
    expect(screen.getByText('Most Practiced')).toBeDefined();
    expect(screen.getByText('Name')).toBeDefined();
  });

  it('should fetch with sort parameter when sort button clicked', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockInitialData),
    });

    render(<CommunityBrowser initialData={mockInitialData} />);

    const mostPracticedButton = screen.getByText('Most Practiced');
    fireEvent.click(mostPracticedButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sortBy=timesCompleted')
      );
    });
  });

  it('should not show pagination when only one page', () => {
    render(<CommunityBrowser initialData={mockInitialData} />);

    expect(screen.queryByText('Previous')).toBeNull();
    expect(screen.queryByText('Next')).toBeNull();
  });

  it('should show pagination when multiple pages', () => {
    const multiPageData = {
      ...mockInitialData,
      pagination: {
        ...mockInitialData.pagination,
        total: 40,
        totalPages: 2,
        hasNextPage: true,
      },
    };

    render(<CommunityBrowser initialData={multiPageData} />);

    expect(screen.getByText('Previous')).toBeDefined();
    expect(screen.getByText('Next')).toBeDefined();
    expect(screen.getByText('Page 1 of 2')).toBeDefined();
  });
});
