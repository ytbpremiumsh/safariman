import { authenticatedUser, corsHeaders, json } from "../_shared/staff-auth.ts";
import { ESSAY_RUBRIC } from "../_shared/essay-rubric.ts";

type Participant = {
  id: string;
  [key: string]: unknown;
};
type StaffClients = Awaited<ReturnType<typeof authenticatedUser>>;

const scoreKeys = ["essay_1", "essay_2", "essay_3", "case_1", "case_2", "case_3", "case_4", "case_5", "case_6", "case_7"];
function parseScores(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (Object.keys(input).length !== scoreKeys.length) return null;
  const scores: Record<string, number> = {};
  for (const key of scoreKeys) {
    const score = input[key];
    if (!Number.isInteger(score) || Number(score) < 0 || Number(score) > 10) return null;
    scores[key] = Number(score);
  }
  return { scores, total: Object.values(scores).reduce((sum, score) => sum + score, 0) };
}

type Confidence = "high" | "medium" | "low";
type AiCriterion = { index: number; matched: boolean; confidence: Confidence; evidence: string };

function cleanJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return trimmed;
}

function normalizeEvidence(value: string) {
  return value.toLocaleLowerCase("id-ID").replace(/\s+/g, " ").trim();
}

async function analyzeWithOpenRouter(admin: StaffClients["admin"], participantId: string) {
  const { data: secret, error: secretError } = await admin.from("ai_provider_secrets")
    .select("api_key").eq("provider", "openrouter").maybeSingle();
  const apiKey = String(secret?.api_key ?? "").trim();
  if (secretError || !apiKey) return { response: json({ error: "OpenRouter belum terhubung. Admin perlu menyimpan API key terlebih dahulu." }, 503) };

  const answerColumns = ["essay_worthy", "essay_dream", "essay_contribution", "case_study_1", "case_study_2", "case_study_3", "case_study_4", "case_study_5", "case_study_6", "case_study_7"];
  const { data: participant, error } = await admin.from("participants").select(`id,${answerColumns.join(",")}`).eq("id", participantId).maybeSingle();
  if (error || !participant) return { response: json({ error: "Peserta tidak ditemukan" }, 404) };

  const { data: modelSetting } = await admin.from("app_settings").select("value").eq("key", "ai_openrouter_model").maybeSingle();
  const model = String(modelSetting?.value ?? "openai/gpt-4o-mini").trim() || "openai/gpt-4o-mini";
  const answers = Object.fromEntries(ESSAY_RUBRIC.map((question, index) => [question.key, String(participant[answerColumns[index]] ?? "")]));
  const system = `Anda membantu panitia menilai Essay dan Studi Kasus. Nilai berdasarkan makna, konteks, sinonim, dan tindakan nyata; jangan mencocokkan kata saja. Untuk setiap kriteria, matched=true hanya jika jawaban mendukung kriteria secara jelas dan tidak bertentangan. evidence harus kutipan persis dan singkat dari jawaban. confidence wajib high, medium, atau low. Gunakan high hanya jika bukti tegas. Jangan memberi keputusan kelulusan. Kembalikan JSON saja: {"questions":[{"key":"essay_1","criteria":[{"index":0,"matched":true,"confidence":"high","evidence":"kutipan"}]}]}. Sertakan seluruh kriteria untuk seluruh soal.`;
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://safariman.id",
      "X-Title": "Safar Iman Staff Review",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, { role: "user", content: JSON.stringify({ rubric: ESSAY_RUBRIC, answers }) }],
      response_format: { type: "json_object" },
    }),
  });
  const raw = await response.text();
  if (!response.ok) {
    let safeMessage = `OpenRouter gagal (${response.status})`;
    try { safeMessage = JSON.parse(raw)?.error?.message ?? safeMessage; } catch { /* use safe fallback */ }
    return { response: json({ error: safeMessage, provider_status: response.status }) };
  }

  let parsed: { questions?: Array<{ key?: unknown; criteria?: unknown }> };
  try {
    const envelope = JSON.parse(raw);
    parsed = JSON.parse(cleanJson(String(envelope?.choices?.[0]?.message?.content ?? "")));
  } catch {
    return { response: json({ error: "Hasil OpenRouter tidak dapat dibaca. Silakan coba lagi." }, 502) };
  }

  const recommendations: Record<string, AiCriterion[]> = {};
  const scores: Record<string, number> = {};
  for (const question of ESSAY_RUBRIC) {
    const received = parsed.questions?.find((item) => item?.key === question.key);
    const criteria = Array.isArray(received?.criteria) ? received.criteria : [];
    const answer = normalizeEvidence(answers[question.key]);
    recommendations[question.key] = question.criteria.map((_, index) => {
      const item = criteria.find((entry) => entry && typeof entry === "object" && (entry as Record<string, unknown>).index === index) as Record<string, unknown> | undefined;
      const confidence: Confidence = item?.confidence === "high" || item?.confidence === "medium" ? item.confidence : "low";
      const evidence = typeof item?.evidence === "string" ? item.evidence.trim().slice(0, 300) : "";
      const evidenceValid = evidence.length >= 3 && answer.includes(normalizeEvidence(evidence));
      return { index, matched: item?.matched === true && evidenceValid, confidence, evidence: evidenceValid ? evidence : "" };
    });
    scores[question.key] = recommendations[question.key].reduce((sum, item) =>
      sum + (item.matched && item.confidence === "high" ? (question.criteria[item.index]?.point ?? 0) : 0), 0);
  }
  return { result: { recommendations, scores, total_score: Object.values(scores).reduce((sum, score) => sum + score, 0), model } };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { user, admin, authUser } = await authenticatedUser(req);
    if (!authUser) return json({ error: "Unauthorized" }, 401);
    const { data: staff } = await admin.from("staff_reviewers")
      .select("active,name").eq("user_id", authUser.id).maybeSingle();
    if (!staff?.active) return json({ error: "Akun staff tidak aktif" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "list");
    if (action === "analyze") {
      const participantId = String(body.participant_id ?? "");
      if (!participantId) return json({ error: "Peserta tidak valid" }, 400);
      const analysis = await analyzeWithOpenRouter(admin, participantId);
      if (analysis.response) return analysis.response;
      return json(analysis.result);
    }
    if (action === "list") {
      const { data, error } = await admin.rpc("list_essay_complete_participants");
      if (error) throw error;
      const participants = (data ?? []) as Participant[];
      const { data: reviews, error: reviewError } = await admin
        .from("staff_essay_reviews")
        .select("participant_id,reviewer_name,decision,scores,total_score,reviewed_at,updated_at");
      if (reviewError) throw reviewError;
      const reviewMap = new Map((reviews ?? []).map((review) => [review.participant_id, review]));
      return json({ participants: participants.map((participant) => {
        const staffReview = reviewMap.get(participant.id) ?? null;
        return {
          ...participant,
          status: staffReview?.decision ?? "reviewed",
          staff_review: staffReview,
        };
      }) });
    }

    if (action === "reset_review") {
      const participantId = String(body.participant_id ?? "");
      if (!participantId) return json({ error: "Peserta tidak valid" }, 400);
      const { error: deleteError } = await admin.from("staff_essay_reviews")
        .delete().eq("participant_id", participantId);
      if (deleteError) throw deleteError;
      const nowIso = new Date().toISOString();
      const { error: resetError } = await admin.from("participants").update({
        essay_status: "pending",
        essay_updated_at: nowIso,
        tka_status: "pending",
        tka_updated_at: nowIso,
        interview_status: "pending",
        interview_updated_at: nowIso,
        updated_at: nowIso,
      }).eq("id", participantId);
      if (resetError) throw resetError;
      return json({ ok: true, review: null });
    }

    if (action === "update_status") {
      const participantId = String(body.participant_id ?? "");
      const status = String(body.status ?? "");
      const parsedScores = parseScores(body.scores);
      if (!participantId || !["reviewed", "interview", "rejected"].includes(status)) {
        return json({ error: "Data keputusan tidak valid" }, 400);
      }
      if (!parsedScores) return json({ error: "Semua nilai wajib berupa angka 0 sampai 10" }, 400);
      const { data: participant, error: participantError } = await admin
        .rpc("list_essay_complete_participants");
      if (participantError) throw participantError;
      const eligible = ((participant ?? []) as Participant[])
        .some((row) => row.id === participantId);
      if (!eligible) return json({ error: "Essay dan Studi Kasus peserta belum lengkap" }, 400);
      const review = {
        participant_id: participantId,
        reviewer_id: authUser.id,
        reviewer_name: staff.name,
        decision: status,
        scores: parsedScores.scores,
        total_score: parsedScores.total,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { error: auditError } = await admin.from("staff_essay_reviews").upsert(review, { onConflict: "participant_id" });
      if (auditError) throw auditError;
      const stageValue = status === "interview" ? "passed" : status === "rejected" ? "failed" : "pending";
      const nowIso = new Date().toISOString();
      const stagePatch: Record<string, unknown> = {
        essay_status: stageValue,
        essay_updated_at: nowIso,
        updated_at: nowIso,
      };
      if (stageValue !== "passed") {
        stagePatch.tka_status = "pending";
        stagePatch.tka_updated_at = nowIso;
        stagePatch.interview_status = "pending";
        stagePatch.interview_updated_at = nowIso;
      }
      const { error: stageError } = await admin
        .from("participants")
        .update(stagePatch)
        .eq("id", participantId);
      if (stageError) throw stageError;
      return json({ ok: true, review });
    }

    return json({ error: "Aksi tidak dikenal" }, 400);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : "Terjadi kesalahan";
    return json({ error: message }, 500);
  }
});
