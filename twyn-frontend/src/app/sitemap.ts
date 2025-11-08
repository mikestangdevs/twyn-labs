import { MetadataRoute } from "next"

export default async function Sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: "https://twyn.it",
      lastModified: new Date().toISOString(),
    },
  ]
}