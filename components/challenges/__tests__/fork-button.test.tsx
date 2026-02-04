/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the server action
vi.mock('@/app/(dashboard)/dashboard/challenges/actions', () => ({
  forkChallenge: vi.fn(),
}));

// Mock react's useActionState
const mockFormAction = vi.fn();
let mockState: Record<string, unknown> = {};
let mockIsPending = false;

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useActionState: () => [mockState, mockFormAction, mockIsPending],
  };
});

import { ForkButton } from '../fork-button';

describe('ForkButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {};
    mockIsPending = false;
  });

  it('should render the Fork button with default variant', () => {
    render(<ForkButton challengeId={1} />);

    const button = screen.getByRole('button');
    expect(button).toBeDefined();
    expect(button.textContent).toContain('Fork');
  });

  it('should render the compact variant', () => {
    render(<ForkButton challengeId={1} variant="compact" />);

    const button = screen.getByRole('button');
    expect(button).toBeDefined();
    expect(button.textContent).toContain('Fork');
  });

  it('should include hidden input with challengeId', () => {
    render(<ForkButton challengeId={42} />);

    const hiddenInput = document.querySelector('input[name="challengeId"]') as HTMLInputElement;
    expect(hiddenInput).toBeDefined();
    expect(hiddenInput.value).toBe('42');
  });

  it('should show "Forked" state after successful fork', () => {
    mockState = { success: 'Challenge forked successfully.' };

    render(<ForkButton challengeId={1} />);

    const button = screen.getByRole('button');
    expect(button.textContent).toContain('Forked');
    expect(button.disabled).toBe(true);
  });

  it('should show "Forking..." state while pending', () => {
    mockIsPending = true;

    render(<ForkButton challengeId={1} />);

    const button = screen.getByRole('button');
    expect(button.textContent).toContain('Forking...');
    expect(button.disabled).toBe(true);
  });

  it('should show error message when fork fails', () => {
    mockState = { error: 'Challenge not found or is not public.' };

    render(<ForkButton challengeId={1} />);

    expect(screen.getByText('Challenge not found or is not public.')).toBeDefined();
  });

  it('should show compact "Forked" state after success', () => {
    mockState = { success: 'Challenge forked successfully.' };

    render(<ForkButton challengeId={1} variant="compact" />);

    const button = screen.getByRole('button');
    expect(button.textContent).toContain('Forked');
    expect(button.disabled).toBe(true);
  });

  it('should disable button while pending in compact mode', () => {
    mockIsPending = true;

    render(<ForkButton challengeId={1} variant="compact" />);

    const button = screen.getByRole('button');
    expect(button.textContent).toContain('Forking...');
    expect(button.disabled).toBe(true);
  });
});
