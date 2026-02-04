/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollectionBrowser } from '../collection-browser';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockInitialData = {
  collections: [
    {
      id: 1,
      name: 'Git Essentials',
      description: 'A collection of essential git commands',
      createdAt: '2025-01-15T00:00:00.000Z',
      authorName: 'Jane Dev',
      authorEmail: 'jane@dev.com',
      challengeCount: 5,
    },
    {
      id: 2,
      name: 'Docker Basics',
      description: null,
      createdAt: '2025-02-01T00:00:00.000Z',
      authorName: null,
      authorEmail: 'anon@test.com',
      challengeCount: 3,
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
  collections: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

describe('CollectionBrowser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    global.scrollTo = vi.fn();
  });

  it('should render collection list from initial data', () => {
    render(<CollectionBrowser initialData={mockInitialData} />);

    expect(screen.getByText('Git Essentials')).toBeDefined();
    expect(screen.getByText('Docker Basics')).toBeDefined();
    expect(screen.getByText('2 collections found')).toBeDefined();
  });

  it('should display author name when available', () => {
    render(<CollectionBrowser initialData={mockInitialData} />);

    expect(screen.getByText('Jane Dev')).toBeDefined();
  });

  it('should display email username when author name is null', () => {
    render(<CollectionBrowser initialData={mockInitialData} />);

    expect(screen.getByText('anon')).toBeDefined();
  });

  it('should display challenge count', () => {
    render(<CollectionBrowser initialData={mockInitialData} />);

    expect(screen.getByText('5 challenges')).toBeDefined();
    expect(screen.getByText('3 challenges')).toBeDefined();
  });

  it('should display description when available', () => {
    render(<CollectionBrowser initialData={mockInitialData} />);

    expect(screen.getByText('A collection of essential git commands')).toBeDefined();
  });

  it('should show empty state when no collections', () => {
    render(<CollectionBrowser initialData={emptyData} />);

    expect(screen.getByText('No collections found')).toBeDefined();
  });

  it('should show search-specific empty state message', async () => {
    render(<CollectionBrowser initialData={mockInitialData} />);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(emptyData),
    });

    const searchInput = screen.getByPlaceholderText('Search collections...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('No collections found')).toBeDefined();
      expect(screen.getByText('Clear Search')).toBeDefined();
    });
  });

  it('should have links to individual collection pages', () => {
    render(<CollectionBrowser initialData={mockInitialData} />);

    const links = screen.getAllByRole('link');
    const collectionLinks = links.filter(
      (link) => link.getAttribute('href')?.startsWith('/collections/')
    );
    expect(collectionLinks).toHaveLength(2);
    expect(collectionLinks[0].getAttribute('href')).toBe('/collections/1');
    expect(collectionLinks[1].getAttribute('href')).toBe('/collections/2');
  });

  it('should have sort buttons', () => {
    render(<CollectionBrowser initialData={mockInitialData} />);

    expect(screen.getByText('Newest')).toBeDefined();
    expect(screen.getByText('Most Challenges')).toBeDefined();
    expect(screen.getByText('Name')).toBeDefined();
  });

  it('should fetch with sort parameter when sort button clicked', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockInitialData),
    });

    render(<CollectionBrowser initialData={mockInitialData} />);

    const mostChallengesButton = screen.getByText('Most Challenges');
    fireEvent.click(mostChallengesButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sortBy=challengeCount')
      );
    });
  });

  it('should not show pagination when only one page', () => {
    render(<CollectionBrowser initialData={mockInitialData} />);

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

    render(<CollectionBrowser initialData={multiPageData} />);

    expect(screen.getByText('Previous')).toBeDefined();
    expect(screen.getByText('Next')).toBeDefined();
    expect(screen.getByText('Page 1 of 2')).toBeDefined();
  });
});
