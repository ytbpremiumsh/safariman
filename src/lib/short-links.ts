// Reserve every existing top-level route, plus infrastructure paths.
const routeFiles = Object.keys(import.meta.glob("../routes/*.tsx"));
export const reservedSlugs = new Set([
  ...routeFiles.map((path) => path.split("/").pop()!.split(".")[0]),
  "admin", "staff", "go", "api", "assets", "public", "auth", "functions",
  "storage", "robots", "sitemap", "favicon", "www",
]);

export function validDestination(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) && !!url.hostname &&
      !url.username && !url.password &&
      !["safariman.id", "www.safariman.id", window.location.hostname].includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}
