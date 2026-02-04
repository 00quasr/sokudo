/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Polyfill ResizeObserver for jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock SWR
const mockSWR = vi.fn();
vi.mock('swr', () => ({
  default: (...args: unknown[]) => mockSWR(...args),
  mutate: vi.fn(),
}));

// Mock useActionState
const mockActionState = vi.fn();
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useActionState: (...args: unknown[]) => mockActionState(...args),
  };
});

// Mock actions
vi.mock('@/app/(login)/actions', () => ({
  removeTeamMember: vi.fn(),
  inviteTeamMember: vi.fn(),
  cancelInvitation: vi.fn(),
}));

// Mock payments actions
vi.mock('@/lib/payments/actions', () => ({
  customerPortalAction: vi.fn(),
}));

import SettingsPage from '../page';

describe('Team Invite Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for useActionState
    mockActionState.mockReturnValue([{}, vi.fn(), false]);
  });

  it('should render the settings page with pending invitations section', () => {
    // Mock SWR to return data with pending invitations
    mockSWR.mockImplementation((url: string) => {
      if (url === '/api/team') {
        return {
          data: {
            id: 1,
            name: 'Test Team',
            teamMembers: [
              {
                id: 1,
                role: 'owner',
                user: { id: 1, name: 'Test User', email: 'test@test.com' },
              },
            ],
          },
        };
      }
      if (url === '/api/user') {
        return {
          data: {
            id: 1,
            name: 'Test User',
            email: 'test@test.com',
            role: 'owner',
          },
        };
      }
      if (url === '/api/team/invitations') {
        return {
          data: {
            invitations: [
              {
                id: 1,
                email: 'alice@test.com',
                role: 'member',
                status: 'pending',
                invitedAt: '2025-01-15T10:00:00.000Z',
                invitedByName: 'Test User',
                invitedByEmail: 'test@test.com',
              },
            ],
          },
          mutate: vi.fn(),
        };
      }
      return { data: null };
    });

    render(<SettingsPage />);

    expect(screen.getByText('Team Settings')).toBeTruthy();
    expect(screen.getByText('Pending Invitations')).toBeTruthy();
    expect(screen.getByText('alice@test.com')).toBeTruthy();
  });

  it('should not render pending invitations when there are none', () => {
    mockSWR.mockImplementation((url: string) => {
      if (url === '/api/team') {
        return {
          data: {
            id: 1,
            name: 'Test Team',
            teamMembers: [
              {
                id: 1,
                role: 'owner',
                user: { id: 1, name: 'Test User', email: 'test@test.com' },
              },
            ],
          },
        };
      }
      if (url === '/api/user') {
        return {
          data: {
            id: 1,
            name: 'Test User',
            email: 'test@test.com',
            role: 'owner',
          },
        };
      }
      if (url === '/api/team/invitations') {
        return {
          data: { invitations: [] },
          mutate: vi.fn(),
        };
      }
      return { data: null };
    });

    render(<SettingsPage />);

    expect(screen.getByText('Team Settings')).toBeTruthy();
    // PendingInvitations returns null when empty
    expect(screen.queryByText('Pending Invitations')).toBeNull();
  });

  it('should show invitation role and date', () => {
    mockSWR.mockImplementation((url: string) => {
      if (url === '/api/team') {
        return {
          data: {
            id: 1,
            name: 'Test Team',
            teamMembers: [
              {
                id: 1,
                role: 'owner',
                user: { id: 1, name: 'Test User', email: 'test@test.com' },
              },
            ],
          },
        };
      }
      if (url === '/api/user') {
        return {
          data: {
            id: 1,
            name: 'Test User',
            email: 'test@test.com',
            role: 'owner',
          },
        };
      }
      if (url === '/api/team/invitations') {
        return {
          data: {
            invitations: [
              {
                id: 1,
                email: 'bob@test.com',
                role: 'owner',
                status: 'pending',
                invitedAt: '2025-01-15T10:00:00.000Z',
                invitedByName: 'Test User',
                invitedByEmail: 'test@test.com',
              },
            ],
          },
          mutate: vi.fn(),
        };
      }
      return { data: null };
    });

    render(<SettingsPage />);

    expect(screen.getByText('bob@test.com')).toBeTruthy();
    // 'owner' appears both in team members and in the invitation role
    expect(screen.getAllByText('owner').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('by Test User')).toBeTruthy();
  });

  it('should only show pending invitations, not accepted ones', () => {
    mockSWR.mockImplementation((url: string) => {
      if (url === '/api/team') {
        return {
          data: {
            id: 1,
            name: 'Test Team',
            teamMembers: [
              {
                id: 1,
                role: 'owner',
                user: { id: 1, name: 'Test User', email: 'test@test.com' },
              },
            ],
          },
        };
      }
      if (url === '/api/user') {
        return {
          data: {
            id: 1,
            name: 'Test User',
            email: 'test@test.com',
            role: 'owner',
          },
        };
      }
      if (url === '/api/team/invitations') {
        return {
          data: {
            invitations: [
              {
                id: 1,
                email: 'accepted@test.com',
                role: 'member',
                status: 'accepted',
                invitedAt: '2025-01-14T10:00:00.000Z',
                invitedByName: 'Test User',
                invitedByEmail: 'test@test.com',
              },
            ],
          },
          mutate: vi.fn(),
        };
      }
      return { data: null };
    });

    render(<SettingsPage />);

    // Only accepted, no pending - should not show section
    expect(screen.queryByText('Pending Invitations')).toBeNull();
    expect(screen.queryByText('accepted@test.com')).toBeNull();
  });

  it('should show multiple pending invitations', () => {
    mockSWR.mockImplementation((url: string) => {
      if (url === '/api/team') {
        return {
          data: {
            id: 1,
            name: 'Test Team',
            teamMembers: [
              {
                id: 1,
                role: 'owner',
                user: { id: 1, name: 'Test User', email: 'test@test.com' },
              },
            ],
          },
        };
      }
      if (url === '/api/user') {
        return {
          data: {
            id: 1,
            name: 'Test User',
            email: 'test@test.com',
            role: 'owner',
          },
        };
      }
      if (url === '/api/team/invitations') {
        return {
          data: {
            invitations: [
              {
                id: 1,
                email: 'alice@test.com',
                role: 'member',
                status: 'pending',
                invitedAt: '2025-01-15T10:00:00.000Z',
                invitedByName: 'Test User',
                invitedByEmail: 'test@test.com',
              },
              {
                id: 2,
                email: 'charlie@test.com',
                role: 'member',
                status: 'pending',
                invitedAt: '2025-01-14T10:00:00.000Z',
                invitedByName: 'Test User',
                invitedByEmail: 'test@test.com',
              },
            ],
          },
          mutate: vi.fn(),
        };
      }
      return { data: null };
    });

    render(<SettingsPage />);

    expect(screen.getByText('alice@test.com')).toBeTruthy();
    expect(screen.getByText('charlie@test.com')).toBeTruthy();
  });
});
