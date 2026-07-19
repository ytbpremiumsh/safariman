// Backup semua tabel penting ke JSON (admin only).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/admin-auth.ts";

const TABLES = [
  "participants",
  "app_settings",
  "user_roles",
  "payment_reminders",
  "twibbon_downloads",
  "affiliate_clicks",
  "email_send_log",
  "email_send_state",
  "email_unsubscribe_tokens",
  "suppressed_emails",
];

const PAGE = 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const guard = await requireAdmin(req);
  if (guard) return guard;

  const url = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, service);

  try {
    const dump: Record<string, unknown[]> = {};
    for (const t of TABLES) {
      const rows: unknown[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await admin
          .from(t)
          .select("*")
          .range(from, from + PAGE - 1);
        if (error) {
          dump[`__error_${t}`] = [{ message: error.message }] as any;
          break;
        }
        if (!data || data.length === 0) break;
        rows.push(...data);
        if (data.length < PAGE) break;
        from += PAGE;
      }
      dump[t] = rows;
    }

    // Update last backup timestamp (best-effort)
    await admin
      .from("app_settings")
      .upsert(
        { key: "backup_last_at", value: new Date().toISOString() },
        { onConflict: "key" },
      );

    const body = {
      generated_at: new Date().toISOString(),
      project: "safariman",
      tables: dump,
    };

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: {
        ...corsHeaders,
        "content-type": "application/json",
        "content-disposition": `attachment; filename="safariman-backup-${new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/[:T]/g, "-")}.json"`,
      },
    });
  } catch (e) {
    return json({ ok: false, error: String((e as Error).message ?? e) }, { status: 500 });
  }
});
