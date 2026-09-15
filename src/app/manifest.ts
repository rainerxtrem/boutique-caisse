import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "La Boutique",
    short_name: "La Boutique",
    description: "Catalogue, commandes et espace fidélité de La Boutique",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7f9",
    theme_color: "#146c53",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
