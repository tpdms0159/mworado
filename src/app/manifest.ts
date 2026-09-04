import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "뭐라도해야지",
    short_name: "뭐라도",
    description: "완벽하지 않아도 돼. 오늘 뭐라도 하나만.",
    start_url: "/today",
    display: "standalone",
    background_color: "#F5F3EF",
    theme_color: "#3B6B4F",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
