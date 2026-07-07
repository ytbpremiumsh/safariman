// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://safariman.my.id";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const today = new Date().toISOString().slice(0, 10);

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0", lastmod: today },
  { path: "/tentang", changefreq: "monthly", priority: "0.8", lastmod: today },
  { path: "/daftar", changefreq: "weekly", priority: "0.9", lastmod: today },
  { path: "/daftar-gelombang-1", changefreq: "weekly", priority: "0.9", lastmod: today },
  { path: "/daftar-gelombang-2", changefreq: "weekly", priority: "0.9", lastmod: today },
  { path: "/daftar-mandiri", changefreq: "weekly", priority: "0.9", lastmod: today },
  { path: "/twibbon", changefreq: "monthly", priority: "0.6", lastmod: today },
  { path: "/faq", changefreq: "monthly", priority: "0.7", lastmod: today },
];

function generateSitemap(items: SitemapEntry[]) {
  const urls = items.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
