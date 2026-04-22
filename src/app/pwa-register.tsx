"use client";

import { useEffect } from "react";
import { requestPersistentStorage } from "@/lib/offline-store";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
      return;
    }

    navigator.serviceWorker.register("/service-worker.js").catch((error) => {
      console.error("Service Worker konnte nicht registriert werden.", error);
    });

    void requestPersistentStorage();
  }, []);

  return null;
}
