import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KeyboardShortcutsDialog } from '@/components/a11y/KeyboardShortcutsDialog';

describe('KeyboardShortcutsDialog', () => {
  it('does not render dialog initially', () => {
    render(<KeyboardShortcutsDialog />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens dialog when Shift+? is pressed', async () => {
    render(<KeyboardShortcutsDialog />);

    fireEvent.keyDown(document, { key: '?', shiftKey: true });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('displays keyboard shortcuts title', async () => {
    render(<KeyboardShortcutsDialog />);

    fireEvent.keyDown(document, { key: '?', shiftKey: true });

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });
  });

  it('displays shortcuts grouped by category', async () => {
    render(<KeyboardShortcutsDialog />);

    fireEvent.keyDown(document, { key: '?', shiftKey: true });

    await waitFor(() => {
      expect(screen.getByText('Global')).toBeInTheDocument();
      expect(screen.getByText('Typing Practice')).toBeInTheDocument();
      expect(screen.getByText('Navigation')).toBeInTheDocument();
    });
  });

  it('displays shortcut descriptions', async () => {
    render(<KeyboardShortcutsDialog />);

    fireEvent.keyDown(document, { key: '?', shiftKey: true });

    await waitFor(() => {
      expect(screen.getByText('Show keyboard shortcuts')).toBeInTheDocument();
      expect(screen.getByText('Skip to next challenge')).toBeInTheDocument();
      expect(screen.getByText('Retry current challenge')).toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', async () => {
    render(<KeyboardShortcutsDialog />);

    fireEvent.keyDown(document, { key: '?', shiftKey: true });

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });
  });
});
