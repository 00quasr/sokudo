import { render, screen } from '@testing-library/react';
import { SkipLinks } from '@/components/a11y/SkipLinks';

describe('SkipLinks', () => {
  it('renders skip to main content link', () => {
    render(<SkipLinks />);

    const mainLink = screen.getByRole('link', { name: 'Skip to main content' });
    expect(mainLink).toBeInTheDocument();
    expect(mainLink).toHaveAttribute('href', '#main-content');
  });

  it('renders skip to navigation link', () => {
    render(<SkipLinks />);

    const navLink = screen.getByRole('link', { name: 'Skip to navigation' });
    expect(navLink).toBeInTheDocument();
    expect(navLink).toHaveAttribute('href', '#navigation');
  });

  it('has proper focus styles', () => {
    render(<SkipLinks />);

    const mainLink = screen.getByRole('link', { name: 'Skip to main content' });
    expect(mainLink).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-ring');
  });

  it('is positioned correctly', () => {
    render(<SkipLinks />);

    const mainLink = screen.getByRole('link', { name: 'Skip to main content' });
    expect(mainLink).toHaveClass('fixed', 'top-4', 'left-4', 'z-[100]');
  });
});
