/**
 * Client-side fetch wrapper that automatically redirects unauthorized users to login
 *
 * This module provides a fetch wrapper that intercepts 401 (Unauthorized) and 403 (Forbidden)
 * responses and redirects the user to the sign-in page instead of showing error messages.
 */

/**
 * Enhanced fetch that redirects to /sign-in on 401 or 403 responses
 *
 * @param input - URL or Request object
 * @param init - Fetch options
 * @returns Promise that resolves to Response
 * @throws Will redirect to /sign-in instead of returning 401/403 responses
 *
 * @example
 * ```typescript
 * const response = await apiFetch('/api/stats');
 * const data = await response.json();
 * ```
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init);

  // Redirect to sign-in page if unauthorized
  if (response.status === 401 || response.status === 403) {
    // Preserve current URL for redirect after login
    const currentPath = window.location.pathname + window.location.search;
    const redirectUrl = `/sign-in?redirect=${encodeURIComponent(currentPath)}`;
    window.location.href = redirectUrl;

    // Return a never-resolving promise to prevent further execution
    return new Promise(() => {});
  }

  return response;
}

/**
 * Fetcher function for use with SWR that handles authentication redirects
 *
 * @param url - URL to fetch
 * @returns Promise that resolves to parsed JSON data
 *
 * @example
 * ```typescript
 * const { data, error } = useSWR('/api/stats', apiFetcher);
 * ```
 */
export async function apiFetcher<T = any>(url: string): Promise<T> {
  const response = await apiFetch(url);

  if (!response.ok) {
    const error = new Error('API request failed');
    (error as any).status = response.status;
    (error as any).info = await response.json().catch(() => ({}));
    throw error;
  }

  return response.json();
}
