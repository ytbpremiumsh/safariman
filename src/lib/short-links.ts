// Reserve every existing top-level route, plus infrastructure paths.
const routeFiles = Object.keys(import.meta.glob("../routes/*.tsx"));
export const reservedSlugs = new Set([
  ...routeFiles.map((path) => path.split("/").pop()!.split(".")[0]),
  "admin", "staff", "go", "api", "assets", "public", "auth", "functions",
  "storage", "robots", "sitemap", "favicon", "www",
]);

export function validDestination(value: string, slug?: string): boolean {
  try {
    const url = new URL(value.trim());
    const internal = ["safariman.id", "www.safariman.id",
      ...(typeof window !== "undefined" ? [window.location.hostname] : []),
    ].includes(url.hostname.toLowerCase());
    const self = internal && slug && decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, "").toLowerCase() === slug.toLowerCase();
    return ["http:", "https:"].includes(url.protocol) && !!url.hostname &&
      !url.username && !url.password && !self;
  } catch {
    return false;
  }
}
