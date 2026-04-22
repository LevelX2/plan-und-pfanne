import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Glutenfreie Rezepte",
    short_name: "GF Rezepte",
    description: "Installierbare Rezept-App mit offline verfuegbaren glutenfreien Rezepten.",
    start_url: "/rezepte",
    scope: "/",
    display: "standalone",
    background_color: "#f5f1e8",
    theme_color: "#144c39",
    lang: "de-DE",
    categories: ["food", "lifestyle", "health"],
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
