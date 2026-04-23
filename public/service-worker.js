const CACHE_NAME = "plan-und-pfanne-offline-v3";

function getScopePath() {
  try {
    const scopeUrl = self.registration?.scope ?? `${self.location.origin}/`;
    const pathname = new URL(scopeUrl).pathname.replace(/\/+$/, "");
    return pathname === "/" ? "" : pathname;
  } catch {
    return "";
  }
}

function toAppPath(pathname) {
  if (!pathname || pathname === "/") {
    return `${getScopePath()}/` || "/";
  }

  const normalized = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  const scopePath = getScopePath();

  return scopePath ? `${scopePath}/${normalized}` : `/${normalized}`;
}

function isWithinAppScope(url) {
  const scopePath = getScopePath();

  if (!scopePath) {
    return true;
  }

  return url.pathname === scopePath || url.pathname.startsWith(`${scopePath}/`);
}

function getAppShell() {
  return [
    toAppPath("/"),
    toAppPath("/rezepte/"),
    toAppPath("/einkaufsliste/"),
    toAppPath("/manifest.webmanifest"),
    toAppPath("/icon-192.png"),
    toAppPath("/icon-512.png"),
    toAppPath("/apple-icon"),
  ];
}

function getOfflineFallbacks() {
  return [toAppPath("/"), toAppPath("/rezepte/")];
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.all(
          getAppShell().map((url) => cache.add(new Request(url, { cache: "reload" }))),
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
  if (url.origin !== self.location.origin || !isWithinAppScope(url)) {
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
          const cachedPage = await caches.match(request, { ignoreSearch: true });
          if (cachedPage) {
            return cachedPage;
          }

          for (const fallback of getOfflineFallbacks()) {
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
