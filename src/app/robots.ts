import type { MetadataRoute } from "next";

// نظام داخلي — منع فهرسة المسارات الحساسة
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: ["/admin", "/api/", "/uploads/", "/access/", "/notifications", "/auth"],
        allow: ["/", "/locations", "/lawyers", "/sessions", "/calendar", "/search", "/lawyer-guide", "/case-archive"],
      },
    ],
    sitemap: "/sitemap.xml",
  };
}
