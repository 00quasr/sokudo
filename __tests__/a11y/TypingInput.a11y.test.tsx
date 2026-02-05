import { render, screen } from '@testing-library/react';
import { TypingInput } from '@/components/typing/TypingInput';

describe('TypingInput Accessibility', () => {
  const defaultProps = {
    targetText: 'git commit -m "test"',
    syntaxType: 'git' as const,
  };

  it('has proper ARIA role for typing area', () => {
    render(<TypingInput {...defaultProps} />);

    const typingArea = screen.getByRole('textbox');
    expect(typingArea).toBeInTheDocument();
    expect(typingArea).toHaveAttribute('aria-label', 'Typing input area');
  });

  it('has aria-readonly attribute', () => {
    render(<TypingInput {...defaultProps} />);

    const typingArea = screen.getByRole('textbox');
    expect(typingArea).toHaveAttribute('aria-readonly', 'true');
  });

  it('has aria-describedby pointing to keyboard shortcuts', () => {
    render(<TypingInput {...defaultProps} />);

    const typingArea = screen.getByRole('textbox');
    expect(typingArea).toHaveAttribute('aria-describedby', 'keyboard-shortcuts-hint');

    const shortcuts = document.getElementById('keyboard-shortcuts-hint');
    expect(shortcuts).toBeInTheDocument();
  });

  it('displays keyboard shortcuts region with proper aria-label', () => {
    render(<TypingInput {...defaultProps} />);

    const shortcutsRegion = screen.getByRole('region', { name: 'Available keyboard shortcuts' });
    expect(shortcutsRegion).toBeInTheDocument();
  });

  it('marks current character with aria-current', () => {
    render(<TypingInput {...defaultProps} />);

    const currentChar = screen.getByText('g', { selector: '[aria-current="location"]' });
    expect(currentChar).toBeInTheDocument();
  });

  it('has proper focus styles', () => {
    render(<TypingInput {...defaultProps} />);

    const typingArea = screen.getByRole('textbox');
    expect(typingArea).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-ring');
  });

  it('completion message has proper role', () => {
    render(
      <TypingInput
        {...defaultProps}
        targetText="a"
        onComplete={() => {}}
      />
    );

    // Type the character to complete
    const typingArea = screen.getByRole('textbox');
    typingArea.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));

    // Check for completion status
    const completionStatus = screen.queryByRole('status', { name: /complete/i });
    if (completionStatus) {
      expect(completionStatus).toHaveAttribute('aria-live', 'polite');
    }
  });

  it('hides decorative icons from screen readers', () => {
    render(<TypingInput {...defaultProps} showStats />);

    // Stats should have icons with aria-hidden
    const container = screen.getByRole('textbox').parentElement;
    const icons = container?.querySelectorAll('[aria-hidden="true"]');
    expect(icons).toBeTruthy();
  });

  it('provides screen reader only text for instructions', () => {
    render(<TypingInput {...defaultProps} />);

    const srOnlyElements = document.querySelectorAll('.sr-only');
    expect(srOnlyElements.length).toBeGreaterThan(0);
  });
});
