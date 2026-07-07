// SEO helper for TanStack Router `head()` API.
// Returns meta + links entries with canonical, OpenGraph, Twitter, and optional JSON-LD.

const SITE = "https://safariman.my.id";
const DEFAULT_OG =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/9005f625-04d9-4e34-a478-538502135623";

export interface SeoOptions {
  title: string;
  description: string;
  path: string; // "/", "/tentang", ...
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function seoHead(opts: SeoOptions) {
  const url = `${SITE}${opts.path}`;
  const image = opts.image ?? DEFAULT_OG;

  const meta: Array<Record<string, string>> = [
    { title: opts.title },
    { name: "description", content: opts.description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Safar Iman" },
    { property: "og:url", content: url },
    { property: "og:title", content: opts.title },
    { property: "og:description", content: opts.description },
    { property: "og:image", content: image },
    { property: "og:locale", content: "id_ID" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: opts.title },
    { name: "twitter:description", content: opts.description },
    { name: "twitter:image", content: image },
  ];
  if (opts.noindex) meta.push({ name: "robots", content: "noindex, follow" });

  const links: Array<Record<string, string>> = [
    { rel: "canonical", href: url },
  ];

  const ldArr = opts.jsonLd
    ? Array.isArray(opts.jsonLd)
      ? opts.jsonLd
      : [opts.jsonLd]
    : [];
  const scripts = ldArr.map((obj) => ({
    type: "application/ld+json",
    children: JSON.stringify(obj),
  }));

  return { meta, links, scripts };
}
