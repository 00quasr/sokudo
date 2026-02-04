/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChallengeSearch } from '../challenge-search';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockCategories = [
  { slug: 'git-basics', name: 'Git Basics', icon: 'git-branch' },
  { slug: 'docker', name: 'Docker', icon: 'container' },
  { slug: 'terminal-commands', name: 'Terminal Commands', icon: 'terminal' },
];

const mockInitialData = {
  challenges: [
    {
      id: 1,
      content: 'git commit -m "initial commit"',
      difficulty: 'beginner',
      syntaxType: 'bash',
      hint: 'Stage your changes first with git add',
      avgWpm: 45,
      timesCompleted: 25,
      createdAt: '2025-01-15T00:00:00.000Z',
      categoryId: 1,
      categoryName: 'Git Basics',
      categorySlug: 'git-basics',
      categoryIcon: 'git-branch',
    },
    {
      id: 2,
      content: 'docker build -t myapp:latest .',
      difficulty: 'advanced',
      syntaxType: 'bash',
      hint: null,
      avgWpm: 30,
      timesCompleted: 0,
      createdAt: '2025-02-01T00:00:00.000Z',
      categoryId: 2,
      categoryName: 'Docker',
      categorySlug: 'docker',
      categoryIcon: 'container',
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
  categories: mockCategories,
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
  categories: mockCategories,
};

describe('ChallengeSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    global.scrollTo = vi.fn();
  });

  it('should render challenge list from initial data', () => {
    render(<ChallengeSearch initialData={mockInitialData} />);

    // "Git Basics" and "Docker" appear in both filter buttons and result rows
    const gitBasicsElements = screen.getAllByText('Git Basics');
    expect(gitBasicsElements.length).toBeGreaterThanOrEqual(2); // filter + result
    const dockerElements = screen.getAllByText('Docker');
    expect(dockerElements.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('2 challenges found')).toBeDefined();
  });

  it('should display difficulty badges', () => {
    render(<ChallengeSearch initialData={mockInitialData} />);

    // Difficulty badges in challenge rows
    const beginnerBadges = screen.getAllByText('beginner');
    expect(beginnerBadges.length).toBeGreaterThan(0);
  });

  it('should display category filter buttons', () => {
    render(<ChallengeSearch initialData={mockInitialData} />);

    expect(screen.getByText('All Categories')).toBeDefined();
    // These categories appear in both filter buttons and result rows
    expect(screen.getAllByText('Git Basics').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Docker').length).toBeGreaterThanOrEqual(1);
    // Terminal Commands only appears in filter (no challenge results for it)
    expect(screen.getByText('Terminal Commands')).toBeDefined();
  });

  it('should display difficulty filter buttons', () => {
    render(<ChallengeSearch initialData={mockInitialData} />);

    expect(screen.getByText('Beginner')).toBeDefined();
    expect(screen.getByText('Intermediate')).toBeDefined();
    expect(screen.getByText('Advanced')).toBeDefined();
  });

  it('should display sort buttons', () => {
    render(<ChallengeSearch initialData={mockInitialData} />);

    expect(screen.getByText('Popular')).toBeDefined();
    expect(screen.getByText('Avg WPM')).toBeDefined();
    expect(screen.getByText('Newest')).toBeDefined();
  });

  it('should show char count for challenges', () => {
    render(<ChallengeSearch initialData={mockInitialData} />);

    const content1 = 'git commit -m "initial commit"';
    const charElements = screen.getAllByText(`${content1.length} chars`);
    expect(charElements.length).toBeGreaterThanOrEqual(1);
  });

  it('should show times completed for practiced challenges', () => {
    render(<ChallengeSearch initialData={mockInitialData} />);

    expect(screen.getByText('Practiced 25 times')).toBeDefined();
  });

  it('should show avg WPM for challenges with stats', () => {
    render(<ChallengeSearch initialData={mockInitialData} />);

    expect(screen.getByText('Avg 45 WPM')).toBeDefined();
  });

  it('should show empty state when no challenges', () => {
    render(<ChallengeSearch initialData={emptyData} />);

    expect(screen.getByText('No challenges found')).toBeDefined();
  });

  it('should fetch with category filter when category button clicked', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockInitialData),
    });

    render(<ChallengeSearch initialData={mockInitialData} />);

    // Click the "Git Basics" category button (the one in filters, not in results)
    const categoryButtons = screen.getAllByText('Git Basics');
    // The first one is the filter button
    fireEvent.click(categoryButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('category=git-basics')
      );
    });
  });

  it('should fetch with difficulty filter when difficulty button clicked', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockInitialData),
    });

    render(<ChallengeSearch initialData={mockInitialData} />);

    fireEvent.click(screen.getByText('Beginner'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('difficulty=beginner')
      );
    });
  });

  it('should toggle difficulty filter off when clicked again', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockInitialData),
    });

    render(<ChallengeSearch initialData={mockInitialData} />);

    // Click beginner to activate
    fireEvent.click(screen.getByText('Beginner'));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockInitialData),
    });

    // Click beginner again to deactivate
    fireEvent.click(screen.getByText('Beginner'));
    await waitFor(() => {
      const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).not.toContain('difficulty=');
    });
  });

  it('should fetch with sort parameter when sort button clicked', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockInitialData),
    });

    render(<ChallengeSearch initialData={mockInitialData} />);

    fireEvent.click(screen.getByText('Newest'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sortBy=createdAt')
      );
    });
  });

  it('should fetch with search term on form submit', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockInitialData),
    });

    render(<ChallengeSearch initialData={mockInitialData} />);

    const searchInput = screen.getByPlaceholderText('Search challenges by content or hint...');
    fireEvent.change(searchInput, { target: { value: 'git commit' } });

    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=git+commit')
      );
    });
  });

  it('should show clear filters button when filters are active', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockInitialData),
    });

    render(<ChallengeSearch initialData={mockInitialData} />);

    // Activate a filter
    fireEvent.click(screen.getByText('Beginner'));

    await waitFor(() => {
      expect(screen.getByText('Clear all')).toBeDefined();
    });
  });

  it('should have links to practice pages', () => {
    render(<ChallengeSearch initialData={mockInitialData} />);

    const links = screen.getAllByRole('link');
    const practiceLinks = links.filter(
      (link) => link.getAttribute('href')?.startsWith('/practice/')
    );
    expect(practiceLinks.length).toBeGreaterThanOrEqual(2);
    expect(practiceLinks[0].getAttribute('href')).toBe('/practice/git-basics/1');
    expect(practiceLinks[1].getAttribute('href')).toBe('/practice/docker/2');
  });

  it('should not show pagination when only one page', () => {
    render(<ChallengeSearch initialData={mockInitialData} />);

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

    render(<ChallengeSearch initialData={multiPageData} />);

    expect(screen.getByText('Previous')).toBeDefined();
    expect(screen.getByText('Next')).toBeDefined();
    expect(screen.getByText('Page 1 of 2')).toBeDefined();
  });

  it('should show empty state with filter adjustment message when filters active', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(emptyData),
    });

    render(<ChallengeSearch initialData={mockInitialData} />);

    fireEvent.click(screen.getByText('Advanced'));

    await waitFor(() => {
      expect(screen.getByText('No challenges found')).toBeDefined();
      expect(screen.getByText('Try adjusting your filters or search term.')).toBeDefined();
    });
  });
});
