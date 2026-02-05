/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
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
    const { container } = render(<OfflineIndicator isOnline={true} pendingSyncCount={3} />);
    expect(container.textContent).toMatch(/(?:Back online - syncing|Syncing) 3 sessions\.\.\./);
  });

  it('should show singular session when count is 1', () => {
    const { container } = render(<OfflineIndicator isOnline={true} pendingSyncCount={1} />);
    // Component shows "Back online - syncing" when first rendered with pending sessions
    expect(container.textContent).toMatch(/(?:Back online - syncing|Syncing) 1 session\.\.\./);
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
    vi.useRealTimers(); // Use real timers for this test to avoid timing issues
    const { rerender } = render(
      <OfflineIndicator isOnline={true} pendingSyncCount={2} />
    );

    rerender(<OfflineIndicator isOnline={true} pendingSyncCount={0} />);

    await waitFor(() => {
      expect(screen.getByText('All sessions synced!')).toBeInTheDocument();
    });

    // Wait for the timeout (3 seconds + buffer)
    await new Promise(resolve => setTimeout(resolve, 3100));

    await waitFor(() => {
      expect(screen.queryByText('All sessions synced!')).not.toBeInTheDocument();
    });
  });

  it('should render retry button when syncing', () => {
    const onSyncClick = vi.fn();
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
    const onSyncClick = vi.fn();
    const { container } = render(
      <OfflineIndicator
        isOnline={true}
        pendingSyncCount={2}
        onSyncClick={onSyncClick}
      />
    );

    const retryButton = container.querySelector('button');
    expect(retryButton).toBeTruthy();

    // Use fireEvent for simpler synchronous click
    if (retryButton) {
      retryButton.click();
    }

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
