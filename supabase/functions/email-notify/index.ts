import { corsHeaders, json } from "../_shared/cors.ts";
import { sendEmailForEvent, type EmailEvent } from "../_shared/email.ts";

// Public endpoint: dipanggil dari halaman sukses pendaftaran/berkas/essay/kontribusi.
// Akses digating oleh registration_code milik peserta.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, { status: 405 });

  try {
    const { event, code } = (await req.json()) as { event?: EmailEvent; code?: string };
    if (!event || !["pendaftaran", "berkas", "essay", "kontribusi"].includes(event)) {
      return json({ ok: false, error: "event invalid" }, { status: 400 });
    }
    if (!code || !/^[A-Za-z0-9-]{4,32}$/.test(code)) {
      return json({ ok: false, error: "kode tidak valid" }, { status: 400 });
    }
    const result = await sendEmailForEvent(event, code);
    return json(result);
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
});
