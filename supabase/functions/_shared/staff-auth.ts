import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.1";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

export function clients(req: Request) {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authorization = req.headers.get("Authorization") ?? "";
  return {
    user: createClient(url, anon, { global: { headers: { Authorization: authorization } } }),
    admin: createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } }),
  };
}

export async function authenticatedUser(req: Request) {
  const c = clients(req);
  const { data, error } = await c.user.auth.getUser();
  if (error || !data.user) return { ...c, authUser: null };
  return { ...c, authUser: data.user };
}
