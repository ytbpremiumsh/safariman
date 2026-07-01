import { corsHeaders, json } from "../_shared/cors.ts";
import { sendWaForEvent, type WaEvent } from "../_shared/wa.ts";

// Public endpoint: dipanggil dari halaman pendaftaran/berkas/essay/sukses
// setelah peserta submit — akses digating oleh registration_code (rahasia
// per-peserta yang baru saja diterbitkan). Rate-limiting dilakukan di
// tingkat Supabase Edge Runtime.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, { status: 405 });

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
