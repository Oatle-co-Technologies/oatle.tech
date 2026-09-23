import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Oatle Dashboard",
    short_name: "Oatle",
    description: "Oatle Technologies work dashboard",
    start_url: "/dashboard",
    scope: "/dashboard",
    display: "standalone",
    orientation: "any",

    background_color: "#0A0A0A",
    theme_color: "#0A0A0A",

    lang: "en-ZA",
    dir: "ltr",

    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],

    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Open the Oatle dashboard",
        url: "/dashboard",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Tasks",
        short_name: "Tasks",
        description: "View and manage tasks",
        url: "/dashboard/tasks",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Leads",
        short_name: "Leads",
        description: "View and manage leads",
        url: "/dashboard/leads",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  };
}