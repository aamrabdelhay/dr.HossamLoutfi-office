import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/locations", "/lawyers", "/calendar", "/sessions", "/search", "/lawyer-guide", "/case-archive"];
  return routes.map((r) => ({ url: r, changeFrequency: "daily" as const, priority: r === "/" ? 1 : 0.7 }));
}
