import { createFileRoute } from "@tanstack/react-router";

// Proxy ke MPWA (app.ayopintar.com) untuk bypass CORS browser.
// Path: /api/public/mpwa/generate-qr atau /api/public/mpwa/send-message
const MPWA_BASE = "https://app.ayopintar.com";
const ALLOWED = new Set(["generate-qr", "send-message"]);

async function forward(request: Request, splat: string) {
  if (!ALLOWED.has(splat)) {
    return new Response("Endpoint tidak diizinkan", { status: 404 });
  }
  const body = await request.text();
  const upstream = await fetch(`${MPWA_BASE}/${splat}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body,
  });
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

export const Route = createFileRoute("/api/public/mpwa/$")({
  server: {
    handlers: {
      POST: async ({ request, params }) => forward(request, params._splat ?? ""),
    },
  },
});
