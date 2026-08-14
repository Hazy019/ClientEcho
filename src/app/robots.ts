import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://clientecho.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/embed/", "/privacy", "/terms", "/login", "/signup"],
        disallow: ["/api/", "/admin/", "/dashboard/", "/widgets/", "/testimonials/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
