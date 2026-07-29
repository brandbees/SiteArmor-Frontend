import type { MetadataRoute } from "next";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://snapshotai.brandbees.net";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/login",
        "/register",
        "/master",
        "/api",
        "/portal",
        "/client-portal",
        "/checkout",
        "/onboarding",
        "/invite",
      ],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
