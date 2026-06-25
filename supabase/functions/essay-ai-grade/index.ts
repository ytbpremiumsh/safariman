// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const SYSTEM = `Kamu adalah penilai (reviewer) profesional untuk seleksi program beasiswa umroh "Safar Iman".
Tugasmu menilai jawaban Essay dan Studi Kasus peserta secara JUJUR, OBYEKTIF, dan TEGAS.

Berikan keluaran JSON dengan field:
{
  "ai_used_percent": number (0-100, perkiraan persentase kemungkinan jawaban ditulis/dibantu AI generatif. Indikator: gaya generik, struktur seragam, frasa khas LLM, kurang detail personal, repetisi pola),
  "score": number (0-100, kualitas keseluruhan jawaban: kedalaman, otentisitas, relevansi, koherensi, niat tulus),
  "verdict": "layak" | "tidak_layak" | "ragu",
  "summary": string (3-6 kalimat ringkas Bahasa Indonesia: kekuatan, kelemahan, indikasi AI bila ada, dan rekomendasi keputusan)
}

Pedoman verdict:
- "layak": jawaban autentik, mendalam, kontekstual, ai_used_percent rendah (<40).
- "ragu": kualitas cukup namun ada indikasi AI moderat (40-70) atau jawaban dangkal.
- "tidak_layak": jawaban sangat generik, sangat pendek/asal, atau ai_used_percent tinggi (>70).

Balas HANYA JSON valid, tanpa markdown, tanpa penjelasan tambahan.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return json({ error: "unauthorized" }, { status: 401 });

    // Verify caller is admin
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return json({ error: "unauthorized" }, { status: 401 });
    const { data: roleCheck } = await userClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!roleCheck) return json({ error: "forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const participantId = body?.participant_id as string | undefined;
    if (!participantId) return json({ error: "participant_id required" }, { status: 400 });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: p, error: pErr } = await admin
      .from("participants")
      .select("id, full_name, essay_worthy, essay_dream, essay_contribution, case_study_1, case_study_2")
      .eq("id", participantId)
      .maybeSingle();
    if (pErr || !p) return json({ error: "participant not found" }, { status: 404 });

    const userMsg = `Nama Peserta: ${p.full_name}

[ESSAY 1] Kenapa kamu layak dipilih?
${p.essay_worthy ?? "(kosong)"}

[ESSAY 2] Apa impianmu setelah ke Tanah Suci?
${p.essay_dream ?? "(kosong)"}

[ESSAY 3] Bagaimana kontribusimu untuk umat?
${p.essay_contribution ?? "(kosong)"}

[STUDI KASUS 1]
${p.case_study_1 ?? "(kosong)"}

[STUDI KASUS 2]
${p.case_study_2 ?? "(kosong)"}

Berikan penilaianmu sebagai JSON sesuai instruksi.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429) return json({ error: "rate_limited" }, { status: 429 });
    if (aiRes.status === 402) return json({ error: "ai_credits_required" }, { status: 402 });
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return json({ error: "ai_failed", detail: txt }, { status: 502 });
    }
    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = typeof content === "string" ? JSON.parse(content) : content; } catch { parsed = {}; }

    const clampInt = (n: any, min = 0, max = 100) => {
      const v = Math.round(Number(n));
      if (!Number.isFinite(v)) return null;
      return Math.max(min, Math.min(max, v));
    };
    const score = clampInt(parsed.score);
    const percent = clampInt(parsed.ai_used_percent);
    const allowed = ["layak", "tidak_layak", "ragu"];
    const verdict = allowed.includes(parsed.verdict) ? parsed.verdict : "ragu";
    const summary = String(parsed.summary ?? "").slice(0, 4000);

    // Persist via SECURITY DEFINER RPC using user JWT (admin verified)
    const { error: rpcErr } = await userClient.rpc("admin_set_essay_ai", {
      p_id: participantId,
      p_score: score,
      p_percent: percent,
      p_verdict: verdict,
      p_summary: summary,
    });
    if (rpcErr) return json({ error: rpcErr.message }, { status: 500 });

    return json({
      ok: true,
      result: { score, ai_used_percent: percent, verdict, summary },
    });
  } catch (e) {
    return json({ error: (e as Error).message }, { status: 500 });
  }
});
