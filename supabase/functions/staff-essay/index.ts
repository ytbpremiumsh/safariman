import { authenticatedUser, corsHeaders, json } from "../_shared/staff-auth.ts";
import { ESSAY_RUBRIC } from "../_shared/essay-rubric.ts";

type Participant = {
  id: string;
  [key: string]: unknown;
};
type StaffClients = Awaited<ReturnType<typeof authenticatedUser>>;

const scoreKeys = ["essay_1", "essay_2", "essay_3", "case_1", "case_2", "case_3", "case_4", "case_5", "case_6", "case_7"];
function parseCriteriaChecks(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const checks: Record<string, number[]> = {};
  for (const question of ESSAY_RUBRIC) {
    const selected = input[question.key];
    if (!Array.isArray(selected) || selected.some((index) => !Number.isInteger(index) || Number(index) < 0 || Number(index) >= question.criteria.length)) return null;
    checks[question.key] = [...new Set(selected.map(Number))];
  }
  return checks;
}

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
type AiAuthorship = { verdict: "likely_human" | "likely_ai" | "uncertain"; confidence: Confidence; reason: string };

function cleanJson(text: string) {
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (trimmed.startsWith("```")) return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return trimmed;
}

function messageContent(value: unknown) {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value.map((part) => {
    if (typeof part === "string") return part;
    if (!part || typeof part !== "object") return "";
    const record = part as Record<string, unknown>;
    return typeof record.text === "string" ? record.text : typeof record.content === "string" ? record.content : "";
  }).join("");
}

function parseJsonObject(text: string) {
  const candidate = cleanJson(text);
  try { return JSON.parse(candidate) as Record<string, unknown>; } catch { /* try extracting a complete object */ }
  const start = candidate.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < candidate.length; index += 1) {
    const char = candidate[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        try { return JSON.parse(candidate.slice(start, index + 1)) as Record<string, unknown>; } catch { return null; }
      }
    }
  }
  return null;
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
  const system = `Anda membantu panitia menilai Essay dan Studi Kasus. Nilai berdasarkan makna, konteks, sinonim, dan tindakan nyata; jangan mencocokkan kata saja. Untuk setiap kriteria, matched=true hanya jika jawaban mendukung kriteria secara jelas dan tidak bertentangan. evidence harus kutipan persis dan singkat dari jawaban. confidence wajib high, medium, atau low. Gunakan high hanya jika bukti tegas. Jangan memberi keputusan kelulusan. Untuk setiap jawaban, perkirakan pola kepenulisan dalam authorship.verdict: likely_human, likely_ai, atau uncertain. Analisis variasi gaya, kekhususan pengalaman pribadi, pola kalimat, repetisi, dan bahasa yang terlalu generik; jangan menyatakan hasil sebagai bukti mutlak. confidence wajib high, medium, atau low dan reason berupa alasan singkat tanpa menghakimi. Kembalikan JSON saja: {"questions":[{"key":"essay_1","criteria":[{"index":0,"matched":true,"confidence":"high","evidence":"kutipan"}],"authorship":{"verdict":"uncertain","confidence":"low","reason":"alasan singkat"}}]}. Sertakan seluruh kriteria dan authorship untuk seluruh soal.`;
  const baseMessages = [{ role: "system", content: system }, { role: "user", content: JSON.stringify({ rubric: ESSAY_RUBRIC, answers }) }];
  const requestOpenRouter = async (messages: Array<{ role: string; content: string }>) => {
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
        messages,
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 10000,
      }),
    });
    const raw = await response.text();
    if (!response.ok) {
      let safeMessage = `OpenRouter gagal (${response.status})`;
      try { safeMessage = JSON.parse(raw)?.error?.message ?? safeMessage; } catch { /* use safe fallback */ }
      return { error: json({ error: safeMessage, provider_status: response.status }, response.status >= 500 ? 502 : response.status) };
    }
    try {
      const envelope = JSON.parse(raw);
      const content = messageContent(envelope?.choices?.[0]?.message?.content);
      const parsed = parseJsonObject(content);
      const questions = parsed?.questions;
      return { content, parsed: parsed && Array.isArray(questions) ? parsed : null };
    } catch {
      return { content: "", parsed: null };
    }
  };

  let attempt = await requestOpenRouter(baseMessages);
  if (attempt.error) return { response: attempt.error };
  if (!attempt.parsed) {
    const repairMessages = [
      ...baseMessages,
      ...(attempt.content ? [{ role: "assistant", content: attempt.content.slice(0, 50000) }] : []),
      { role: "user", content: "Respons sebelumnya bukan JSON lengkap yang dapat dibaca. Ulangi seluruh analisis dari awal dan balas hanya satu objek JSON valid sesuai struktur yang diminta. Jangan gunakan markdown." },
    ];
    attempt = await requestOpenRouter(repairMessages);
    if (attempt.error) return { response: attempt.error };
  }
  if (!attempt.parsed) {
    return { response: json({ error: "Model OpenRouter dua kali mengirim format JSON yang tidak lengkap. Coba kembali atau pilih model yang mendukung structured JSON." }, 502) };
  }
  const parsed = attempt.parsed as { questions?: Array<{ key?: unknown; criteria?: unknown; authorship?: unknown }> };

  const recommendations: Record<string, AiCriterion[]> = {};
  const scores: Record<string, number> = {};
  const authorship: Record<string, AiAuthorship> = {};
  for (const question of ESSAY_RUBRIC) {
    const received = parsed.questions?.find((item) => item?.key === question.key);
    const criteria = Array.isArray(received?.criteria) ? received.criteria : [];
    const answer = normalizeEvidence(answers[question.key]);
    const rawAuthorship = received?.authorship && typeof received.authorship === "object" ? received.authorship as Record<string, unknown> : {};
    const verdict = rawAuthorship.verdict === "likely_human" || rawAuthorship.verdict === "likely_ai" ? rawAuthorship.verdict : "uncertain";
    const authorConfidence: Confidence = rawAuthorship.confidence === "high" || rawAuthorship.confidence === "medium" ? rawAuthorship.confidence : "low";
    authorship[question.key] = {
      verdict,
      confidence: authorConfidence,
      reason: typeof rawAuthorship.reason === "string" ? rawAuthorship.reason.trim().slice(0, 240) : "",
    };
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
  return { result: { recommendations, authorship, scores, total_score: Object.values(scores).reduce((sum, score) => sum + score, 0), model } };
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
    if (action === "chat_list") {
      const { data: messages, error: chatError } = await admin.from("staff_group_messages")
        .select("id,staff_user_id,staff_name,message,created_at")
        .order("created_at", { ascending: false }).limit(100);
      if (chatError) throw chatError;
      return json({ messages: (messages ?? []).reverse(), current_user_id: authUser.id });
    }
    if (action === "chat_send") {
      const message = typeof body.message === "string" ? body.message.trim() : "";
      if (!message) return json({ error: "Pesan tidak boleh kosong" }, 400);
      if (message.length > 2000) return json({ error: "Pesan maksimal 2000 karakter" }, 400);
      const { data: sent, error: sendError } = await admin.from("staff_group_messages").insert({
        staff_user_id: authUser.id, staff_name: staff.name, message,
      }).select("id,staff_user_id,staff_name,message,created_at").single();
      if (sendError) throw sendError;
      return json({ message: sent, current_user_id: authUser.id });
    }
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
        .select("participant_id,reviewer_name,decision,scores,total_score,reviewer_notes,criteria_checks,review_method,reviewed_at,updated_at");
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
      const reviewerNotes = typeof body.reviewer_notes === "string" ? body.reviewer_notes.trim() : "";
      const criteriaChecks = parseCriteriaChecks(body.criteria_checks);
      const reviewMethod = body.review_method === "ai" ? "ai" : "manual";
      if (!participantId || !["reviewed", "interview", "rejected"].includes(status)) {
        return json({ error: "Data keputusan tidak valid" }, 400);
      }
      if (!parsedScores) return json({ error: "Semua nilai wajib berupa angka 0 sampai 10" }, 400);
      if (!criteriaChecks) return json({ error: "Riwayat centang penilaian tidak valid" }, 400);
      const calculatedScores = Object.fromEntries(ESSAY_RUBRIC.map((question) => [
        question.key,
        criteriaChecks[question.key].reduce((sum, index) => sum + (question.criteria[index]?.point ?? 0), 0),
      ]));
      if (scoreKeys.some((key) => calculatedScores[key] !== parsedScores.scores[key])) return json({ error: "Nilai tidak sesuai dengan kriteria yang dicentang" }, 400);
      if (reviewerNotes.length > 2000) return json({ error: "Keterangan maksimal 2000 karakter" }, 400);
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
        reviewer_notes: reviewerNotes || null,
        criteria_checks: criteriaChecks,
        review_method: reviewMethod,
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
