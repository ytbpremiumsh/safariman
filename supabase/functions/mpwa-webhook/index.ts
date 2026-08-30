// deno-lint-ignore-file no-explicit-any
import { corsHeaders, json } from "../_shared/cors.ts";
import { getAdmin } from "../_shared/wa.ts";
import { aiChat } from "../_shared/ai-provider.ts";
import { AI_PAUSED, AI_PAUSED_MESSAGE } from "../_shared/ai-pause.ts";

const DEFAULT_BEHAVIOR = `balas chat dan berikan hasil dari semua pembicaraan menggunakan bahasa indonesia`;

function extractIncoming(body: any) {
  const sender = body?.sender || body?.from || body?.number || body?.phone || body?.user || "";
  const message = body?.message || body?.text || body?.body || body?.msg || body?.content || "";
  const fromMe = body?.fromMe === true || body?.isFromMe === true || body?.self === true;
  const isGroup = (typeof sender === "string" && sender.includes("@g.us")) || body?.isGroup === true;
  const clean = String(sender).replace(/@s\.whatsapp\.net|@c\.us|@g\.us/g, "").replace(/\D/g, "");
  return { sender: clean, message: String(message || "").trim(), fromMe, isGroup };
}

async function callAi(systemPrompt: string, userMessage: string): Promise<string | null> {
  try {
    const r = await aiChat({ system: systemPrompt, user: userMessage });
    if (!r.ok) {
      console.error("AI call failed", r.provider, r.status, r.error);
      return null;
    }
    return r.content.trim() || null;
  } catch (e) {
    console.error("AI call exception", e);
    return null;
  }
}

async function sendWa(apiKey: string, sender: string, number: string, message: string) {
  try {
    await fetch("https://app.ayopintar.com/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ api_key: apiKey, sender, number, message, footer: "Safar Iman · AI Assistant" }),
    });
  } catch (e) {
    console.error("MPWA send failed", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method === "GET") return json({ ok: true, info: "MPWA webhook for Safar Iman AI auto-reply" });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, { status: 405 });
  // Acknowledge disabled webhooks without provider calls or retries.
  if (AI_PAUSED) return json({ ok: true, skipped: "ai_disabled", message: AI_PAUSED_MESSAGE });
  try {
    const supabaseAdmin = getAdmin();
    const { data: secretRow } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "mpwa_webhook_secret")
      .maybeSingle();
    const expected = (secretRow?.value ?? "").trim();
    if (!expected) return json({ ok: false, error: "Server misconfigured" }, { status: 500 });

    const provided =
      req.headers.get("x-mpwa-secret") ||
      req.headers.get("x-webhook-secret") ||
      new URL(req.url).searchParams.get("secret");
    if (!provided || provided !== expected) return json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const { sender, message, fromMe, isGroup } = extractIncoming(payload);
    if (!sender || !message) return json({ ok: true, skipped: "missing sender/message" });
    if (fromMe || isGroup) return json({ ok: true, skipped: "self or group" });

    const { data: rows } = await supabaseAdmin
      .from("app_settings")
      .select("key,value")
      .in("key", ["wa_ai_behavior", "wa_ai_knowledge", "mpwa_api_key", "mpwa_sender", "wa_ai_reply_enabled"]);
    const cfg = Object.fromEntries((rows ?? []).map((r: any) => [r.key, r.value ?? ""])) as Record<string, string>;

    if (cfg.wa_ai_reply_enabled !== "true") return json({ ok: true, skipped: "AI Reply disabled by global toggle" });

    if (!cfg.mpwa_api_key || !cfg.mpwa_sender)
      return json({ ok: false, error: "MPWA belum dikonfigurasi" }, { status: 400 });

    const behavior = cfg.wa_ai_behavior?.trim() || DEFAULT_BEHAVIOR;
    const knowledge = cfg.wa_ai_knowledge?.trim() || "";
    const systemPrompt = `${behavior}\n\n=== KNOWLEDGE BASE SAFAR IMAN ===\n${knowledge}\n=== END KNOWLEDGE ===`;

    const reply = await callAi(systemPrompt, message);
    if (!reply) return json({ ok: false, error: "AI tidak merespon" }, { status: 502 });

    await sendWa(cfg.mpwa_api_key, cfg.mpwa_sender, sender, reply);
    return json({ ok: true, replied: true, to: sender });
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
});
