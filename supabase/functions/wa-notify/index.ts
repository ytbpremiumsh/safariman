import { corsHeaders, json } from "../_shared/cors.ts";
import { sendWaForEvent, type WaEvent } from "../_shared/wa.ts";
import { requireAdmin } from "../_shared/admin-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, { status: 405 });

  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { event, code } = (await req.json()) as { event?: WaEvent; code?: string };
    if (!event || !["pendaftaran", "berkas", "essay"].includes(event)) {
      return json({ ok: false, error: "event invalid" }, { status: 400 });
    }
    if (!code || !/^[A-Za-z0-9-]{4,32}$/.test(code)) {
      return json({ ok: false, error: "kode tidak valid" }, { status: 400 });
    }
    const result = await sendWaForEvent(event, code);
    return json(result);
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
});
