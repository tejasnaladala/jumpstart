// robots.txt — Next.js metadata route. Public surfaces are crawlable;
// authed shell, admin, API, and personal Pass URLs are blocked.
//
// /pass/[id] is intentionally noindex via the route's metadata
// (defense in depth) AND blocked here so search engines don't even fetch
// the canonical URL. Personal Pass pages are for direct sharing, not
// search results.

import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://jumpstart-khaki.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/signup"],
        disallow: [
          "/api/",
          "/admin/",
          "/onboarding/",
          "/drop",
          "/browse",
          "/inbox",
          "/you",
          "/match/",
          "/pass/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
