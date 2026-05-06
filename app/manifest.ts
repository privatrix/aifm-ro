import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AIFM – Radio AI Românesc",
    short_name: "AIFM",
    description: "Radio AI 24/7. Vio nu doarme.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0620",
    theme_color: "#E91E8C",
    orientation: "portrait",
    categories: ["music", "entertainment"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
