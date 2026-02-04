/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VoteButtons } from '../vote-buttons';

describe('VoteButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should render upvote and downvote buttons with counts', () => {
    render(
      <VoteButtons
        challengeId={1}
        initialVotes={{ upvotes: 5, downvotes: 2, score: 3 }}
        initialUserVote={0}
      />
    );

    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
  });

  it('should render with zero votes', () => {
    render(
      <VoteButtons
        challengeId={1}
        initialVotes={{ upvotes: 0, downvotes: 0, score: 0 }}
        initialUserVote={0}
      />
    );

    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(2);
  });

  it('should call API and update counts on upvote', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          votes: { upvotes: 6, downvotes: 2, score: 4 },
          userVote: 1,
        }),
    });

    render(
      <VoteButtons
        challengeId={1}
        initialVotes={{ upvotes: 5, downvotes: 2, score: 3 }}
        initialUserVote={0}
      />
    );

    const upvoteButton = screen.getByText('5').closest('button')!;
    fireEvent.click(upvoteButton);

    await waitFor(() => {
      expect(screen.getByText('6')).toBeDefined();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/community-challenges/1/vote',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ value: 1 }),
      })
    );
  });

  it('should call API and update counts on downvote', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          votes: { upvotes: 5, downvotes: 3, score: 2 },
          userVote: -1,
        }),
    });

    render(
      <VoteButtons
        challengeId={1}
        initialVotes={{ upvotes: 5, downvotes: 2, score: 3 }}
        initialUserVote={0}
      />
    );

    const downvoteButton = screen.getByText('2').closest('button')!;
    fireEvent.click(downvoteButton);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeDefined();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/community-challenges/1/vote',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ value: -1 }),
      })
    );
  });

  it('should not call API when already loading', async () => {
    let resolvePromise: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(fetchPromise);

    render(
      <VoteButtons
        challengeId={1}
        initialVotes={{ upvotes: 5, downvotes: 2, score: 3 }}
        initialUserVote={0}
      />
    );

    const upvoteButton = screen.getByText('5').closest('button')!;
    fireEvent.click(upvoteButton);

    // Second click while loading should not trigger another fetch
    fireEvent.click(upvoteButton);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Resolve to clean up
    resolvePromise!({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          votes: { upvotes: 6, downvotes: 2, score: 4 },
          userVote: 1,
        }),
    });

    await waitFor(() => {
      expect(screen.getByText('6')).toBeDefined();
    });
  });

  it('should not update state on 401 response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    });

    render(
      <VoteButtons
        challengeId={1}
        initialVotes={{ upvotes: 5, downvotes: 2, score: 3 }}
        initialUserVote={0}
      />
    );

    const upvoteButton = screen.getByText('5').closest('button')!;
    fireEvent.click(upvoteButton);

    // Counts should remain the same
    await waitFor(() => {
      expect(screen.getByText('5')).toBeDefined();
      expect(screen.getByText('2')).toBeDefined();
    });
  });

  it('should handle toggling vote (upvote then remove)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          votes: { upvotes: 4, downvotes: 2, score: 2 },
          userVote: 0,
        }),
    });

    render(
      <VoteButtons
        challengeId={1}
        initialVotes={{ upvotes: 5, downvotes: 2, score: 3 }}
        initialUserVote={1}
      />
    );

    const upvoteButton = screen.getByText('5').closest('button')!;
    fireEvent.click(upvoteButton);

    await waitFor(() => {
      expect(screen.getByText('4')).toBeDefined();
    });
  });

  it('should prevent event propagation to parent link', () => {
    const parentClickHandler = vi.fn();

    render(
      <div onClick={parentClickHandler}>
        <VoteButtons
          challengeId={1}
          initialVotes={{ upvotes: 5, downvotes: 2, score: 3 }}
          initialUserVote={0}
        />
      </div>
    );

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          votes: { upvotes: 6, downvotes: 2, score: 4 },
          userVote: 1,
        }),
    });

    const upvoteButton = screen.getByText('5').closest('button')!;
    fireEvent.click(upvoteButton);

    expect(parentClickHandler).not.toHaveBeenCalled();
  });
});
