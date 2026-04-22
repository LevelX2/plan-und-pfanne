import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Plan und Pfanne",
    short_name: "Plan & Pfanne",
    description: "Installierbare Koch- und Wochenplan-App mit offline verfuegbaren Rezepten und Einkaufsliste.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f5f1e8",
    theme_color: "#144c39",
    lang: "de-DE",
    categories: ["food", "lifestyle", "health"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon.png",
        sizes: "1254x1254",
        type: "image/png",
      },
    ],
  };
}
