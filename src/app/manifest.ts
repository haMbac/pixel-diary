import type { MetadataRoute } from "next";

// "Pridat na plochu" na mobile - appka sa potom otvara ako samostatna
// aplikacia (bez listy prehliadaca) s vlastnou ikonou a menom. Farby =
// --paper z globals.css (pozadie pri spustani).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pixel diár",
    short_name: "Pixel diár",
    description: "Rok v pixeloch - nálady, návyky a zoznamy.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5f0",
    theme_color: "#f7f5f0",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
