"use client";

import { useEffect } from "react";
import { requestPersistentStorage } from "@/lib/offline-store";

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
    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
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

    void requestPersistentStorage();
  }, []);

  return null;
}
