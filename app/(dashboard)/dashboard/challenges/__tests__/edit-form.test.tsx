/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useActionState } from 'react';

// Mock ResizeObserver for Radix Switch component
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Mock useActionState
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useActionState: vi.fn(() => [{}, vi.fn(), false]),
  };
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  usePathname: vi.fn(() => '/dashboard/challenges/1/edit'),
}));

// Mock actions
vi.mock('../../actions', () => ({
  updateCustomChallenge: vi.fn(),
}));

import { EditChallengeForm } from '../[id]/edit/edit-form';

const mockChallenge = {
  id: 1,
  name: 'Git Workflow',
  content: 'git add . && git commit -m "update"',
  isPublic: false,
};

describe('EditChallengeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useActionState).mockReturnValue([{}, vi.fn(), false]);
  });

  it('should render the page title', () => {
    render(<EditChallengeForm challenge={mockChallenge} />);
    expect(screen.getByText('Edit Challenge')).toBeTruthy();
  });

  it('should render the Challenge Details card', () => {
    render(<EditChallengeForm challenge={mockChallenge} />);
    expect(screen.getByText('Challenge Details')).toBeTruthy();
  });

  it('should pre-fill the name field', () => {
    render(<EditChallengeForm challenge={mockChallenge} />);
    const nameInput = screen.getByLabelText('Challenge Name') as HTMLInputElement;
    expect(nameInput.defaultValue).toBe('Git Workflow');
  });

  it('should pre-fill the content field', () => {
    render(<EditChallengeForm challenge={mockChallenge} />);
    const textarea = screen.getByLabelText('Challenge Content') as HTMLTextAreaElement;
    expect(textarea.value).toBe('git add . && git commit -m "update"');
  });

  it('should show char and word count from initial content', () => {
    render(<EditChallengeForm challenge={mockChallenge} />);
    expect(screen.getByText('35 chars / 8 words')).toBeTruthy();
  });

  it('should render Save Changes button', () => {
    render(<EditChallengeForm challenge={mockChallenge} />);
    expect(screen.getByText('Save Changes')).toBeTruthy();
  });

  it('should include hidden id input', () => {
    const { container } = render(<EditChallengeForm challenge={mockChallenge} />);
    const hiddenInput = container.querySelector('input[name="id"]') as HTMLInputElement;
    expect(hiddenInput).toBeTruthy();
    expect(hiddenInput.value).toBe('1');
  });

  it('should update content and counts when typing', () => {
    render(<EditChallengeForm challenge={mockChallenge} />);
    const textarea = screen.getByLabelText('Challenge Content');
    fireEvent.change(textarea, { target: { value: 'docker build .' } });
    expect(screen.getByText('14 chars / 3 words')).toBeTruthy();
  });

  it('should render visibility toggle in private state for private challenge', () => {
    render(<EditChallengeForm challenge={mockChallenge} />);
    expect(screen.getByText('Private')).toBeTruthy();
    expect(screen.getByRole('switch')).toBeTruthy();
  });

  it('should render visibility toggle in public state for public challenge', () => {
    render(
      <EditChallengeForm challenge={{ ...mockChallenge, isPublic: true }} />
    );
    expect(screen.getByText('Public')).toBeTruthy();
    expect(screen.getByRole('switch')).toBeTruthy();
  });

  it('should show loading state when pending', () => {
    vi.mocked(useActionState).mockReturnValue([{}, vi.fn(), true]);

    render(<EditChallengeForm challenge={mockChallenge} />);
    expect(screen.getByText('Saving...')).toBeTruthy();
  });

  it('should show error message from state', () => {
    vi.mocked(useActionState).mockReturnValue([
      { error: 'Challenge not found.' },
      vi.fn(),
      false,
    ]);

    render(<EditChallengeForm challenge={mockChallenge} />);
    expect(screen.getByText('Challenge not found.')).toBeTruthy();
  });

  it('should show success message from state', () => {
    vi.mocked(useActionState).mockReturnValue([
      { success: 'Challenge updated successfully.' },
      vi.fn(),
      false,
    ]);

    render(<EditChallengeForm challenge={mockChallenge} />);
    expect(screen.getByText('Challenge updated successfully.')).toBeTruthy();
  });
});
