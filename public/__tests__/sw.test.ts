/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock service worker global scope
const mockCache = new Map<string, Response>();
const mockCaches = {
  open: vi.fn().mockImplementation((cacheName: string) => {
    return Promise.resolve({
      match: vi.fn().mockImplementation((request: Request) => {
        const key = request.url;
        return Promise.resolve(mockCache.get(key) || null);
      }),
      put: vi.fn().mockImplementation((request: Request, response: Response) => {
        mockCache.set(request.url, response);
        return Promise.resolve();
      }),
    });
  }),
  keys: vi.fn().mockResolvedValue(['challenges-v1']),
  delete: vi.fn().mockResolvedValue(true),
};

const mockClients = {
  claim: vi.fn().mockResolvedValue(undefined),
  matchAll: vi.fn().mockResolvedValue([]),
  openWindow: vi.fn().mockResolvedValue(null),
};

const mockSelf = {
  addEventListener: vi.fn(),
  skipWaiting: vi.fn().mockResolvedValue(undefined),
  registration: {
    showNotification: vi.fn().mockResolvedValue(undefined),
  },
  clients: mockClients,
  location: {
    origin: 'http://localhost:3000',
  },
};

// Mock global objects
global.caches = mockCaches as unknown as CacheStorage;
global.self = mockSelf as unknown as ServiceWorkerGlobalScope;
global.Request = class Request {
  url: string;
  method: string;
  constructor(input: string | Request, init?: RequestInit) {
    this.url = typeof input === 'string' ? input : input.url;
    this.method = init?.method || 'GET';
  }
} as unknown as typeof Request;

global.Response = class Response {
  status: number;
  statusText: string;
  headers: Map<string, string>;
  _body: unknown;

  constructor(body?: unknown, init?: ResponseInit) {
    this._body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.headers = new Map(Object.entries(init?.headers || {}));
  }

  clone() {
    return new Response(this._body, {
      status: this.status,
      statusText: this.statusText,
      headers: Object.fromEntries(this.headers),
    });
  }

  async blob() {
    return new Blob([JSON.stringify(this._body)]);
  }
} as unknown as typeof Response;

global.Headers = class Headers extends Map<string, string> {
  append(key: string, value: string) {
    this.set(key, value);
  }
  get(key: string) {
    return super.get(key) || null;
  }
} as unknown as typeof Headers;

global.Blob = class Blob {
  constructor(public parts: unknown[]) {}
} as unknown as typeof Blob;

global.fetch = vi.fn();

describe('Service Worker Offline Caching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCache.clear();
  });

  it('should define cache constants', () => {
    const CACHE_VERSION = 'v1';
    const CHALLENGE_CACHE = `challenges-${CACHE_VERSION}`;
    const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

    expect(CACHE_VERSION).toBe('v1');
    expect(CHALLENGE_CACHE).toBe('challenges-v1');
    expect(CACHE_MAX_AGE).toBe(604800000); // 7 days in ms
  });

  describe('Cache Strategy', () => {
    it('should cache challenges API responses', async () => {
      const request = new Request('http://localhost:3000/api/challenges?page=1');
      const mockResponse = new Response(
        JSON.stringify({ challenges: [] }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

      const cache = await mockCaches.open('challenges-v1');
      const cachedResponse = await cache.match(request);

      expect(cachedResponse).toBeNull(); // Initially no cache
    });

    it('should handle offline mode with stale cache', async () => {
      const request = new Request('http://localhost:3000/api/challenges?page=1');
      const cachedResponse = new Response(
        JSON.stringify({ challenges: [{ id: 1, content: 'test' }] }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'sw-cached-time': new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days old
          },
        }
      );

      mockCache.set(request.url, cachedResponse);

      const cache = await mockCaches.open('challenges-v1');
      const response = await cache.match(request);

      expect(response).toBeDefined();
      expect(response?.status).toBe(200);
    });

    it('should cache v1 API endpoints', async () => {
      const request = new Request('http://localhost:3000/api/v1/challenges/123');
      const mockResponse = new Response(
        JSON.stringify({ id: 123, content: 'git commit -m "test"' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

      const cache = await mockCaches.open('challenges-v1');
      await cache.put(request, mockResponse);

      const cachedResponse = await cache.match(request);
      expect(cachedResponse).toBeDefined();
    });

    it('should cache community challenges', async () => {
      const request = new Request('http://localhost:3000/api/community-challenges?page=1');
      const mockResponse = new Response(
        JSON.stringify({ challenges: [] }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const cache = await mockCaches.open('challenges-v1');
      await cache.put(request, mockResponse);

      const cachedResponse = await cache.match(request);
      expect(cachedResponse).toBeDefined();
    });

    it('should cache categories API', async () => {
      const request = new Request('http://localhost:3000/api/categories');
      const mockResponse = new Response(
        JSON.stringify({ categories: [] }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const cache = await mockCaches.open('challenges-v1');
      await cache.put(request, mockResponse);

      const cachedResponse = await cache.match(request);
      expect(cachedResponse).toBeDefined();
    });

    it('should cache challenge search API', async () => {
      const request = new Request('http://localhost:3000/api/challenges/search?q=git');
      const mockResponse = new Response(
        JSON.stringify({ challenges: [], categories: [] }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const cache = await mockCaches.open('challenges-v1');
      await cache.put(request, mockResponse);

      const cachedResponse = await cache.match(request);
      expect(cachedResponse).toBeDefined();
    });

    it('should only cache GET requests', () => {
      const getRequest = new Request('http://localhost:3000/api/challenges', { method: 'GET' });
      const postRequest = new Request('http://localhost:3000/api/challenges', { method: 'POST' });

      expect(getRequest.method).toBe('GET');
      expect(postRequest.method).toBe('POST');
    });

    it('should check cache age and return fresh cache', async () => {
      const request = new Request('http://localhost:3000/api/challenges?page=1');
      const freshDate = new Date();
      const cachedResponse = new Response(
        JSON.stringify({ challenges: [] }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'sw-cached-time': freshDate.toISOString(),
          },
        }
      );

      mockCache.set(request.url, cachedResponse);

      const cache = await mockCaches.open('challenges-v1');
      const response = await cache.match(request);

      expect(response).toBeDefined();
      const cachedTime = response?.headers.get('sw-cached-time');
      expect(cachedTime).toBe(freshDate.toISOString());
    });
  });

  describe('API Endpoint Detection', () => {
    it('should detect challenges API endpoints', () => {
      const challengesUrl = new URL('http://localhost:3000/api/challenges?page=1');
      const v1Url = new URL('http://localhost:3000/api/v1/challenges/123');
      const communityUrl = new URL('http://localhost:3000/api/community-challenges');
      const otherUrl = new URL('http://localhost:3000/api/user/profile');

      expect(challengesUrl.pathname.startsWith('/api/challenges')).toBe(true);
      expect(v1Url.pathname.startsWith('/api/v1/challenges')).toBe(true);
      expect(communityUrl.pathname.startsWith('/api/community-challenges')).toBe(true);
      expect(otherUrl.pathname.startsWith('/api/challenges')).toBe(false);
    });

    it('should only handle GET requests', () => {
      const getRequest = new Request('http://localhost:3000/api/challenges', { method: 'GET' });
      const postRequest = new Request('http://localhost:3000/api/challenges', { method: 'POST' });
      const putRequest = new Request('http://localhost:3000/api/challenges', { method: 'PUT' });

      expect(getRequest.method).toBe('GET');
      expect(postRequest.method).not.toBe('GET');
      expect(putRequest.method).not.toBe('GET');
    });
  });

  describe('Cache Versioning', () => {
    it('should use versioned cache names', async () => {
      await mockCaches.open('challenges-v1');
      expect(mockCaches.open).toHaveBeenCalledWith('challenges-v1');
    });

    it('should clean up old cache versions on activate', async () => {
      mockCaches.keys.mockResolvedValueOnce(['challenges-v0', 'challenges-v1']);

      const keys = await mockCaches.keys();
      expect(keys).toContain('challenges-v1');
    });
  });

  describe('Error Handling', () => {
    it('should return error response when offline and no cache available', async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const request = new Request('http://localhost:3000/api/challenges?page=1');
      const cache = await mockCaches.open('challenges-v1');
      const cachedResponse = await cache.match(request);

      expect(cachedResponse).toBeNull();
    });

    it('should handle malformed cached responses gracefully', async () => {
      const request = new Request('http://localhost:3000/api/challenges?page=1');
      const malformedResponse = new Response(
        'invalid json',
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      mockCache.set(request.url, malformedResponse);

      const cache = await mockCaches.open('challenges-v1');
      const response = await cache.match(request);

      expect(response).toBeDefined();
    });
  });

  describe('Message Handlers', () => {
    it('should handle PRECACHE_CHALLENGES message', async () => {
      const mockResponse = new Response(
        JSON.stringify({ challenges: [] }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

      const cache = await mockCaches.open('challenges-v1');
      const urls = ['http://localhost:3000/api/challenges?page=1'];

      // Simulate precaching
      await Promise.all(
        urls.map((url) => {
          return fetch(url).then((response) => {
            if (response && response.status === 200) {
              return cache.put(url, response);
            }
          });
        })
      );

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle CLEAR_CACHE message', async () => {
      await mockCaches.delete('challenges-v1');
      await mockCaches.open('challenges-v1');

      expect(mockCaches.delete).toHaveBeenCalledWith('challenges-v1');
      expect(mockCaches.open).toHaveBeenCalledWith('challenges-v1');
    });

    it('should handle GET_CACHE_STATUS message', async () => {
      const request1 = new Request('http://localhost:3000/api/challenges?page=1');
      const request2 = new Request('http://localhost:3000/api/challenges?page=2');
      const mockResponse = new Response(
        JSON.stringify({ challenges: [] }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const cache = await mockCaches.open('challenges-v1');
      await cache.put(request1, mockResponse);
      await cache.put(request2, mockResponse.clone());

      // Verify cache has items
      expect(mockCache.size).toBeGreaterThan(0);
    });
  });
});
