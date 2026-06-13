// Public API for 3rd-party CBT (Computer-Based Test) integration.
// - POST /verify-token  → student login on CBT side using registration_code as token
// - GET  /participants  → list peserta yang sudah kirim essay (lengkap), butuh API key
// - GET  /participant/:code → detail satu peserta, butuh API key
//
// Auth: header `Authorization: Bearer <CBT_API_KEY>` atau `X-API-Key: <CBT_API_KEY>`.
// CBT_API_KEY disimpan di app_settings.cbt_api_key (bisa di-rotate dari admin).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CAT_LABEL: Record<string, string> = {
  fully_funded: "Fully Funded",
  partial_funded: "Partial Funded",
  self_funded: "Self Funded",
  gelombang_1: "Fast Track Gelombang 1",
  gelombang_2: "Fast Track Gelombang 2",
};

async function getApiKey(): Promise<string> {
  const { data } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", "cbt_api_key")
    .maybeSingle();
  return (data?.value ?? "").trim();
}

async function isAuthorized(req: Request): Promise<boolean> {
  const expected = await getApiKey();
  if (!expected) return false;
  const auth = req.headers.get("authorization") || "";
  const headerKey = req.headers.get("x-api-key") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  const provided = (bearer || headerKey).trim();
  return provided.length > 0 && provided === expected;
}

function isEssayComplete(p: { essay_worthy: unknown; essay_dream: unknown; essay_contribution: unknown }) {
  return !!(p.essay_worthy && p.essay_dream && p.essay_contribution);
}

function shape(p: Record<string, unknown>) {
  return {
    id: p.id,
    token: p.registration_code,
    registration_code: p.registration_code,
    full_name: p.full_name,
    email: p.email,
    whatsapp: p.whatsapp,
    gender: p.gender,
    birth_date: p.birth_date,
    city: p.city,
    education: p.education,
    occupation: p.occupation,
    social_media: p.social_media,
    instagram: p.social_media,
    reason: p.reason,
    achievements: p.achievements,
    organization_experience: p.organization_experience,
    category: p.category,
    category_label: p.category ? (CAT_LABEL[p.category as string] ?? null) : null,
    status: p.status,
    cv_url: p.cv_url,
    photo_url: p.photo_url,
    twibbon_confirmed_at: p.twibbon_confirmed_at,
    essay: {
      worthy: p.essay_worthy,
      dream: p.essay_dream,
      contribution: p.essay_contribution,
    },
    payment_status: p.payment_status,
    paid_at: p.paid_at,
    donation_status: p.donation_status,
    donation_paid_at: p.donation_paid_at,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  // Path inside function is e.g. /cbt-api/verify-token
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("cbt-api");
  const route = idx >= 0 ? parts.slice(idx + 1).join("/") : parts.join("/");

  try {
    // -------- Public: verify token (CBT student login) ----------
    if (req.method === "POST" && (route === "verify-token" || route === "login")) {
      const body = (await req.json().catch(() => ({}))) as { token?: string; code?: string };
      const token = String(body.token || body.code || "").trim();
      if (!/^[A-Za-z0-9-]{4,32}$/.test(token)) {
        return json({ ok: false, error: "Token tidak valid" }, { status: 400 });
      }
      const { data: p } = await admin
        .from("participants")
        .select(
          "id, registration_code, full_name, email, whatsapp, gender, birth_date, city, education, occupation, social_media, reason, achievements, organization_experience, category, status, cv_url, photo_url, twibbon_confirmed_at, essay_worthy, essay_dream, essay_contribution, payment_status, paid_at, donation_status, donation_paid_at, created_at, updated_at",
        )
        .ilike("registration_code", token)
        .maybeSingle();
      if (!p) return json({ ok: false, error: "Token tidak ditemukan" }, { status: 404 });
      if (!isEssayComplete(p)) {
        return json(
          { ok: false, error: "Peserta belum mengirim essay lengkap", eligible: false },
          { status: 403 },
        );
      }
      if (p.category === "self_funded") {
        return json(
          { ok: false, error: "Peserta self funded tidak mengikuti tahap CBT", eligible: false },
          { status: 403 },
        );
      }
      if (p.status !== "interview" && p.status !== "accepted") {
        return json(
          { ok: false, error: "Peserta belum lolos ke tahap selanjutnya", eligible: false },
          { status: 403 },
        );
      }
      return json({ ok: true, eligible: true, participant: shape(p) });
    }

    // -------- Protected: list / detail ----------
    if (req.method === "GET" && route === "participants") {
      if (!(await isAuthorized(req))) {
        return json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
      const { data, error } = await admin.rpc("list_essay_complete_participants");
      if (error) return json({ ok: false, error: error.message }, { status: 500 });
      const list = (data ?? []).map((p: Record<string, unknown>) => shape(p));
      return json({ ok: true, count: list.length, participants: list });
    }

    if (req.method === "GET" && route.startsWith("participant/")) {
      if (!(await isAuthorized(req))) {
        return json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
      const code = decodeURIComponent(route.split("/")[1] || "").trim();
      if (!/^[A-Za-z0-9-]{4,32}$/.test(code)) {
        return json({ ok: false, error: "Kode tidak valid" }, { status: 400 });
      }
      const { data: p } = await admin
        .from("participants")
        .select(
          "id, registration_code, full_name, email, whatsapp, gender, birth_date, city, education, occupation, social_media, reason, achievements, organization_experience, category, status, cv_url, photo_url, twibbon_confirmed_at, essay_worthy, essay_dream, essay_contribution, payment_status, paid_at, donation_status, donation_paid_at, created_at, updated_at",
        )
        .ilike("registration_code", code)
        .maybeSingle();
      if (!p) return json({ ok: false, error: "Tidak ditemukan" }, { status: 404 });
      return json({ ok: true, participant: shape(p), eligible: isEssayComplete(p) });
    }

    // -------- Health / docs ----------
    if (req.method === "GET") {
      return json({
        ok: true,
        service: "Safar Iman CBT API",
        endpoints: {
          "POST /verify-token": "Public. Body: { token }. Validates registration_code & essay completeness.",
          "GET  /participants": "Requires Authorization: Bearer <CBT_API_KEY>. Returns all essay-complete participants.",
          "GET  /participant/:code": "Requires API key. Returns single participant.",
        },
      });
    }

    return json({ ok: false, error: "Not found" }, { status: 404 });
  } catch (e) {
    console.error("cbt-api error", e);
    return json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
});
