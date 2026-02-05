/// <reference lib="webworker" />

const CACHE_VERSION = 'v1';
const CHALLENGE_CACHE = `challenges-${CACHE_VERSION}`;
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Install event - prepare caches
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CHALLENGE_CACHE).then(() => {
      self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('challenges-') && name !== CHALLENGE_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - cache-first strategy for challenges API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only cache GET requests to challenges and categories API endpoints
  if (
    event.request.method === 'GET' &&
    (url.pathname.startsWith('/api/challenges') ||
     url.pathname.startsWith('/api/v1/challenges') ||
     url.pathname.startsWith('/api/community-challenges') ||
     url.pathname.startsWith('/api/categories') ||
     url.pathname.startsWith('/api/team/custom-challenges'))
  ) {
    event.respondWith(
      caches.open(CHALLENGE_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // Check if cached response is still valid
          if (cachedResponse) {
            const cachedTime = new Date(cachedResponse.headers.get('sw-cached-time') || 0);
            const now = new Date();
            const age = now - cachedTime;

            // If cache is still fresh, return it immediately
            // Also try to update in background
            if (age < CACHE_MAX_AGE) {
              // Background update
              fetch(event.request)
                .then((networkResponse) => {
                  if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    const headers = new Headers(responseToCache.headers);
                    headers.append('sw-cached-time', now.toISOString());

                    responseToCache.blob().then((blob) => {
                      const cachedResponseWithTime = new Response(blob, {
                        status: responseToCache.status,
                        statusText: responseToCache.statusText,
                        headers: headers,
                      });
                      cache.put(event.request, cachedResponseWithTime);
                    });
                  }
                })
                .catch(() => {
                  // Network failed, but we have cache
                });

              return cachedResponse;
            }
          }

          // No valid cache, fetch from network
          return fetch(event.request)
            .then((networkResponse) => {
              if (!networkResponse || networkResponse.status !== 200) {
                // If network fails and we have any cache (even stale), use it
                if (cachedResponse) {
                  return cachedResponse;
                }
                return networkResponse;
              }

              // Clone the response to cache it
              const responseToCache = networkResponse.clone();
              const headers = new Headers(responseToCache.headers);
              headers.append('sw-cached-time', new Date().toISOString());

              // Cache the new response
              responseToCache.blob().then((blob) => {
                const cachedResponseWithTime = new Response(blob, {
                  status: responseToCache.status,
                  statusText: responseToCache.statusText,
                  headers: headers,
                });
                cache.put(event.request, cachedResponseWithTime);
              });

              return networkResponse;
            })
            .catch(() => {
              // Network failed completely, return stale cache if available
              if (cachedResponse) {
                return cachedResponse;
              }
              // No cache available, return error response
              return new Response(
                JSON.stringify({
                  error: 'Offline - no cached data available',
                  offline: true
                }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'application/json' },
                }
              );
            });
        });
      })
    );
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || 'Time to practice!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'streak-reminder',
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Sokudo', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// Message event - handle pre-caching requests
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PRECACHE_CHALLENGES') {
    event.waitUntil(
      caches.open(CHALLENGE_CACHE).then((cache) => {
        const urls = event.data.urls || [];
        return Promise.allSettled(
          urls.map((url) => {
            return fetch(url)
              .then((response) => {
                if (response && response.status === 200) {
                  const headers = new Headers(response.headers);
                  headers.append('sw-cached-time', new Date().toISOString());

                  return response.blob().then((blob) => {
                    const cachedResponse = new Response(blob, {
                      status: response.status,
                      statusText: response.statusText,
                      headers: headers,
                    });
                    return cache.put(url, cachedResponse);
                  });
                }
              })
              .catch((error) => {
                console.error('Failed to precache:', url, error);
              });
          })
        );
      })
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CHALLENGE_CACHE).then(() => {
        return caches.open(CHALLENGE_CACHE);
      })
    );
  }

  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    event.waitUntil(
      caches.open(CHALLENGE_CACHE).then((cache) => {
        return cache.keys().then((keys) => {
          const status = {
            cached: keys.length,
            version: CACHE_VERSION,
          };
          event.ports[0].postMessage(status);
        });
      })
    );
  }
});
