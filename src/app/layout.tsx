import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "./pwa-register";

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
  description: "Wochenplanung, Rezepte und Einkaufsliste für den Alltag und unterwegs.",
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
  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
