import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pubgolf",
    short_name: "Pubgolf",
    description: "Von Bar zu Bar, PAR für PAR — das Trinkspiel für deine Gruppe.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#F97316",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
