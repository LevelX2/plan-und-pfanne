"use client";

import { useEffect } from "react";
import { requestPersistentStorage } from "@/lib/offline-store";

const OFFLINE_CACHE_PREFIX = "plan-und-pfanne-offline";

function normalizeBasePath(value: string | undefined) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") {
    return "";
  }

  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
}

export function PwaRegister() {
  useEffect(() => {
    void requestPersistentStorage();

    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister())),
        )
        .catch(() => undefined);

      if ("caches" in window) {
        void caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys
                .filter((key) => key.startsWith(OFFLINE_CACHE_PREFIX))
                .map((key) => caches.delete(key)),
            ),
          )
          .catch(() => undefined);
      }

      return;
    }

    const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);
    const scope = basePath ? `${basePath}/` : "/";
    const serviceWorkerUrl = `${basePath}/service-worker.js` || "/service-worker.js";

    navigator.serviceWorker
      .register(serviceWorkerUrl, { scope })
      .then((registration) => registration.update())
      .catch((error) => {
        console.error("Service Worker konnte nicht registriert werden.", error);
      });
  }, []);

  return null;
}
