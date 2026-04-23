import type { MetadataRoute } from "next";

export const dynamic = "force-static";

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

export default function manifest(): MetadataRoute.Manifest {
  const appStartUrl = withBasePath("/");

  return {
    name: "Plan und Pfanne",
    short_name: "Plan & Pfanne",
    description:
      "Installierbare Koch- und Wochenplan-App mit offline verfügbaren Rezepten, Dashboard und Einkaufsliste.",
    id: appStartUrl,
    start_url: appStartUrl,
    scope: appStartUrl,
    display: "standalone",
    background_color: "#f5f1e8",
    theme_color: "#144c39",
    lang: "de-DE",
    categories: ["food", "lifestyle", "health"],
    icons: [
      {
        src: withBasePath("/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBasePath("/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBasePath("/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: withBasePath("/apple-icon"),
        sizes: "1254x1254",
        type: "image/png",
      },
    ],
  };
}
