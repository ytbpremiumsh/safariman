import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Webhook MPWA: menerima pesan WA masuk, jika AI aktif balas otomatis via Lovable AI Gateway.
// Konfigurasi webhook ini di dashboard MPWA (app.ayopintar.com) ke URL:
//   https://<domain>/api/public/mpwa-webhook
// Body MPWA biasanya: { sender, message, pushname, from } atau variannya.

const DEFAULT_BEHAVIOR = `Kamu adalah asisten WhatsApp resmi Safar Iman — program Umrah Gratis untuk anak muda berprestasi.
- Selalu sapa dengan "Assalamu'alaikum" pada pesan pertama.
- Jawab singkat, hangat, sopan, dan islami (1–4 kalimat).
- Gunakan bahasa Indonesia santai-formal.
- Jika pertanyaan di luar program Safar Iman, arahkan kembali ke topik program.
- Jangan mengarang fakta yang tidak ada di Knowledge. Jika tidak tahu, sarankan menghubungi admin.
- Jangan janjikan kelolosan, jangan minta data sensitif.`;

function extractIncoming(body: any) {
  // MPWA / WAPlugin variants
  const sender = body?.sender || body?.from || body?.number || body?.phone || body?.user || "";
  const message = body?.message || body?.text || body?.body || body?.msg || body?.content || "";
  const fromMe = body?.fromMe === true || body?.isFromMe === true || body?.self === true;
  const isGroup = (typeof sender === "string" && sender.includes("@g.us")) || body?.isGroup === true;
  const clean = String(sender).replace(/@s\.whatsapp\.net|@c\.us|@g\.us/g, "").replace(/\D/g, "");
  return { sender: clean, message: String(message || "").trim(), fromMe, isGroup };
}

async function callAi(systemPrompt: string, userMessage: string): Promise<string | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });
    if (!res.ok) {
      console.error("AI gateway error", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json: any = await res.json();
    return json?.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error("AI call failed", e);
    return null;
  }
}

async function sendWa(apiKey: string, sender: string, number: string, message: string) {
  try {
    await fetch("https://app.ayopintar.com/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        sender,
        number,
        message,
        footer: "Safar Iman · AI Assistant",
      }),
    });
  } catch (e) {
    console.error("MPWA send failed", e);
  }
}

export const Route = createFileRoute("/api/public/mpwa-webhook")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({ ok: true, info: "MPWA webhook for Safar Iman AI auto-reply" }),
      POST: async ({ request }) => {
        try {
          // SECURITY: shared-secret header check. Tanpa ini, siapa pun bisa
          // memicu app mengirim pesan WA ke nomor sembarang & menguras kuota AI.
          const expectedSecret = process.env.MPWA_WEBHOOK_SECRET;
          if (!expectedSecret) {
            console.error("MPWA_WEBHOOK_SECRET tidak dikonfigurasi");
            return Response.json({ ok: false, error: "Server misconfigured" }, { status: 500 });
          }
          const providedSecret =
            request.headers.get("x-mpwa-secret") ||
            request.headers.get("x-webhook-secret") ||
            new URL(request.url).searchParams.get("secret");
          if (!providedSecret || providedSecret !== expectedSecret) {
            console.warn("MPWA webhook: invalid or missing secret");
            return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
          }

          const payload = await request.json().catch(() => ({}));
          const { sender, message, fromMe, isGroup } = extractIncoming(payload);

          if (!sender || !message) {
            return Response.json({ ok: true, skipped: "missing sender/message" });
          }
          if (fromMe || isGroup) {
            return Response.json({ ok: true, skipped: "self or group" });
          }

          // Load AI settings
          const { data: rows } = await supabaseAdmin
            .from("app_settings")
            .select("key,value")
            .in("key", [
              "wa_ai_enabled",
              "wa_ai_behavior",
              "wa_ai_knowledge",
              "mpwa_api_key",
              "mpwa_sender",
            ]);
          const cfg = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value ?? ""])) as Record<string, string>;

          if (cfg.wa_ai_enabled !== "true") {
            return Response.json({ ok: true, skipped: "AI disabled" });
          }
          if (!cfg.mpwa_api_key || !cfg.mpwa_sender) {
            return Response.json({ ok: false, error: "MPWA belum dikonfigurasi" }, { status: 400 });
          }

          const behavior = cfg.wa_ai_behavior?.trim() || DEFAULT_BEHAVIOR;
          const knowledge = cfg.wa_ai_knowledge?.trim() || "";
          const systemPrompt = `${behavior}\n\n=== KNOWLEDGE BASE SAFAR IMAN ===\n${knowledge}\n=== END KNOWLEDGE ===`;

          const reply = await callAi(systemPrompt, message);
          if (!reply) {
            return Response.json({ ok: false, error: "AI tidak merespon" }, { status: 502 });
          }

          await sendWa(cfg.mpwa_api_key, cfg.mpwa_sender, sender, reply);

          return Response.json({ ok: true, replied: true, to: sender });
        } catch (e) {
          console.error(e);
          return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
        }
      },
    },
  },
});
