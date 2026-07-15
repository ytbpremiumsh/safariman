import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const BUCKET = "document-assets";
const KEYS = ["doc_signature_url", "doc_stamp_url"];

function pathFromUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  const m = u.match(/\/document-assets\/([^?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const srk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, srk);

    const { data: rows } = await admin
      .from("app_settings")
      .select("key,value")
      .in("key", KEYS);

    const out: Record<string, string> = {};
    for (const r of rows ?? []) {
      const path = pathFromUrl(r.value as string);
      if (!path) continue;
      const { data } = await admin.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
      if (data?.signedUrl) out[r.key as string] = data.signedUrl;
    }
    return json({ ok: true, urls: out });
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : "failed" }, 500);
  }
});
