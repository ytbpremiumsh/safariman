import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.25.76";

const BodySchema = z.object({
  key: z.enum(["twibbon_frame_url", "poster_url"]),
  prefix: z.enum(["frame", "poster"]),
}).refine((data) => (
  (data.key === "twibbon_frame_url" && data.prefix === "frame") ||
  (data.key === "poster_url" && data.prefix === "poster")
), { message: "Jenis upload tidak valid" });

const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxSize = 8 * 1024 * 1024;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "Konfigurasi backend belum lengkap" }, 500);
    }

    const authorization = req.headers.get("Authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) {
      return json({ error: "Sesi admin tidak ditemukan" }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return json({ error: "Sesi admin tidak valid" }, 401);
    }

    const { data: roleRow, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      return json({ error: "Gagal memeriksa akses admin" }, 500);
    }
    if (!roleRow) {
      return json({ error: "Hanya admin yang bisa upload aset Twibbon" }, 403);
    }

    const form = await req.formData();
    const parsed = BodySchema.safeParse({
      key: form.get("key"),
      prefix: form.get("prefix"),
    });
    if (!parsed.success) {
      return json({ error: parsed.error.flatten().formErrors[0] ?? "Data upload tidak valid" }, 400);
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return json({ error: "File gambar belum dipilih" }, 400);
    }
    if (!allowedTypes.has(file.type)) {
      return json({ error: "File harus PNG, JPG, atau WEBP" }, 400);
    }
    if (file.size > maxSize) {
      return json({ error: "Ukuran file maksimal 8MB" }, 400);
    }

    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    const safeExt = ["png", "jpg", "jpeg", "webp"].includes(ext) ? ext : "png";
    const path = `${parsed.data.prefix}-${Date.now()}.${safeExt}`;

    const { error: uploadError } = await adminClient.storage
      .from("twibbon-assets")
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploadError) {
      return json({ error: uploadError.message || "Gagal upload file" }, 500);
    }

    const { data: publicUrlData } = adminClient.storage.from("twibbon-assets").getPublicUrl(path);
    const url = `${publicUrlData.publicUrl}?v=${Date.now()}`;

    const { error: settingError } = await adminClient.from("app_settings").upsert({
      key: parsed.data.key,
      value: url,
      updated_at: new Date().toISOString(),
    });

    if (settingError) {
      return json({ error: settingError.message || "Gagal menyimpan URL aset" }, 500);
    }

    return json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal upload";
    return json({ error: message }, 500);
  }
});