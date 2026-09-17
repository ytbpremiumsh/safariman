import { authenticatedUser, corsHeaders, json } from "../_shared/staff-auth.ts";

type Participant = {
  id: string;
  essay_worthy: string | null;
  essay_dream: string | null;
  essay_contribution: string | null;
  case_study_1: string | null;
  case_study_2: string | null;
  case_study_3: string | null;
  case_study_4: string | null;
  case_study_5: string | null;
  case_study_6: string | null;
  case_study_7: string | null;
  [key: string]: unknown;
};

function hasCompleteSubmission(participant: Participant) {
  return [
    participant.essay_worthy,
    participant.essay_dream,
    participant.essay_contribution,
    participant.case_study_1,
    participant.case_study_2,
    participant.case_study_3,
    participant.case_study_4,
    participant.case_study_5,
    participant.case_study_6,
    participant.case_study_7,
  ].every((answer) => typeof answer === "string" && answer.trim().length > 0);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { admin, authUser } = await authenticatedUser(req);
    if (!authUser) return json({ error: "Unauthorized" }, 401);
    const { data: staff } = await admin.from("staff_reviewers")
      .select("active,name").eq("user_id", authUser.id).maybeSingle();
    if (!staff?.active) return json({ error: "Akun staff tidak aktif" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "list");
    if (action === "list") {
      const { data, error } = await admin.rpc("list_essay_complete_participants");
      if (error) throw error;
      const participants = ((data ?? []) as Participant[]).filter(hasCompleteSubmission);
      const ids = participants.map((participant) => participant.id);
      const { data: reviews, error: reviewError } = ids.length
        ? await admin.from("staff_essay_reviews")
          .select("participant_id,reviewer_name,decision,reviewed_at,updated_at")
          .in("participant_id", ids)
        : { data: [], error: null };
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
      if (!participantId || !["reviewed", "interview", "rejected"].includes(status)) {
        return json({ error: "Data keputusan tidak valid" }, 400);
      }
      const { data: participant, error: participantError } = await admin.rpc("list_essay_complete_participants");
      if (participantError) throw participantError;
      const eligible = ((participant ?? []) as Participant[])
        .some((row) => row.id === participantId && hasCompleteSubmission(row));
      if (!eligible) return json({ error: "Essay dan Studi Kasus peserta belum lengkap" }, 400);
      const review = {
        participant_id: participantId,
        reviewer_id: authUser.id,
        reviewer_name: staff.name,
        decision: status,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { error: auditError } = await admin.from("staff_essay_reviews").upsert(review, { onConflict: "participant_id" });
      if (auditError) throw auditError;
      return json({ ok: true, review });
    }

    return json({ error: "Aksi tidak dikenal" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Terjadi kesalahan" }, 500);
  }
});
