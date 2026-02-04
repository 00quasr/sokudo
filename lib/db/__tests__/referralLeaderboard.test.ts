import { describe, it, expect } from 'vitest';
import type { ReferralLeaderboardEntry } from '../queries';

describe('ReferralLeaderboardEntry type', () => {
  it('should support valid leaderboard entries', () => {
    const entry: ReferralLeaderboardEntry = {
      rank: 1,
      userId: 10,
      userName: 'Alice',
      username: 'alice',
      completedReferrals: 8,
    };

    expect(entry.rank).toBe(1);
    expect(entry.userId).toBe(10);
    expect(entry.userName).toBe('Alice');
    expect(entry.username).toBe('alice');
    expect(entry.completedReferrals).toBe(8);
  });

  it('should allow null userName and username', () => {
    const entry: ReferralLeaderboardEntry = {
      rank: 1,
      userId: 5,
      userName: null,
      username: null,
      completedReferrals: 3,
    };

    expect(entry.userName).toBeNull();
    expect(entry.username).toBeNull();
  });

  it('should support sorting by completedReferrals', () => {
    const entries: ReferralLeaderboardEntry[] = [
      { rank: 1, userId: 1, userName: 'A', username: 'a', completedReferrals: 3 },
      { rank: 2, userId: 2, userName: 'B', username: 'b', completedReferrals: 10 },
      { rank: 3, userId: 3, userName: 'C', username: 'c', completedReferrals: 5 },
    ];

    const sorted = [...entries].sort(
      (a, b) => b.completedReferrals - a.completedReferrals
    );

    expect(sorted[0].userId).toBe(2);
    expect(sorted[1].userId).toBe(3);
    expect(sorted[2].userId).toBe(1);
  });

  it('should support re-ranking after sort', () => {
    const entries: ReferralLeaderboardEntry[] = [
      { rank: 0, userId: 1, userName: 'A', username: 'a', completedReferrals: 3 },
      { rank: 0, userId: 2, userName: 'B', username: 'b', completedReferrals: 10 },
      { rank: 0, userId: 3, userName: 'C', username: 'c', completedReferrals: 5 },
    ];

    const sorted = [...entries]
      .sort((a, b) => b.completedReferrals - a.completedReferrals)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    expect(sorted[0].rank).toBe(1);
    expect(sorted[0].completedReferrals).toBe(10);
    expect(sorted[1].rank).toBe(2);
    expect(sorted[1].completedReferrals).toBe(5);
    expect(sorted[2].rank).toBe(3);
    expect(sorted[2].completedReferrals).toBe(3);
  });

  it('should support finding current user in leaderboard', () => {
    const currentUserId = 2;
    const entries: ReferralLeaderboardEntry[] = [
      { rank: 1, userId: 1, userName: 'A', username: 'a', completedReferrals: 10 },
      { rank: 2, userId: 2, userName: 'B', username: 'b', completedReferrals: 5 },
      { rank: 3, userId: 3, userName: 'C', username: 'c', completedReferrals: 3 },
    ];

    const currentUserEntry = entries.find((e) => e.userId === currentUserId);
    expect(currentUserEntry).toBeDefined();
    expect(currentUserEntry?.rank).toBe(2);
    expect(currentUserEntry?.completedReferrals).toBe(5);
  });
});
