const CACHE_NAME = 'ecs-workbench-v2.5.2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

// Install Event - Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching static assets non-blocking error:', err);
      });
    })
  );
});

// Activate Event - Clean up stale outdated caches immediately and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Clearing old ECS cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Message listener for user-triggered update ('SKIP_WAITING')
self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'SKIP_WAITING' || event.data.type === 'CLEAR_AND_SKIP_WAITING')) {
    self.skipWaiting();
  }
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension / dev-internal requests
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // 1. For API calls (e.g. Gemini AI prompts / health / version), always use network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            offline: true,
            message: 'You are currently offline in the field. Local simulation, library, and wire sheet features work 100% offline.',
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      })
    );
    return;
  }

  // 2. For HTML Documents & Navigation Requests: NETWORK-FIRST with fast timeout fallback to cached app shell
  const isHtmlNavigation =
    request.mode === 'navigate' ||
    (request.headers.get('accept') && request.headers.get('accept').includes('text/html'));

  if (isHtmlNavigation) {
    event.respondWith(
      new Promise((resolve) => {
        let didResolve = false;

        // Fast 3-second timeout fallback: if Cloud Run container cold start is delayed, immediately serve cached shell
        const timeoutId = setTimeout(() => {
          if (!didResolve) {
            caches.match('/index.html').then((cached) => {
              if (cached && !didResolve) {
                didResolve = true;
                resolve(cached);
              }
            });
          }
        }, 3000);

        fetch(request)
          .then((networkResponse) => {
            clearTimeout(timeoutId);
            if (!didResolve) {
              didResolve = true;
              if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              resolve(networkResponse);
            }
          })
          .catch(() => {
            clearTimeout(timeoutId);
            if (!didResolve) {
              didResolve = true;
              caches.match('/index.html').then((cached) => {
                resolve(cached || caches.match('/') || new Response('App Loading...', { headers: { 'Content-Type': 'text/html' } }));
              });
            }
          });
      })
    );
    return;
  }

  // 3. For Static Assets (JS, CSS, SVGs, Fonts): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse || null);

      return cachedResponse || fetchPromise;
    })
  );
});
