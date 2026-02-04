/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useActionState } from 'react';

// Mock useActionState
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useActionState: vi.fn(() => [{}, vi.fn(), false]),
  };
});

// Mock actions
vi.mock('../actions', () => ({
  deleteCustomChallenge: vi.fn(),
}));

import { DeleteChallengeButton } from '../delete-button';

describe('DeleteChallengeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useActionState).mockReturnValue([{}, vi.fn(), false]);
  });

  it('should render a delete button', () => {
    render(<DeleteChallengeButton challengeId={1} />);
    const button = screen.getByRole('button');
    expect(button).toBeTruthy();
  });

  it('should include hidden input with challenge id', () => {
    const { container } = render(<DeleteChallengeButton challengeId={42} />);
    const hiddenInput = container.querySelector('input[name="id"]') as HTMLInputElement;
    expect(hiddenInput).toBeTruthy();
    expect(hiddenInput.value).toBe('42');
  });

  it('should show loading state when pending', () => {
    vi.mocked(useActionState).mockReturnValue([{}, vi.fn(), true]);

    render(<DeleteChallengeButton challengeId={1} />);
    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should show error message on error state', () => {
    vi.mocked(useActionState).mockReturnValue([
      { error: 'Challenge not found.' },
      vi.fn(),
      false,
    ]);

    render(<DeleteChallengeButton challengeId={1} />);
    expect(screen.getByText('Challenge not found.')).toBeTruthy();
  });
});
