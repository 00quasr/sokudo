import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch, apiFetcher } from '../api-client';

// Mock window.location
const mockLocation = {
  pathname: '/dashboard/stats',
  search: '?tab=overview',
  href: '',
};

// Create a mock window object
(global as any).window = {
  location: mockLocation,
};

// Mock fetch
global.fetch = vi.fn();

describe('api-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
    mockLocation.pathname = '/dashboard/stats';
    mockLocation.search = '?tab=overview';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('apiFetch', () => {
    it('should pass through successful responses', async () => {
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const response = await apiFetch('/api/stats');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ data: 'test' });
      expect(global.fetch).toHaveBeenCalledWith('/api/stats', undefined);
    });

    it('should redirect to sign-in on 401 status', async () => {
      const mockResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      // Start the fetch but don't await (it returns a never-resolving promise)
      const fetchPromise = apiFetch('/api/stats');

      // Wait a bit for the redirect to be set
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockLocation.href).toBe('/sign-in?redirect=%2Fdashboard%2Fstats%3Ftab%3Doverview');

      // The promise should never resolve
      const raceResult = await Promise.race([
        fetchPromise,
        new Promise((resolve) => setTimeout(() => resolve('timeout'), 100)),
      ]);

      expect(raceResult).toBe('timeout');
    });

    it('should redirect to sign-in on 403 status', async () => {
      const mockResponse = new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
      });

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      // Start the fetch but don't await
      const fetchPromise = apiFetch('/api/sessions');

      // Wait a bit for the redirect to be set
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockLocation.href).toBe('/sign-in?redirect=%2Fdashboard%2Fstats%3Ftab%3Doverview');

      // The promise should never resolve
      const raceResult = await Promise.race([
        fetchPromise,
        new Promise((resolve) => setTimeout(() => resolve('timeout'), 100)),
      ]);

      expect(raceResult).toBe('timeout');
    });

    it('should preserve current path and query in redirect URL', async () => {
      mockLocation.pathname = '/dashboard/api-keys';
      mockLocation.search = '';

      const mockResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      // Start the fetch
      apiFetch('/api/keys');

      // Wait a bit for the redirect to be set
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockLocation.href).toBe('/sign-in?redirect=%2Fdashboard%2Fapi-keys');
    });

    it('should pass through non-401/403 error statuses', async () => {
      const mockResponse = new Response(JSON.stringify({ error: 'Bad Request' }), {
        status: 400,
      });

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const response = await apiFetch('/api/stats');

      expect(response.status).toBe(400);
      expect(mockLocation.href).toBe(''); // No redirect
    });

    it('should forward fetch options correctly', async () => {
      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
      });

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      };

      await apiFetch('/api/sessions', options);

      expect(global.fetch).toHaveBeenCalledWith('/api/sessions', options);
    });
  });

  describe('apiFetcher', () => {
    it('should return parsed JSON for successful requests', async () => {
      const mockResponse = new Response(JSON.stringify({ wpm: 75, accuracy: 98 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const data = await apiFetcher('/api/stats');

      expect(data).toEqual({ wpm: 75, accuracy: 98 });
    });

    it('should throw error with status and info for failed requests', async () => {
      const mockResponse = new Response(
        JSON.stringify({ error: 'Invalid parameters' }),
        {
          status: 400,
        }
      );

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      try {
        await apiFetcher('/api/stats');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBe('API request failed');
        expect(error.status).toBe(400);
        expect(error.info).toEqual({ error: 'Invalid parameters' });
      }
    });

    it('should redirect on 401 status (via apiFetch)', async () => {
      const mockResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      // Start the fetcher
      const fetchPromise = apiFetcher('/api/stats');

      // Wait for redirect
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockLocation.href).toBe('/sign-in?redirect=%2Fdashboard%2Fstats%3Ftab%3Doverview');

      // The promise should never resolve
      const raceResult = await Promise.race([
        fetchPromise,
        new Promise((resolve) => setTimeout(() => resolve('timeout'), 100)),
      ]);

      expect(raceResult).toBe('timeout');
    });

    it('should handle non-JSON error responses gracefully', async () => {
      const mockResponse = new Response('Server Error', {
        status: 500,
      });

      // Mock json() to throw an error
      mockResponse.json = vi.fn().mockRejectedValue(new Error('Invalid JSON'));

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      try {
        await apiFetcher('/api/stats');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBe('API request failed');
        expect(error.status).toBe(500);
        expect(error.info).toEqual({}); // Falls back to empty object
      }
    });
  });
});
