import { corsHeaders, json } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/admin-auth.ts";

// Proxy ke MPWA (app.ayopintar.com) untuk bypass CORS browser.
// Body: { endpoint: "generate-qr" | "send-message", payload: object }
// Hanya admin yang boleh memanggil endpoint ini.
const MPWA_BASE = "https://app.ayopintar.com";
const ALLOWED = new Set(["generate-qr", "send-message", "delete-device"]);

function normalizeDevice(raw: unknown): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("8")) return "62" + digits;
  return digits;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, { status: 405 });

  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { endpoint, payload } = (await req.json()) as { endpoint?: string; payload?: Record<string, unknown> };
    if (!endpoint || !ALLOWED.has(endpoint)) {
      return json({ ok: false, error: "Endpoint tidak diizinkan" }, { status: 404 });
    }

    // Normalize device / number to 62xxx format expected by MPWA.
    const body: Record<string, unknown> = { ...(payload ?? {}) };
    if (body.device !== undefined) body.device = normalizeDevice(body.device);
    if (body.sender !== undefined) body.sender = normalizeDevice(body.sender);
    if (body.number !== undefined) body.number = normalizeDevice(body.number);

    let upstream: Response;
    if (endpoint === "generate-qr") {
      // MPWA's /generate-qr expects GET with query params (?api_key=...&device=...).
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(body)) {
        if (v !== undefined && v !== null) qs.set(k, String(v));
      }
      upstream = await fetch(`${MPWA_BASE}/${endpoint}?${qs.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
    } else {
      upstream = await fetch(`${MPWA_BASE}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
    }

    const text = await upstream.text();
    // MPWA returns non-2xx for informational responses like
    // "Perangkat sudah terhubung!". Forward JSON payloads as 200 so the
    // client can read the message instead of throwing FunctionsHttpError.
    const contentType = upstream.headers.get("content-type") ?? "application/json";
    const isJson = contentType.includes("application/json") || text.trim().startsWith("{");
    return new Response(text, {
      status: isJson ? 200 : upstream.status,
      headers: { ...corsHeaders, "content-type": contentType },
    });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
});
