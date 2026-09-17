import { authenticatedUser, corsHeaders, json } from "../_shared/staff-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { admin, authUser } = await authenticatedUser(req);
    if (!authUser) return json({ error: "Unauthorized" }, 401);
    const { data: staff } = await admin.from("staff_reviewers")
      .select("active").eq("user_id", authUser.id).maybeSingle();
    if (!staff?.active) return json({ error: "Akun staff tidak aktif" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "list");
    if (action === "list") {
      const { data, error } = await admin.rpc("list_essay_complete_participants");
      if (error) throw error;
      return json({ participants: data ?? [] });
    }

    if (action === "update_status") {
      const participantId = String(body.participant_id ?? "");
      const status = String(body.status ?? "");
      if (!participantId || !["reviewed", "interview", "rejected"].includes(status)) {
        return json({ error: "Data keputusan tidak valid" }, 400);
      }
      const stageValue = status === "interview" ? "passed" : status === "rejected" ? "failed" : "pending";
      const { error: participantError } = await admin.from("participants")
        .update({ status }).eq("id", participantId);
      if (participantError) throw participantError;
      const { error: stageError } = await admin.rpc("admin_set_tahapan", {
        p_id: participantId, p_stage: "essay", p_value: stageValue,
      });
      if (stageError) throw stageError;
      return json({ ok: true });
    }

    return json({ error: "Aksi tidak dikenal" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Terjadi kesalahan" }, 500);
  }
});

