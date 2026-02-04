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
  usePathname: vi.fn(() => '/dashboard/challenges/new'),
}));

// Mock actions
vi.mock('../actions', () => ({
  createCustomChallenge: vi.fn(),
}));

import NewChallengePage from '../new/page';

describe('NewChallengePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useActionState).mockReturnValue([{}, vi.fn(), false]);
  });

  it('should render the page title', () => {
    render(<NewChallengePage />);
    expect(screen.getByText('Create Custom Challenge')).toBeTruthy();
  });

  it('should render the Challenge Details card', () => {
    render(<NewChallengePage />);
    expect(screen.getByText('Challenge Details')).toBeTruthy();
  });

  it('should render the name input field', () => {
    render(<NewChallengePage />);
    expect(screen.getByLabelText('Challenge Name')).toBeTruthy();
  });

  it('should render the content textarea', () => {
    render(<NewChallengePage />);
    expect(screen.getByLabelText('Challenge Content')).toBeTruthy();
  });

  it('should render the visibility toggle in private state by default', () => {
    render(<NewChallengePage />);
    expect(screen.getByText('Private')).toBeTruthy();
    expect(screen.getByRole('switch')).toBeTruthy();
  });

  it('should render Create Challenge button', () => {
    render(<NewChallengePage />);
    expect(screen.getByText('Create Challenge')).toBeTruthy();
  });

  it('should render Cancel button', () => {
    render(<NewChallengePage />);
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('should render Back link', () => {
    render(<NewChallengePage />);
    expect(screen.getByText('Back')).toBeTruthy();
  });

  it('should update char and word count when typing content', () => {
    render(<NewChallengePage />);
    const textarea = screen.getByLabelText('Challenge Content');
    fireEvent.change(textarea, { target: { value: 'hello world' } });
    expect(screen.getByText('11 chars / 2 words')).toBeTruthy();
  });

  it('should show 0 chars / 0 words when content is empty', () => {
    render(<NewChallengePage />);
    expect(screen.getByText('0 chars / 0 words')).toBeTruthy();
  });

  it('should toggle preview mode', () => {
    render(<NewChallengePage />);
    const textarea = screen.getByLabelText('Challenge Content');
    fireEvent.change(textarea, { target: { value: 'git commit' } });

    const previewButton = screen.getByText('Preview');
    fireEvent.click(previewButton);

    expect(screen.getByText('git commit')).toBeTruthy();
    expect(screen.getByText('Edit')).toBeTruthy();
  });

  it('should show error message from state', () => {
    vi.mocked(useActionState).mockReturnValue([
      { error: 'Name is required' },
      vi.fn(),
      false,
    ]);

    render(<NewChallengePage />);
    expect(screen.getByText('Name is required')).toBeTruthy();
  });

  it('should show success message from state', () => {
    vi.mocked(useActionState).mockReturnValue([
      { success: 'Challenge created successfully.' },
      vi.fn(),
      false,
    ]);

    render(<NewChallengePage />);
    expect(screen.getByText('Challenge created successfully.')).toBeTruthy();
  });

  it('should show loading state when pending', () => {
    vi.mocked(useActionState).mockReturnValue([{}, vi.fn(), true]);

    render(<NewChallengePage />);
    expect(screen.getByText('Creating...')).toBeTruthy();
  });
});
