import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/requests/", "/requests"],
      },
    ],
    sitemap: "https://twyn.it/sitemap.xml",
  }
}