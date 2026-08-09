import type { MetadataRoute } from "next";
import { canonical } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Les routes d'API ne portent aucun contenu indexable et reçoivent des
      // données personnelles : on ne les propose pas au crawl.
      disallow: ["/api/"],
    },
    sitemap: canonical("/sitemap.xml"),
    host: canonical("/"),
  };
}
