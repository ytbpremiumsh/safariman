import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json().catch(() => ({}));
    const token = String(body.token ?? "");
    const action = String(body.action ?? "update_status");

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify token
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("seleksi_private_tokens")
      .select("expires_at, reviewer_name")
      .eq("token", token)
      .maybeSingle();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Token expired" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list") {
      const { data: participants, error: participantError } = await supabaseClient
        .rpc("list_essay_complete_participants");
      if (participantError) throw participantError;
      const ids = (participants ?? []).map((participant: { id: string }) => participant.id);
      const { data: reviews, error: reviewError } = ids.length
        ? await supabaseClient.from("seleksi_private_reviews")
          .select("participant_id,reviewer_name,decision,reviewed_at,updated_at")
          .in("participant_id", ids)
        : { data: [], error: null };
      if (reviewError) throw reviewError;
      const reviewMap = new Map((reviews ?? []).map((review) => [review.participant_id, review]));
      return new Response(JSON.stringify({
        participants: (participants ?? []).map((participant: { id: string; status: string }) => {
          const review = reviewMap.get(participant.id) ?? null;
          return { ...participant, status: review?.decision ?? participant.status, private_review: review };
        }),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const participantId = String(body.participant_id ?? "");
    const status = String(body.status ?? "");
    const stageValue = String(body.stage_value ?? "");
    if (!participantId || !["reviewed", "interview", "rejected"].includes(status) ||
      !["pending", "passed", "failed"].includes(stageValue)) {
      return new Response(JSON.stringify({ error: "Data keputusan tidak valid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updateError } = await supabaseClient
      .from("participants")
      .update({ status })
      .eq("id", participantId);

    if (updateError) throw updateError;

    const { error: tahapanError } = await supabaseClient.rpc("admin_set_tahapan", {
      p_id: participantId,
      p_stage: "essay",
      p_value: stage_value,
    });

    if (tahapanError) throw tahapanError;

    const now = new Date().toISOString();
    const { data: review, error: reviewError } = await supabaseClient
      .from("seleksi_private_reviews")
      .upsert({
        participant_id: participantId,
        reviewer_name: tokenData.reviewer_name?.trim() || "Tim Seleksi Private",
        decision: status,
        reviewed_at: now,
        updated_at: now,
      }, { onConflict: "participant_id" })
      .select("reviewer_name,decision,reviewed_at,updated_at")
      .single();
    if (reviewError) throw reviewError;

    return new Response(JSON.stringify({ ok: true, review }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
