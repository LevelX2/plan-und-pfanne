import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "./pwa-register";

function getDevelopmentServiceWorkerResetScript() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return `(() => {
    const isLocalhost =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

    if (!isLocalhost) {
      return;
    }

    const resetKey = "__plan_und_pfanne_dev_sw_reset__";
    if (sessionStorage.getItem(resetKey) === "done") {
      return;
    }

    const registrationsPromise =
      "serviceWorker" in navigator
        ? navigator.serviceWorker.getRegistrations()
        : Promise.resolve([]);
    const cacheKeysPromise = "caches" in window ? caches.keys() : Promise.resolve([]);

    Promise.all([registrationsPromise, cacheKeysPromise])
      .then(([registrations, cacheKeys]) => {
        const offlineCacheKeys = cacheKeys.filter((key) =>
          key.startsWith("plan-und-pfanne-offline"),
        );

        if (!registrations.length && !offlineCacheKeys.length) {
          return;
        }

        sessionStorage.setItem(resetKey, "done");

        return Promise.all([
          Promise.all(registrations.map((registration) => registration.unregister())),
          Promise.all(offlineCacheKeys.map((key) => caches.delete(key))),
        ]).then(() => {
          window.location.reload();
        });
      })
      .catch(() => {
        sessionStorage.removeItem(resetKey);
      });
  })();`;
}

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

function withBasePath(pathname: string) {
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH)}${normalizedPathname}` || "/";
}

function getMetadataBase() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return undefined;
  }

  try {
    return new URL(siteUrl);
  } catch {
    return undefined;
  }
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Plan und Pfanne",
  description: "Tagesplanung, Rezepte und Einkaufsliste für den Alltag und unterwegs.",
  metadataBase: getMetadataBase(),
  manifest: withBasePath("/manifest.webmanifest"),
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Plan und Pfanne",
  },
};

export const viewport: Viewport = {
  themeColor: "#144c39",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const developmentServiceWorkerResetScript = getDevelopmentServiceWorkerResetScript();

  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {developmentServiceWorkerResetScript ? (
          <script
            dangerouslySetInnerHTML={{ __html: developmentServiceWorkerResetScript }}
          />
        ) : null}
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
