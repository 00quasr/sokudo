import { render, screen, waitFor } from '@testing-library/react';
import { ScreenReaderAnnouncer, useScreenReaderAnnouncement } from '@/components/a11y/ScreenReaderAnnouncer';
import { act } from 'react';

describe('ScreenReaderAnnouncer', () => {
  it('renders with polite aria-live by default', () => {
    render(<ScreenReaderAnnouncer message="Test message" />);

    const element = screen.getByRole('status');
    expect(element).toBeInTheDocument();
    expect(element).toHaveAttribute('aria-live', 'polite');
    expect(element).toHaveAttribute('aria-atomic', 'true');
    expect(element).toHaveClass('sr-only');
    expect(element).toHaveTextContent('Test message');
  });

  it('renders with assertive priority', () => {
    render(<ScreenReaderAnnouncer message="Urgent message" priority="assertive" />);

    const element = screen.getByRole('status');
    expect(element).toHaveAttribute('aria-live', 'assertive');
    expect(element).toHaveTextContent('Urgent message');
  });

  it('does not render when message is empty', () => {
    const { container } = render(<ScreenReaderAnnouncer message="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('updates message when prop changes', () => {
    const { rerender } = render(<ScreenReaderAnnouncer message="First message" />);
    expect(screen.getByRole('status')).toHaveTextContent('First message');

    rerender(<ScreenReaderAnnouncer message="Second message" />);
    expect(screen.getByRole('status')).toHaveTextContent('Second message');
  });
});

describe('useScreenReaderAnnouncement', () => {
  function TestComponent() {
    const { announce } = useScreenReaderAnnouncement();

    return (
      <button onClick={() => announce('Test announcement', 'polite')}>
        Announce
      </button>
    );
  }

  it('creates an announcer element when announce is called', async () => {
    render(<TestComponent />);

    const button = screen.getByRole('button', { name: 'Announce' });
    act(() => {
      button.click();
    });

    await waitFor(() => {
      const announcer = document.getElementById('screen-reader-announcer');
      expect(announcer).toBeInTheDocument();
      expect(announcer).toHaveAttribute('role', 'status');
      expect(announcer).toHaveAttribute('aria-live', 'polite');
    });
  });

  it('updates existing announcer when called multiple times', async () => {
    function MultiAnnounceComponent() {
      const { announce } = useScreenReaderAnnouncement();

      return (
        <>
          <button onClick={() => announce('First', 'polite')}>First</button>
          <button onClick={() => announce('Second', 'assertive')}>Second</button>
        </>
      );
    }

    render(<MultiAnnounceComponent />);

    act(() => {
      screen.getByRole('button', { name: 'First' }).click();
    });

    await waitFor(() => {
      expect(document.getElementById('screen-reader-announcer')).toHaveTextContent('First');
    });

    act(() => {
      screen.getByRole('button', { name: 'Second' }).click();
    });

    await waitFor(() => {
      const announcer = document.getElementById('screen-reader-announcer');
      expect(announcer).toHaveAttribute('aria-live', 'assertive');
    });
  });
});
