import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 0,
    // Omit `search` to allow any ?v= hash on snapshot URLs
    localPatterns: [
      { pathname: "/snapshots/**" },
      { pathname: "/**" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/features/ai-optimization",
        destination: "/features/performance-monitoring",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
