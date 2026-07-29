import type { MetadataRoute } from "next";
import { FEATURE_PAGES } from "@/lib/marketing/features";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://snapshotai.brandbees.net";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = [
    "",
    "/features",
    "/pricing",
    "/how-it-works",
    "/for/agencies",
    "/for/freelancers",
    "/wordpress-plugin",
    "/trust",
    "/about",
    "/contact",
    "/legal/privacy",
    "/legal/terms",
    "/legal/cookies",
    "/legal/gdpr",
  ];

  return [
    ...staticRoutes.map((path) => ({
      url: `${SITE}${path || "/"}`,
      lastModified: now,
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path.startsWith("/legal") ? 0.3 : 0.7,
    })),
    ...FEATURE_PAGES.map((f) => ({
      url: `${SITE}${f.href}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
