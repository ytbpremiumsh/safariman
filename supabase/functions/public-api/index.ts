// Public API umum untuk integrasi pihak ke-2 / ke-3.
// Berbeda dengan cbt-api yang khusus untuk login CBT.
//
// Endpoint (semua butuh Authorization: Bearer <PUBLIC_API_KEY>):
//   GET  /participants                → list semua peserta (ringkas)
//   GET  /participant/:code           → detail lengkap 1 peserta (status seleksi,
//                                       benefit, pembayaran, kontribusi, kategori)
//   GET  /status/:code                → status ringkas peserta (public-friendly)
//   GET  /stats                       → agregat: total peserta per kategori/status
//
// API Key disimpan di app_settings.public_api_key (bisa di-rotate dari admin).

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

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu Verifikasi",
  berkas: "Seleksi Berkas",
  essay: "Seleksi Essay & Studi Kasus",
  interview: "Tahap TKA / Interview",
  accepted: "Diterima / Lolos Final",
  rejected: "Tidak Lolos",
};

function benefitsFor(category: string | null): string[] {
  switch (category) {
    case "fully_funded":
      return [
        "Biaya perjalanan umrah ditanggung penuh oleh Program Safar Iman",
        "Akomodasi hotel selama di Tanah Suci",
        "Pembinaan & mentoring pra-keberangkatan",
        "Sertifikat resmi peserta Program Safar Iman",
        "Jaringan alumni Safar Iman",
      ];
    case "partial_funded":
      return [
        "Subsidi sebagian biaya perjalanan umrah",
        "Akomodasi hotel selama di Tanah Suci",
        "Pembinaan & mentoring pra-keberangkatan",
        "Sertifikat resmi peserta Program Safar Iman",
        "Jaringan alumni Safar Iman",
      ];
    case "self_funded":
      return [
        "Bergabung dalam rombongan Program Safar Iman (self funded)",
        "Pembinaan & mentoring pra-keberangkatan",
        "Sertifikat resmi peserta Program Safar Iman",
        "Jaringan alumni Safar Iman",
      ];
    case "gelombang_1":
    case "gelombang_2":
      return [
        "Fast track masuk seleksi tanpa antre reguler",
        "Prioritas review berkas & essay",
        "Akses eksklusif materi persiapan",
        "Pembinaan & mentoring pra-keberangkatan",
        "Sertifikat resmi peserta Program Safar Iman",
      ];
    default:
      return [];
  }
}

function isPaid(status: string | null | undefined) {
  if (!status) return false;
  const s = String(status).toLowerCase().trim();
  if (s.startsWith("un")) return false;
  if (/(pending|fail|cancel|expired|refund)/.test(s)) return false;
  return /\b(paid|success|settle|complete|lunas|approved|active)\b/.test(s);
}

async function getApiKey(): Promise<string> {
  const { data } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", "public_api_key")
    .maybeSingle();
  return ((data?.value ?? "") as string).trim();
}

async function isAuthorized(req: Request): Promise<boolean> {
  const expected = await getApiKey();
  if (!expected) return false;
  const auth = req.headers.get("authorization") || "";
  const headerKey = req.headers.get("x-api-key") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const provided = (bearer || headerKey).trim();
  return provided.length > 0 && provided === expected;
}

function shape(p: Record<string, any>, full = false) {
  const paymentValid = isPaid(p.payment_status);
  const contributionValid = isPaid(p.donation_status);
  const base = {
    id: p.id,
    registration_code: p.registration_code,
    full_name: p.full_name,
    category: p.category,
    category_label: p.category ? (CAT_LABEL[p.category] ?? null) : null,
    status: p.status,
    status_label: p.status ? (STATUS_LABEL[p.status] ?? p.status) : null,
    payment: {
      status: p.payment_status,
      valid: paymentValid,
      paid_at: p.paid_at,
    },
    contribution: {
      status: p.donation_status,
      valid: contributionValid,
      paid_at: p.donation_paid_at,
    },
    benefits: benefitsFor(p.category ?? null),
    selection: {
      berkas_confirmed_at: p.twibbon_confirmed_at,
      essay_submitted: !!(p.essay_worthy && p.essay_dream && p.essay_contribution),
      tka_status: p.tka_status ?? null,
      tka_updated_at: p.tka_updated_at ?? null,
      interview_status: p.interview_status ?? null,
      interview_updated_at: p.interview_updated_at ?? null,
    },
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
  if (!full) return base;
  return {
    ...base,
    email: p.email,
    whatsapp: p.whatsapp,
    gender: p.gender,
    birth_date: p.birth_date,
    city: p.city,
    education: p.education,
    occupation: p.occupation,
    religion: p.religion,
    has_passport: p.has_passport,
    social_media: p.social_media,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("public-api");
  const route = idx >= 0 ? parts.slice(idx + 1).join("/") : parts.join("/");

  try {
    // Health / index (public)
    if (req.method === "GET" && (route === "" || route === "health")) {
      return json({
        ok: true,
        service: "Safar Iman Public API",
        endpoints: {
          "GET /participants": "Butuh API key. List semua peserta (ringkas).",
          "GET /participant/:code": "Butuh API key. Detail lengkap 1 peserta.",
          "GET /status/:code": "Butuh API key. Status ringkas peserta.",
          "GET /stats": "Butuh API key. Agregat total per kategori & status.",
        },
      });
    }

    if (!(await isAuthorized(req))) {
      return json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (req.method === "GET" && route === "participants") {
      const category = url.searchParams.get("category");
      const status = url.searchParams.get("status");
      const paidOnly = url.searchParams.get("paid") === "1";
      const limit = Math.min(Number(url.searchParams.get("limit") || 500), 2000);

      let q = admin
        .from("participants")
        .select(
          "id, registration_code, full_name, category, status, payment_status, paid_at, donation_status, donation_paid_at, twibbon_confirmed_at, essay_worthy, essay_dream, essay_contribution, tka_status, tka_updated_at, interview_status, interview_updated_at, created_at, updated_at",
        )
        .order("created_at", { ascending: false })
        .limit(limit);
      if (category) q = q.eq("category", category);
      if (status) q = q.eq("status", status);

      const { data, error } = await q;
      if (error) return json({ ok: false, error: error.message }, { status: 500 });
      let list = (data ?? []).map((p) => shape(p as Record<string, any>, false));
      if (paidOnly) list = list.filter((p: any) => p.payment.valid);
      return json({ ok: true, count: list.length, participants: list });
    }

    if (req.method === "GET" && route.startsWith("participant/")) {
      const code = decodeURIComponent(route.split("/")[1] || "").trim();
      if (!/^[A-Za-z0-9-]{4,32}$/.test(code)) {
        return json({ ok: false, error: "Kode tidak valid" }, { status: 400 });
      }
      const { data: p } = await admin
        .from("participants")
        .select("*")
        .ilike("registration_code", code)
        .maybeSingle();
      if (!p) return json({ ok: false, error: "Tidak ditemukan" }, { status: 404 });
      return json({ ok: true, participant: shape(p as Record<string, any>, true) });
    }

    if (req.method === "GET" && route.startsWith("status/")) {
      const code = decodeURIComponent(route.split("/")[1] || "").trim();
      if (!/^[A-Za-z0-9-]{4,32}$/.test(code)) {
        return json({ ok: false, error: "Kode tidak valid" }, { status: 400 });
      }
      const { data: p } = await admin
        .from("participants")
        .select(
          "registration_code, full_name, category, status, payment_status, paid_at, donation_status, donation_paid_at, twibbon_confirmed_at, essay_worthy, essay_dream, essay_contribution, tka_status, interview_status",
        )
        .ilike("registration_code", code)
        .maybeSingle();
      if (!p) return json({ ok: false, error: "Tidak ditemukan" }, { status: 404 });
      const s = shape(p as Record<string, any>, false);
      return json({ ok: true, status: s });
    }

    if (req.method === "GET" && route === "stats") {
      const { data, error } = await admin
        .from("participants")
        .select("category, status, payment_status, donation_status");
      if (error) return json({ ok: false, error: error.message }, { status: 500 });
      const byCategory: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      let paid = 0;
      let contributed = 0;
      for (const r of data ?? []) {
        const cat = (r as any).category ?? "unknown";
        const st = (r as any).status ?? "unknown";
        byCategory[cat] = (byCategory[cat] ?? 0) + 1;
        byStatus[st] = (byStatus[st] ?? 0) + 1;
        if (isPaid((r as any).payment_status)) paid += 1;
        if (isPaid((r as any).donation_status)) contributed += 1;
      }
      return json({
        ok: true,
        total: data?.length ?? 0,
        by_category: byCategory,
        by_status: byStatus,
        payment_valid: paid,
        contribution_valid: contributed,
      });
    }

    return json({ ok: false, error: "Not found" }, { status: 404 });
  } catch (e) {
    console.error("public-api error", e);
    return json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
});
