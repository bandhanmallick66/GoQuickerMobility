import type { NextConfig } from "next";

// Static export for previews (PREVIEW_EXPORT=1). The full app keeps server features.
const previewExport = process.env.PREVIEW_EXPORT === "1";

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BUILD_YEAR: String(new Date().getFullYear()) },
  ...(previewExport ? { output: "export" as const, images: { unoptimized: true } } : {}),
  // Basic hardening for the live site (a static preview export can't set headers).
  ...(previewExport
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                // Keeps shared-trip links and ride ids out of other sites' logs.
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                { key: "X-Frame-Options", value: "DENY" },
                { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=()" },
                { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
              ],
            },
          ];
        },
      }),
  // Partial prerendering features are unavailable in static export mode.
  cacheComponents: !previewExport,
  partialPrefetching: !previewExport,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
