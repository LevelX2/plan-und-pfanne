const CACHE_NAME = "plan-und-pfanne-offline-v2";
const APP_SHELL = ["/", "/rezepte", "/einkaufsliste", "/manifest.webmanifest", "/icon", "/apple-icon"];
const OFFLINE_FALLBACKS = ["/", "/rezepte"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.all(
          APP_SHELL.map((url) => cache.add(new Request(url, { cache: "reload" }))),
        ),
      )
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }

          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          if (cachedPage) {
            return cachedPage;
          }

          for (const fallback of OFFLINE_FALLBACKS) {
            const fallbackResponse = await caches.match(fallback);
            if (fallbackResponse) {
              return fallbackResponse;
            }
          }

          return new Response("Offline nicht verfügbar.", {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
            },
          });
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(async (cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const response = await fetch(request);
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }

        return response;
      } catch {
        return Response.error();
      }
    }),
  );
});
