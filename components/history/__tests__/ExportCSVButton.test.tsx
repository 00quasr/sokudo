/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExportCSVButton } from '../ExportCSVButton';

describe('ExportCSVButton', () => {
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;

  beforeEach(() => {
    vi.clearAllMocks();
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('should render the export button', () => {
    render(<ExportCSVButton />);
    expect(screen.getByText('Export CSV')).toBeDefined();
  });

  it('should trigger CSV download on click', async () => {
    const csvContent = 'Session ID,Date\n1,2025-01-20';
    const mockBlob = new Blob([csvContent], { type: 'text/csv' });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(mockBlob),
    });

    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    render(<ExportCSVButton />);
    fireEvent.click(screen.getByText('Export CSV'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/sessions/export');
    });

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });

    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('should show "Exporting..." while downloading', async () => {
    let resolveBlob: (value: Blob) => void;
    const blobPromise = new Promise<Blob>((resolve) => {
      resolveBlob = resolve;
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockReturnValue(blobPromise),
    });

    render(<ExportCSVButton />);
    fireEvent.click(screen.getByText('Export CSV'));

    await waitFor(() => {
      expect(screen.getByText('Exporting...')).toBeDefined();
    });

    // Resolve to clean up
    resolveBlob!(new Blob(['']));

    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeDefined();
    });
  });

  it('should handle fetch errors gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(<ExportCSVButton />);
    fireEvent.click(screen.getByText('Export CSV'));

    await waitFor(() => {
      // Button should return to normal state after error
      expect(screen.getByText('Export CSV')).toBeDefined();
    });
  });

  it('should handle network errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    render(<ExportCSVButton />);
    fireEvent.click(screen.getByText('Export CSV'));

    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeDefined();
    });
  });

  it('should disable button while exporting', async () => {
    let resolveBlob: (value: Blob) => void;
    const blobPromise = new Promise<Blob>((resolve) => {
      resolveBlob = resolve;
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockReturnValue(blobPromise),
    });

    render(<ExportCSVButton />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await waitFor(() => {
      expect(button.hasAttribute('disabled')).toBe(true);
    });

    resolveBlob!(new Blob(['']));

    await waitFor(() => {
      expect(button.hasAttribute('disabled')).toBe(false);
    });
  });
});
