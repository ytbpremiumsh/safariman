import { authenticatedUser, corsHeaders, json } from "../_shared/staff-auth.ts";

type Participant = {
  id: string;
  [key: string]: unknown;
};

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
