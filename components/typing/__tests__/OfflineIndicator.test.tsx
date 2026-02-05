import { render, screen, waitFor } from '@testing-library/react';
import { OfflineIndicator } from '../OfflineIndicator';
import userEvent from '@testing-library/user-event';

describe('OfflineIndicator', () => {
  it('should not render when online with no pending syncs', () => {
    const { container } = render(
      <OfflineIndicator isOnline={true} pendingSyncCount={0} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render offline indicator when offline', () => {
    render(<OfflineIndicator isOnline={false} pendingSyncCount={0} />);
    expect(screen.getByText('Offline - sessions saved locally')).toBeInTheDocument();
  });

  it('should render syncing indicator when online with pending syncs', () => {
    render(<OfflineIndicator isOnline={true} pendingSyncCount={3} />);
    expect(screen.getByText(/Syncing 3 sessions/)).toBeInTheDocument();
  });

  it('should show singular session when count is 1', () => {
    render(<OfflineIndicator isOnline={true} pendingSyncCount={1} />);
    expect(screen.getByText(/Syncing 1 session\.\.\./)).toBeInTheDocument();
  });

  it('should show "Back online" message when transitioning from offline to online', async () => {
    const { rerender } = render(
      <OfflineIndicator isOnline={false} pendingSyncCount={2} />
    );
    expect(screen.getByText('Offline - sessions saved locally')).toBeInTheDocument();

    rerender(<OfflineIndicator isOnline={true} pendingSyncCount={2} />);
    await waitFor(() => {
      expect(screen.getByText(/Back online - syncing 2 sessions/)).toBeInTheDocument();
    });
  });

  it('should show success message when sync completes', async () => {
    const { rerender } = render(
      <OfflineIndicator isOnline={true} pendingSyncCount={2} />
    );

    rerender(<OfflineIndicator isOnline={true} pendingSyncCount={0} />);

    await waitFor(() => {
      expect(screen.getByText('All sessions synced!')).toBeInTheDocument();
    });
  });

  it('should hide success message after timeout', async () => {
    jest.useFakeTimers();
    const { rerender } = render(
      <OfflineIndicator isOnline={true} pendingSyncCount={2} />
    );

    rerender(<OfflineIndicator isOnline={true} pendingSyncCount={0} />);

    await waitFor(() => {
      expect(screen.getByText('All sessions synced!')).toBeInTheDocument();
    });

    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.queryByText('All sessions synced!')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('should render retry button when syncing', () => {
    const onSyncClick = jest.fn();
    render(
      <OfflineIndicator
        isOnline={true}
        pendingSyncCount={2}
        onSyncClick={onSyncClick}
      />
    );

    const retryButton = screen.getByRole('button', { name: 'Retry sync' });
    expect(retryButton).toBeInTheDocument();
  });

  it('should call onSyncClick when retry button is clicked', async () => {
    const user = userEvent.setup();
    const onSyncClick = jest.fn();
    render(
      <OfflineIndicator
        isOnline={true}
        pendingSyncCount={2}
        onSyncClick={onSyncClick}
      />
    );

    const retryButton = screen.getByRole('button', { name: 'Retry sync' });
    await user.click(retryButton);

    expect(onSyncClick).toHaveBeenCalledTimes(1);
  });

  it('should not render retry button when no onSyncClick provided', () => {
    render(<OfflineIndicator isOnline={true} pendingSyncCount={2} />);

    expect(screen.queryByRole('button', { name: 'Retry sync' })).not.toBeInTheDocument();
  });

  it('should not show success message when going from offline to online with pending syncs', () => {
    const { rerender } = render(
      <OfflineIndicator isOnline={false} pendingSyncCount={0} />
    );

    rerender(<OfflineIndicator isOnline={true} pendingSyncCount={0} />);

    expect(screen.queryByText('All sessions synced!')).not.toBeInTheDocument();
  });
});
