// sitemap.xml — Next.js metadata route. Lists the public crawlable
// surfaces only. Personal Pass URLs at /pass/[id] are deliberately
// excluded; they're for direct sharing, not search.

import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://jumpstart-khaki.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/signup`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
