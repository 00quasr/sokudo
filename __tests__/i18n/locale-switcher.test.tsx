import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { useLocale } from 'next-intl';

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: vi.fn()
}));

// Mock window.location.reload
const reloadMock = vi.fn();
Object.defineProperty(window, 'location', {
  value: { reload: reloadMock },
  writable: true
});

describe('LocaleSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.cookie = '';
  });

  it('should render locale buttons', () => {
    vi.mocked(useLocale).mockReturnValue('en');
    render(<LocaleSwitcher />);

    expect(screen.getByRole('button', { name: /English/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /日本語/i })).toBeInTheDocument();
  });

  it('should highlight current locale', () => {
    vi.mocked(useLocale).mockReturnValue('en');
    render(<LocaleSwitcher />);

    const englishButton = screen.getByRole('button', { name: /English/i });
    expect(englishButton).toBeDisabled();
  });

  it('should allow switching to different locale', async () => {
    vi.mocked(useLocale).mockReturnValue('en');
    const user = userEvent.setup();

    render(<LocaleSwitcher />);

    const japaneseButton = screen.getByRole('button', { name: /日本語/i });
    await user.click(japaneseButton);

    // Check that cookie was set
    expect(document.cookie).toContain('NEXT_LOCALE=ja');
  });

  it('should have proper aria labels', () => {
    vi.mocked(useLocale).mockReturnValue('en');
    render(<LocaleSwitcher />);

    expect(screen.getByLabelText('Switch to English')).toBeInTheDocument();
    expect(screen.getByLabelText('Switch to 日本語')).toBeInTheDocument();
  });
});
